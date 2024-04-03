import { ApplicationCommandOptionType, BooleanCache, PermissionFlagsBits, PermissionsBitField, ShardEvents } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import CountryModel from "../../models/Country";
import RegionModel, { RegionType } from "../../models/Region";
import ArmyModel from "../../models/Army";
import UnitModel from "../../models/Unit";
import { casulties } from "../../utils/manpower";
import CommanderModel from "../../models/Commander";

const disbandarmy: CommandTemplate = {
  name: "disbandarmy",
  description: "deals damadge to the enemy in your region",
  callback: async (client, interaction) => {
    await interaction.deferReply();

    // Get details from command options
    const nationName: string = interaction.options.get("nation-name")?.value as string;
    const armyName: string = interaction.options.get("army-name")?.value as string;

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

    await casulties(army, -1);

    for(const unitid of army.units) {
      await UnitModel.findByIdAndDelete(unitid);
      country.equipment += 1;
    }

    await army.deleteOne();
    await country.save();
    
    interaction.editReply(`Army ${army.name} has been disbanded`);
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
  ],
};

export default disbandarmy;
