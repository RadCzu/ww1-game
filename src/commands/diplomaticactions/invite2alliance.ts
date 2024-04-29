import { ActionRow, ApplicationCommandOptionType, GuildBasedChannel, PermissionFlagsBits, PermissionsBitField, TextBasedChannel } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import TurnCounterModel, { TurnCounterType } from "../../models/Turn";
import CountryModel, { CountryType } from "../../models/Country";
import WarModel from "../../models/War";
import AllianceModel, { AllianceType } from "../../models/Alliance";
import { addInteractionData } from "../../models/InteractionData";
import { allianceExists, areAllied, areAtWar } from "../../utils/diplomacy";
const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

const invite2alliance: CommandTemplate = {
  name: "invite2alliance",
  description: "Send an alliance offer to another player",
  callback: async (client, interaction) => {
    await interaction.deferReply();
    
    const userID = interaction.user.id;
    const nationName: string = interaction.options.get("nation-name")?.value as string;
    const otherNationName: string = interaction.options.get("other-nation-name")?.value as string;
    const allianceName: string = interaction.options.get("alliance-name")?.value as string;

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

    if(!await allianceExists(interaction.guildId, allianceName)) {
      interaction.editReply(
        `This alliance does not exist`
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

    if (country.politicalPower < 3) {
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

    const alliance = await AllianceModel.findOne({guildId: interaction.guildId, name: allianceName, memberNationIds: { 
      $all: [country._id.toString(),] 
    }})

    if(!alliance) {
      interaction.editReply(
        `You arent a part of this alliance`
      );
      return;
    }

    if(alliance.memberNationIds.includes(otherCountry._id.toString())) {
      interaction.editReply(
        `They are already a part of this alliance`
      );
      return;
    }


    if(await areAtWar(country, otherCountry)) {
      interaction.editReply(
        `Sorry, but you are at war with them`
      );
      return;
    }

    // Create the buttons
    const acceptButton = new ButtonBuilder()
        .setCustomId(`acceptNewAllianceMember${interaction.id}`)
        .setLabel(`👍 Accept ${otherNationName}`)
        .setStyle(ButtonStyle.Success);

    const declineButton = new ButtonBuilder()
        .setCustomId(`declineNewAllianceMember${interaction.id}`)
        .setLabel(`👎 Reject ${otherNationName}`)
        .setStyle(ButtonStyle.Danger);

    // Create the action row containing the buttons
    const actionRow = new ActionRowBuilder()
        .addComponents(acceptButton, declineButton);

    // Build the attachment with buttons
    const attachment = {
        content: `${nationName} has made a proposition to invite ${otherCountry.name} into '${allianceName}'`,
        components: [actionRow]
    };

    const allianceChannel = interaction.guild?.channels.cache.find(channel => channel.id === `${alliance.channelId}`);
    if (allianceChannel?.isTextBased()) {
      const textBasedChannel = allianceChannel as TextBasedChannel;
      const message = await textBasedChannel.send(attachment);

      const interactionArgs = {
        otherCountryId: otherCountry._id,
        guildId: interaction.guildId,
        allianceId: alliance._id.toString(),
        usedBy: [country.userId,],
      }
  
      addInteractionData({identifier: interaction.id, data: interactionArgs});
    } else if (!allianceChannel){
      interaction.editReply(`cannot find the correct message channel`);
      return;
    }

    //pp cost
    country.politicalPower -= 3;
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
    {
      name: "alliance-name",
      required: true,
      description: "Name of this new alliance",
      type: ApplicationCommandOptionType.String,
    },
  ]
};

export default invite2alliance;
