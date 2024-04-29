import { ActionRow, ApplicationCommandOptionType, GuildBasedChannel, PermissionFlagsBits, PermissionsBitField, TextBasedChannel } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import TurnCounterModel, { TurnCounterType } from "../../models/Turn";
import CountryModel, { CountryType } from "../../models/Country";
import WarModel from "../../models/War";
import AllianceModel, { AllianceType } from "../../models/Alliance";
import { addInteractionData } from "../../models/InteractionData";
import { allianceExists, areAllied, areAtWar } from "../../utils/diplomacy";
const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

const peace: CommandTemplate = {
  name: "peace",
  description: "Send a peace offer to another player",
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

    if(!await areAtWar(country, otherCountry)) {
      interaction.editReply(
        `Sorry, but you are not at war with them`
      );
      return;
    }

    if(await areAllied(country, otherCountry, interaction.guildId)) {
      interaction.editReply(
        `You are allied!?`
      );
      return;
    }

    // Create the buttons
    const acceptButton = new ButtonBuilder()
        .setCustomId(`acceptPeace${interaction.id}`)
        .setLabel('🕊️ Accept')
        .setStyle(ButtonStyle.Success);

    const declineButton = new ButtonBuilder()
        .setCustomId(`declinePeace${interaction.id}`)
        .setLabel('⚔️ Decline')
        .setStyle(ButtonStyle.Danger);

    // Create the action row containing the buttons
    const actionRow = new ActionRowBuilder()
        .addComponents(acceptButton, declineButton);

    // Build the attachment with buttons
    const attachment = {
        content: `${nationName} sends a peace offer`,
        components: [actionRow]
    };

    const otherCountryChannel = interaction.guild?.channels.cache.find(channel => channel.name === `${otherCountry.name.toLowerCase()}`);
    if (otherCountryChannel?.isTextBased()) {
      const textBasedChannel = otherCountryChannel as TextBasedChannel;
      
      const otherCountryMember = await interaction.guild?.members.fetch(otherCountry.userId);
      if (otherCountryMember) {
        attachment.content = `${otherCountryMember}, ${country.name} sends a peace offer`
      } else {
        attachment.content = `${country.name} sends a peace offer`
      }
      const message = await textBasedChannel.send(attachment);
      const interactionArgs = {
        countryId: country._id,
        otherCountryId: otherCountry._id,
        guildId: interaction.guildId,
        turn: turn.turn,
      }
  
      addInteractionData({identifier: interaction.id, data: interactionArgs});
    } else if (!otherCountryChannel){
      interaction.editReply(`cannot find the correct message channel`);
      return;
    }

    //pp cost
    country.politicalPower -= 10;
    await country.save();

    interaction.editReply(`proposition sent!`);
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

export default peace;
