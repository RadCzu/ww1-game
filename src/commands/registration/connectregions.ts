import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import { setRegionConnection } from "../../utils/setRegionNeighbour";

const connectRegions: CommandTemplate = {
  name: "connectregions",
  description: "Connects two regions as neighbors (admin only)",
  callback: async (client, interaction) => {
    await interaction.deferReply();

    // Get region names from the command options
    const regionName1: string = interaction.options.get("region-name-1")?.value as string;
    const regionName2: string = interaction.options.get("region-name-2")?.value as string;

    // Call the setRegionConnection function to connect the regions
    await setRegionConnection(regionName1, regionName2, interaction.guildId as string);

    interaction.editReply(`Regions ${regionName1} and ${regionName2} are now neighbors successfully!`);
  },
  options: [
    {
      name: "region-name-1",
      description: "The name of the first region to connect",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "region-name-2",
      description: "The name of the second region to connect",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
  ],
  permissionsRequired: [PermissionFlagsBits.Administrator],
  botPermissions: [PermissionFlagsBits.Administrator],
};

export default connectRegions;
