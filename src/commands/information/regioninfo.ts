import { ApplicationCommandOptionType, PermissionFlagsBits, PermissionsBitField } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import RegionModel, { RegionType } from "../../models/Region";
import getRegionDescription from "../../utils/getRegionInformation";
import CountryModel, { CountryType } from "../../models/Country";

const regionInfo: CommandTemplate = {
  name: "regioninfo",
  description: "Displays information about a region",
  callback: async (client, interaction) => {
    await interaction.deferReply();

    // Get region name from the command options
    const regionName: string = interaction.options.get("region-name")?.value as string;

    // Fetch the region from the database
    const region = await RegionModel.findOne({ name: regionName, guildId: interaction.guildId }) as RegionType | null;

    if (!region) {
      interaction.editReply(`Region ${regionName} not found.`);
      return;
    }

    const nation = await CountryModel.findById(region.nationId) as CountryType;
    const requiredPerms: PermissionsBitField = interaction.member?.permissions as PermissionsBitField;
    if(!nation || interaction.member?.user.id === nation.userId || requiredPerms.has(PermissionFlagsBits.Administrator) ) {

      // Use the getRegionDescription function to get the region information
      const regionDescription = await getRegionDescription(region, true);

      // Display the region information
      interaction.editReply(`Region Information for ${region.name}:${regionDescription}`);

    } else {
      // Display refusal to show information
      interaction.editReply(`You are not the owner of this region`);
    }
  },
  options: [
    {
      name: "region-name",
      description: "The name of the region",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
  ],
};

export default regionInfo;