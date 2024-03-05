import { ApplicationCommandOptionType, GuildBasedChannel, PermissionFlagsBits, PermissionsBitField, TextBasedChannel } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import CountryModel, { CountryType } from "../../models/Country";
import TurnLogModel, { TurnLogType } from "../../models/TurnLog";
import TurnCounterModel from "../../models/Turn";
import ArmyModel, { ArmyType } from "../../models/Army";
import RegionModel, { RegionType } from "../../models/Region";
import UnitModel from "../../models/Unit";
import { equipmentCost } from "../../utils/equipment";



const drill: CommandTemplate = {
  name: "drill",
  description: "(instant) army gets experience for equipment",
  callback: async (client, interaction) => {
    await interaction.deferReply();

    const armyName = interaction.options.get("army-name")?.value;
    const countryName = interaction.options.get("nation-name")?.value;

    if(!armyName || !countryName || !interaction.guildId ) {
      interaction.editReply(
        `input error`
      );
      return;
    }

    const turn = await TurnCounterModel.findOne({guildId: interaction.guildId});

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

    const units = await UnitModel.find({armyId: army._id});

    if(!units) {
      interaction.editReply(
        `${armyName} is empty`
      );
      return;
    }


    let eqloss = 0;

    for(const unit of units) {
      eqloss += equipmentCost(unit);
    }

    if(country.equipment < eqloss) {
      interaction.editReply(
        `Not enough equipment`
      );
      return;
    }

    //action check  
    if(country.actions > 0) {
      country.actions -= 1;
      country.equipment -= eqloss;
      await country.save();
    } else {
      interaction.editReply(
        `Not enough actions`
      );
      return;
    }

    for(const unit of units) {
      unit.combatExperience += 1;
      await unit.save();
    }

    interaction.editReply(
      `Order to drill with ${armyName} was accepted, you now have ${country.actions} actions left`
    );

    if (turn?.announcementChannelId) {
      const announcementChannel = interaction.guild?.channels.cache.get(turn.announcementChannelId);
      if (announcementChannel?.isTextBased()) {
        const textBasedChannel = announcementChannel as TextBasedChannel;
        await textBasedChannel.send(`${country.name} is drilling its troops!`);
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
  ]
};

export default drill;
