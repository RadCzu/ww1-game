import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import  setRegionOwner  from "../../utils/setRegionOwner";

const assignRegionToCountry: CommandTemplate = {
  name: "assignregion",
  description: "Assigns a region to a country (admin only)",
  callback: async (client, interaction) => {
    await interaction.deferReply();

    // Get region name and country name from the command options
    const regionName: string = interaction.options.get("region-name")?.value as string;
    const countryName: string = interaction.options.get("country-name")?.value as string;
    const capital: boolean = interaction.options.get("capital")?.value as boolean;

    // Get the user ID of the new owner
    const userId: string = interaction.options.get("owner")?.value as string;
    console.log("assigning region to user");
    // Call the setRegionOwner function to assign the region to the country
    await setRegionOwner(regionName, countryName, interaction.guildId as string, userId, false, capital);

    interaction.editReply(`Region ${regionName} assigned to country ${countryName} successfully!`);
  },
  options: [
    {
      name: "region-name",
      description: "The name of the region to be assigned",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "country-name",
      description: "The name of the country to assign the region to",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "owner",
      description: "The new owner of the region",
      required: true,
      type: ApplicationCommandOptionType.Mentionable,
    },
    {
      name: "capital",
      description: "should this region be reassigned as the capital",
      required: false,
      type: ApplicationCommandOptionType.Boolean,
    },
  ],
  permissionsRequired: [PermissionFlagsBits.Administrator],
  botPermissions: [PermissionFlagsBits.Administrator],
};

export default assignRegionToCountry;