import { ApplicationCommandOptionType, PermissionFlagsBits, PermissionsBitField } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import Country, { CountryType } from "../../models/Country";
import RegionModel, { RegionType } from "../../models/Region";
import getRegionDescription from "../../utils/getRegionInformation";

const countryinfo: CommandTemplate = {
  name: "countryinfo",
  description: "displays information about the country",
  callback: async (client, interaction) => {
    await interaction.deferReply();
    const userID = interaction.user.id;
    const nationName: string = interaction.options.get("nation-name")?.value as string;

    let query;

    const requiredPerms: PermissionsBitField = interaction.member?.permissions as PermissionsBitField;
    if (requiredPerms.has(PermissionFlagsBits.Administrator)) {
      query = {
        name: nationName,
        guildId: interaction.guildId,
      };
    } else {
      query = {
        userId: userID,
        name: nationName,
        guildId: interaction.guildId,
      };
    }

    const country = await Country.findOne(query) as CountryType;

    if(!country) {
      interaction.editReply(
        `Nation does not exist, or you do not have the permissions required to view its stats`
      );
    }

    // Format the country information into a nice-looking message
      let countryInfoMessage = `
      **Nation Information for ${country.name}**
     
      - Stability: ${country.stability}
      - Political Power: ${country.politicalPower}
      - Technology Level: ${country.tech}
      - Money: ${country.money}$\n
      **Regions:**
    `;

  // Fetch and append region information
  for (const regionId of country.regions) {
    const region = await RegionModel.findById(regionId) as RegionType;
    if (region) {
      countryInfoMessage += await getRegionDescription(region, false);
    }
  }
  
    interaction.editReply(countryInfoMessage);
  },
  options: [
    {
      name: "nation-name",
      required: true,
      description: "The name of the nation",
      type: ApplicationCommandOptionType.String,
    },
  ],
};

export default countryinfo;