import { ApplicationCommandOptionType, GuildBasedChannel, PermissionFlagsBits, PermissionsBitField, TextBasedChannel } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import CountryModel, { CountryType } from "../../models/Country";
import TurnLogModel, { TurnLogType } from "../../models/TurnLog";
import TurnCounterModel from "../../models/Turn";
import ArmyModel, { ArmyType } from "../../models/Army";
import RegionModel, { RegionType } from "../../models/Region";
import AllianceModel from "../../models/Alliance";
import WarModel from "../../models/War";

async function isArmySubjectToAction(armyId: string, guildId: string, nationId: string, turn: number): Promise<boolean> {
  // Check if the army is subject to any other action in the logs
  const existingLogs: TurnLogType[] = await TurnLogModel.find({
    guildId,
    nationId,
    turn,
  }) as TurnLogType[];

  
  for (const log of existingLogs) {
    let isMoving: boolean = false;

    if(log.action === "invade" || log.action === "movearmy" || log.action === "retreat") {
      isMoving = true;
    }

    const args = log.args;
    for (const arg of args) {
      if (arg.toString() === armyId && isMoving) {
        return true;  // This will exit the outer function
      }
    }
  }
  
  console.log("No match found");
  return false;  // This will be reached if no match is found
};


const retreat: CommandTemplate = {
  name: "retreat",
  description: "order an retreat of an army (or all armies) to a region",
  callback: async (client, interaction) => {
    await interaction.deferReply();

    const armyName = interaction.options.get("army-name")?.value;
    const countryName = interaction.options.get("nation-name")?.value;
    const regionName = interaction.options.get("to-region")?.value;
    let allForces = interaction.options.get("all-forces")?.value;

    if(!allForces) {
      allForces = false;
    }

    if(!armyName || !countryName || !interaction.guildId || !regionName ) {
      interaction.editReply(
        `input error`
      );
      return;
    }

    const turn = await TurnCounterModel.findOne({guildId: interaction.guildId});

    if(!turn) {
      interaction.editReply(
        `No turn counter`
      );
      return;
    }

    //country check  
    let query;
    const requiredPerms: PermissionsBitField = interaction.member?.permissions as PermissionsBitField;
    if (requiredPerms.has(PermissionFlagsBits.Administrator)) {
      query = {
        name: countryName,
        guildId: interaction.guildId,
      };
    } else {
      query = {
        userId: interaction.user.id,
        name: countryName,
        guildId: interaction.guildId,
      };
    }

    const country = await CountryModel.findOne(query);

    if(!country ) {
      interaction.editReply(
        `This country does not exist or it does not belong to you`
      );
      return;
    }

    const army: ArmyType = await ArmyModel.findOne({
      nationId: country._id,
      name: armyName,
    }) as ArmyType;

    if(!army) {
      interaction.editReply(
        `${armyName} does not exist, check for potential typos and case differences`
      );
      return;
    }

    const currentRegion: RegionType = await RegionModel.findById(army.regionId) as RegionType;
    const nextRegion: RegionType = await RegionModel.findOne({name: regionName, guildId: interaction.guildId}) as RegionType;

    if(!currentRegion || !nextRegion || !currentRegion._id){
      interaction.editReply(
        `The region does not exist, or the army is in a void`
      );
      return;
    }

    if(currentRegion.defendingArmies === undefined || currentRegion.defendingArmies.length <= 0 || currentRegion.attackingArmies === undefined || currentRegion.attackingArmies.length <= 0) {
      interaction.editReply(
        `Army needs to be in combat`
      );
      return;
    }


    if(currentRegion._id === nextRegion._id) {
      interaction.editReply(
        `Army ${armyName} is already in ${regionName} region`
      );
      return;
    }

    if (!currentRegion.neighbours || !currentRegion.neighbours.includes(nextRegion._id?.toString() as string)) {
      interaction.editReply(
        `The ${regionName} is not a connected to ${currentRegion.name}`
      );
      return;
    }

    const acting = await isArmySubjectToAction(army._id?.toString() as string, interaction.guildId, country._id, turn.turn);
    if(acting) {
      interaction.editReply(
        `${armyName} already has other orders`
      );
      return;
    }

    const alliances = await AllianceModel.find({ guildId: nextRegion.guildId, memberNationIds: { $elemMatch: { $eq: army.nationId }}});

    const allianceMemberNationIds = alliances.map(alliance => alliance.memberNationIds).flat();
    const ownedNeighbouringRegions = await RegionModel.find({ nationId: { $in: allianceMemberNationIds }, guildId: nextRegion.guildId });

    if(nextRegion._id)
    if(!ownedNeighbouringRegions.some( region => nextRegion._id?.toString() === region._id.toString())) {
      interaction.editReply(
        `Cannot retreat to a non-allied region`
      );
      return;
    }

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

    const newAction: TurnLogType = {
      guildId: interaction.guildId,
      nationId: country._id.toString(),
      turn: turn.turn,
      action: 'retreat',
      args: [army._id, nextRegion._id, allForces],
    };

    TurnLogModel.create(newAction);

    interaction.editReply(
      `Order to retreat with ${armyName} to ${regionName} was accepted, you now have ${country.actions} actions left`
    );
  },
  options: [
    {
      name: "nation-name",
      description: "Your nation",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "army-name",
      description: "the specific army",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "to-region",
      description: "region you are reatreating to",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "all-forces",
      description: "conditional",
      required: false,
      type: ApplicationCommandOptionType.Boolean,
    },
  ]
};

export default retreat;
