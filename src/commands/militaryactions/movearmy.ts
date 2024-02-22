import { ApplicationCommandOptionType, GuildBasedChannel, PermissionFlagsBits, PermissionsBitField, TextBasedChannel } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import CountryModel, { CountryType } from "../../models/Country";
import TurnLogModel, { TurnLogType } from "../../models/TurnLog";
import TurnCounterModel from "../../models/Turn";
import ArmyModel, { ArmyType } from "../../models/Army";
import RegionModel, { RegionType } from "../../models/Region";

async function isArmySubjectToAction(armyId: string, guildId: string, nationId: string, turn: number): Promise<boolean> {
  // Check if the army is subject to any other action in the logs
  const existingLogs: TurnLogType[] = await TurnLogModel.find({
    guildId,
    nationId,
    turn,
  }) as TurnLogType[];

  
  for (const log of existingLogs) {
    let isMoving: boolean = false;
    if(log.action === "invade" || log.action === "movearmy" || log.action === "attack") {
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

const movearmy: CommandTemplate = {
  name: "movearmy",
  description: "move an army to a nearby region",
  callback: async (client, interaction) => {
    await interaction.deferReply();
    const armyName = interaction.options.get("army-name")?.value;
    const regionName = interaction.options.get("region-name")?.value;
    const countryName = interaction.options.get("nation-name")?.value;

    if(!armyName || !regionName || !countryName || !interaction.guildId) {
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

    if(!country) {
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

    if(!currentRegion || !nextRegion){
      interaction.editReply(
        `The region does not exist, or the army is in a void`
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

    if(currentRegion.attackingArmies && currentRegion.attackingArmies?.length > 0) {
      interaction.editReply(
        `${armyName} cannot use this command to escape combat.\nUse /retreat instead!`
      );
      return;
    }
    
    //action check  
    if(country.actions > 0) {
      country.actions -= 1;
      country.save();
    } else {
      interaction.editReply(
        `Not enough actions`
      );
      return;
    }
    if(!nextRegion._id) {
      interaction.editReply(
        `Not id`
      );
      return;
    }
    const newAction: TurnLogType = {
      guildId: interaction.guildId,
      nationId: country._id.toString(),
      turn: turn.turn,
      action: 'movearmy',
      args: [army._id?.toString(), nextRegion._id.toString()],
    };

    TurnLogModel.create(newAction);

    interaction.editReply(
      `Order 'move ${armyName} to ${regionName}' was accepted, you now have ${country.actions} actions left`
    );

    if (turn?.announcementChannelId) {
      const announcementChannel = interaction.guild?.channels.cache.get(turn.announcementChannelId);
      if (announcementChannel?.isTextBased()) {
        const textBasedChannel = announcementChannel as TextBasedChannel;
        await textBasedChannel.send(`${countryName} is moving its troops!`);
      }
    }
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
      name: "region-name",
      description: "region you want it to move into",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
  ]
};

export default movearmy;
