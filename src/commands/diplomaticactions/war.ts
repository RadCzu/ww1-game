import { ActionRow, ApplicationCommandOptionType, GuildBasedChannel, PermissionFlagsBits, PermissionsBitField, TextBasedChannel } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import TurnCounterModel, { TurnCounterType } from "../../models/Turn";
import CountryModel, { CountryType } from "../../models/Country";
import WarModel, { WarType } from "../../models/War";
import AllianceModel, { AllianceType } from "../../models/Alliance";
import { addInteractionData } from "../../models/InteractionData";
import { allianceExists, areAllied, areAtWar } from "../../utils/diplomacy";
const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

const war: CommandTemplate = {
  name: "war",
  description: "Send an war declaration to another player",
  callback: async (client, interaction) => {
    await interaction.deferReply();
    
    const userID = interaction.user.id;
    const nationName: string = interaction.options.get("nation-name")?.value as string;
    const otherNationName: string = interaction.options.get("other-nation-name")?.value as string;

    const turn = await TurnCounterModel.findOne({guildId: interaction.guildId});

    if(!turn) {
      interaction.editReply(
        `No turn counter`
      );
      return;
    }

    if(!interaction.guildId) {
      interaction.editReply(
        `guild-only command!`
      );
      return;
    }

    let query;
    const requiredPerms: PermissionsBitField = interaction.member?.permissions as PermissionsBitField;
    if (requiredPerms.has(PermissionFlagsBits.Administrator)) {
      query = {
        name: nationName,
        guildId: interaction.guildId,
      };
    } else {
      query = {
        userId: userID,
        name: nationName,
        guildId: interaction.guildId,
      };
    }

    const country = await CountryModel.findOne(query);
    const otherCountry = await CountryModel.findOne({name: otherNationName, guildId: interaction.guildId});

    if (!country) {
      interaction.editReply(
        `Nation does not exist, or is not yours`
      );
      return;
    }

    if (country.politicalPower < 10) {
      interaction.editReply(
        `Not enough political power`
      );
      return;
    }

    if (!otherCountry) {
      interaction.editReply(
        `The other nation you provided does not exist, check for potential typos`
      );
      return;
    }

    if(await areAtWar(country, otherCountry)) {
      interaction.editReply(
        `Sorry, but you are already at war with them`
      );
      return;
    }

    if(await areAllied(country, otherCountry, interaction.guildId)) {
      interaction.editReply(
        `You are allied, you cannot declare war on them`
      );
      return;
    }

    //action check  
    if(country.actions > 0) {
      const otherCountryChannel = interaction.guild?.channels.cache.find(channel => channel.name === `${otherCountry.name.toLowerCase()}`);
      if (otherCountryChannel?.isTextBased()) {
        const textBasedChannel = otherCountryChannel as TextBasedChannel;
        const otherCountryMember = await interaction.guild?.members.fetch(otherCountry.userId);
        if (otherCountryMember) {
          await textBasedChannel.send(`${otherCountryMember}, ${country.name} has declared war on you, prepare your defences!`);
        } else {
          await textBasedChannel.send(`${country.name} has declared war on you!`);
        }
      } else if (!otherCountryChannel){
        interaction.editReply(`cannot find the correct message channel`);
        return;
      }
      country.actions -= 1;
      country.politicalPower -= 10;
      await country.save();
    } else {
      interaction.editReply(
        `Not enough actions`
      );
      return;
    }

    let warModel = await WarModel.findOne({ $or: [
      { defenderId: country._id?.toString(), attackerId: otherCountry._id?.toString() }, 
      { defenderId: otherCountry._id?.toString(), attackerId: country._id?.toString() }
    ]});

    if(!warModel) {
      const newWar: WarType = {
        attackerId: country.id,
        defenderId: otherCountry.id,
        winrate: 0.5,
        ongoing: true,
        attackerWins: 0,
        defenderWins: 0
      }
      warModel = await WarModel.create(newWar);
    }

    warModel.ongoing = true;

    await warModel.save();

    interaction.editReply(`War declared!`);
    return;
  },
  options: [
    {
      name: "nation-name",
      required: true,
      description: "Your nation name",
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "other-nation-name",
      required: true,
      description: "Nation you want to ally",
      type: ApplicationCommandOptionType.String,
    },
  ]
};

export default war;
