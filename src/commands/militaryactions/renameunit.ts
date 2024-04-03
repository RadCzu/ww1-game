import { ApplicationCommandOptionType, BooleanCache, PermissionFlagsBits, PermissionsBitField, ShardEvents } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import CountryModel from "../../models/Country";
import RegionModel, { RegionType } from "../../models/Region";
import ArmyModel from "../../models/Army";
import UnitModel from "../../models/Unit";
import { casulties } from "../../utils/manpower";
import { isNullOrUndefined } from "util";

const renameunit: CommandTemplate = {
  name: "renameunit",
  description: "renames a unit",
  callback: async (client, interaction) => {
    await interaction.deferReply();

    // Get details from command options
    const nationName: string = interaction.options.get("nation-name")?.value as string;
    const armyName: string = interaction.options.get("army-name")?.value as string;
    const index: number = interaction.options.get("unit-index")?.value as number - 1;
    const unitName: string = interaction.options.get("new-name")?.value as string;

    // Fetch country from the database
    let country = await CountryModel.findOne({ name: nationName, userId: interaction.user.id, guildId: interaction.guildId });

    if (!country) {
      const requiredPerms: PermissionsBitField = interaction.member?.permissions as PermissionsBitField;
      if (requiredPerms.has(PermissionFlagsBits.Administrator)) {
      country = await CountryModel.findOne({ name: nationName, guildId: interaction.guildId });
      }

      if (!country) {
        interaction.editReply(`No country ${nationName} exists.`);
        return;
      }
    }

    const army = await ArmyModel.findOne({name: armyName, nationId: country._id.toString()});

    if(!army) {
      interaction.editReply(`No army of this name exists under ${nationName}, check for potential typos`);
      return;
    }

    if(!army.units[index]) {
      interaction.editReply(`A unit with this index does not exist`);
      return;
    }

    const unit = await UnitModel.findById(army.units[index]);

    if(unit === undefined || unit === null) {
      interaction.editReply(`Unit missing`);
      return;
    }

    unit.name = unitName;

    await unit.save();
    
    interaction.editReply(`Unit ${index} of army ${army.name} is now known as: '${unit.name}' `);
  },
  options: [
    {
      name: "nation-name",
      description: "The name of the nation",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "army-name",
      description: "The name of the army",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "unit-index",
      description: "index of the unit within the army",
      required: true,
      type: ApplicationCommandOptionType.Number,
    },
    {
      name: "new-name",
      description: "new name of the unit",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
  ],
};

export default renameunit;
