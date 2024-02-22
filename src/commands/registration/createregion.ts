import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import RegionModel, { RegionType } from "../../models/Region";

const createRegion: CommandTemplate = {
  name: "createregion",
  description: "Creates a new region (admin only)",
  callback: async (client, interaction) => {
    await interaction.deferReply();

    if(!interaction.guild) {
      interaction.editReply(`No, this is not a guild`);
      return;
    }

    // Get region details from the command options
    const regionName: string = interaction.options.get("region-name")?.value as string;
    const terrain: string = interaction.options.get("terrain")?.value as string;
    const population: number = interaction.options.get("population")?.value as number;
    const manpower: number = Math.floor(population * 0.15);
    const factories: number = interaction.options.get("factories")?.value as number;
    const taxes: number = interaction.options.get("taxes")?.value as number;

    // Create a new region object
    const newRegion: RegionType = {
      name: regionName,
      terrain: terrain,
      population: population,
      manpower: manpower,
      factories: factories,
      taxes:  taxes,
      guildId: interaction.guild?.id,
    };

    // Save the new region to the database
    const region = new RegionModel(newRegion);
    await region.save();

    interaction.editReply(`Region ${regionName} created successfully!`);
  },
  options: [
    {
      name: "region-name",
      description: "The name of the new region",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "terrain",
      description: "The terrain of the new region",
      required: true,
      type: ApplicationCommandOptionType.String,
      choices: [
        {
          name: "Plains region",
          value: "PLAINS",
        },
        {
          name: "Wasteland region",
          value: "WASTELAND",
        },
        {
          name: "Wodds or Hills region",
          value: "WOODS",
        },
        {
          name: "Mountainous region",
          value: "MOUNTAINS",
        },
        {
          name: "Coastal region",
          value: "COAST",
        },
      ]
    },
    {
      name: "population",
      description: "The population of the new region",
      required: true,
      type: ApplicationCommandOptionType.Integer,
    },
    {
      name: "factories",
      description: "The number of factories in the new region",
      required: true,
      type: ApplicationCommandOptionType.Integer,
    },
    {
      name: "taxes",
      description: "The amount of money the region provides",
      required: true,
      type: ApplicationCommandOptionType.Integer,
    },
  ],
  permissionsRequired: [PermissionFlagsBits.Administrator],
  botPermissions: [PermissionFlagsBits.Administrator],
};

export default createRegion;