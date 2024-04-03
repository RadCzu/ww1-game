import { ApplicationCommandOptionType, BooleanCache, PermissionFlagsBits, PermissionsBitField, ShardEvents } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import CountryModel from "../../models/Country";
import RegionModel, { RegionType } from "../../models/Region";
import ArmyModel from "../../models/Army";
import UnitModel from "../../models/Unit";
import { casulties } from "../../utils/manpower";
import { isNullOrUndefined } from "util";
import TurnLogModel, { TurnLogType } from "../../models/TurnLog";
import TurnCounterModel from "../../models/Turn";

async function findAllMoveUnitActions(guildId: string, nationId: string, turn: number): Promise<TurnLogType[]> {
  // Check if the army is subject to any other action in the logs
  const existingLogs: TurnLogType[] = await TurnLogModel.find({
    guildId,
    nationId,
    turn,
  }) as TurnLogType[];

  const moveUnitActions: TurnLogType[] = [];
  
  for (const log of existingLogs) {
    if(log.action === "moveUnit") {
      if(log.nationId === nationId) {
        moveUnitActions.push(log);
      }
    }
  }

  return moveUnitActions;
}

const moveunit: CommandTemplate = {
  name: "moveunit",
  description: "renames a unit",
  callback: async (client, interaction) => {
    await interaction.deferReply();

    if(!interaction.guildId) {
      interaction.editReply(
        `Guild only command!`
      );
      return;
    }

    // Get details from command options
    const nationName: string = interaction.options.get("nation-name")?.value as string;
    const armyName: string = interaction.options.get("army-name")?.value as string;
    const index: number = interaction.options.get("unit-index")?.value as number - 1;
    const newArmyName: string = interaction.options.get("new-army-name")?.value as string;

    const turn = await TurnCounterModel.findOne({guildId: interaction.guildId});

    if(!turn) {
      interaction.editReply(
        `No turn counter`
      );
      return;
    }

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


    const newArmy = await ArmyModel.findOne({name: newArmyName, nationId: country._id.toString()});

    if(!army || !newArmy) {
      interaction.editReply(`No army of this name exists under ${nationName}, check for potential typos`);
      return;
    }

    if(!army.units[index]) {
      interaction.editReply(`A unit with this index does not exist`);
      return;
    }

    if(army?.units.length <= 1) {
      interaction.editReply(`Cannot move the last unit of this army`);
      return;
    }

    const unit = await UnitModel.findById(army.units[index]);

    if(unit === undefined || unit === null) {
      interaction.editReply(`Unit missing`);
      return;
    }

    const moveUnitActions = await findAllMoveUnitActions(interaction.guildId, country._id.toString(), turn.turn);

    if(moveUnitActions.some((action) => {
      return action.args[1] === unit._id.toString()
    })) {
      interaction.editReply(
        `Unit already moving`
      );
      return
    }

    if(moveUnitActions.length % 8 === 0) {
          //action check  
          if(country.actions > 0) {
            country.actions -= 1;
            await country.save();
          } else {
            interaction.editReply(
              `Not enough actions`
            );
            return;
          }
    }

    const newAction: TurnLogType = {
      guildId: interaction.guildId,
      nationId: country._id.toString(),
      turn: turn.turn,
      action: 'moveUnit',
      args: [army._id.toString(), unit._id.toString(), newArmy._id.toString()],
    };

    TurnLogModel.create(newAction);

    await unit.save();
    
    interaction.editReply(`Unit ${index + 1} '${unit.name}' of army ${army.name} is now moved to army '${newArmy.name}' `);
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
      name: "new-army-name",
      description: "the name of the new army",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
  ],
};

export default moveunit;
