import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import Country, { CountryType } from "../../models/Country";

const setcountry: CommandTemplate = {
  name: "setcountry",
  description: "This command is used to set stats to countries by the game master",
  callback: async (client, interaction) => {
    await interaction.deferReply();

    const nationName: string = interaction.options.get("nation-name")?.value as string;
    const userId: string = interaction.options.get("nation-owner")?.value as string;
    const guildId = interaction.guildId;

    // Fetch the country from the database
    const country = await Country.findOne({ userId, name: nationName, guildId });

    if (!country) {
      interaction.editReply(`Country ${nationName} not found in the database.`);
      return;
    }

    // Update the country object with provided values for optional parameters
    const stability = interaction.options.get("stability")?.value as number;
    const politicalPower = interaction.options.get("political-power")?.value as number;
    const tech = interaction.options.get("tech")?.value as number;
    const money = interaction.options.get("money")?.value as number;

    if (stability !== undefined) country.stability = stability;
    if (politicalPower !== undefined) country.politicalPower = politicalPower;
    if (tech !== undefined) country.tech = tech;
    if (money !== undefined) country.money = money;

    // Save the updated country back to the database
    await country.save();

    interaction.editReply(`Country ${nationName} stats edited successfully!`);
  },
  options: [
    {
      name: "nation-owner",
      description: "The nation owner",
      required: true,
      type: ApplicationCommandOptionType.Mentionable,
    },
    {
      name: "nation-name",
      required: true,
      description: "The name of this new nation",
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "stability",
      description: "Stability of the country",
      required: false,
      type: ApplicationCommandOptionType.Integer,
    },
    {
      name: "political-power",
      description: "Political power of the country",
      required: false,
      type: ApplicationCommandOptionType.Integer,
    },
    {
      name: "tech",
      description: "Technology level of the country",
      required: false,
      type: ApplicationCommandOptionType.Integer,
    },
    {
      name: "money",
      description: "Money of the country",
      required: false,
      type: ApplicationCommandOptionType.Integer,
    },
  ],
  permissionsRequired: [PermissionFlagsBits.Administrator],
  botPermissions: [PermissionFlagsBits.Administrator],
};

export default setcountry;