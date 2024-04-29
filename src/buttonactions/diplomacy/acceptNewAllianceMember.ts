import { inherits } from "util";
import ButtonAction from "../../models/ButtonAction";
import { addInteractionData, deleteInteractionData, getInteractionData } from "../../models/InteractionData";
import AllianceModel, { AllianceType } from "../../models/Alliance";
import CountryModel from "../../models/Country";
import { areAtWar, areAllied, allianceExists } from "../../utils/diplomacy";
import { ActionRow, ActionRowBuilder, ActionRowData, ButtonBuilder, ButtonComponent, ButtonStyle, CategoryChannelResolvable, ChannelType, ComponentType, GuildChannelResolvable, GuildMember, MessageActionRowComponentBuilder, MessageActionRowComponentData, MessagePayload, OverwriteResolvable, PermissionFlagsBits, Role, TextBasedChannel } from "discord.js";
import TurnCounterModel from "../../models/Turn";


const acceptNewAllianceMember: ButtonAction = {
  name: "acceptNewAllianceMember",
  async execute(client, interaction, customId): Promise<void> {
    if(interaction.isRepliable()){
      const cleanedId: string = customId.replace(/^acceptNewAllianceMember/, '');

      const {
        otherCountryId,
        guildId,
        allianceId,
        usedBy,
      } = getInteractionData(cleanedId);

    
      if(otherCountryId === null || otherCountryId === undefined)  {
        interaction.reply(
          `Interaction already has been finished`
        );
        return;
      }

      const turnCounter = await TurnCounterModel.findOne({guildId: guildId});

      if(!turnCounter) {
        interaction.reply(
          `No turn counter`
        );
        return;
      }

      const alliance = await AllianceModel.findById(allianceId);
      if(!alliance) {
        interaction.reply(
          `Alliance no longer exists`
        );
        return;
      }
      const members = await CountryModel.find({_id: {$in: alliance.memberNationIds}});

      if(!members.some(member => member.userId != interaction.user.id)) {
        interaction.reply(
          `You are not a member of this alliance`
        );
        return;
      }

      const users: Array<string> = usedBy as Array<string>;
      
      if(users.includes(interaction.user.id)) {
        interaction.reply(
          `You have already replied to this interaction`
        );
        return;
      }

      if(members.every(member => member.userId != interaction.user.id)) {
        interaction.reply(
          `You are not a member of this alliance`
        );
        return;
      }

      users.push(interaction.user.id);

      addInteractionData({
        identifier: cleanedId, 
        data: {
          otherCountryId,
          guildId,
          allianceId,
          usedBy: users,
        }
      });

      // Create the buttons
      const acceptButton = new ButtonBuilder()
        .setCustomId(`joinAlliance${interaction.id}`)
        .setLabel('🕊️ Accept')
        .setStyle(ButtonStyle.Success);

      const declineButton = new ButtonBuilder()
        .setCustomId(`declineAlliance${interaction.id}`)
        .setLabel('Decline')
        .setStyle(ButtonStyle.Danger);

      // Create the action row containing the buttons
      const actionRow = new ActionRowBuilder()
          .addComponents(acceptButton, declineButton);

      // Build the attachment with buttons
      const attachment = {
        content: `You have been invited to join '${alliance.name}'`,
        components: [actionRow] 
       };

      const otherCountry = await CountryModel.findById(otherCountryId);

      if(!otherCountry) {
        interaction.reply(`The country does not exist anymore`);
        return;
      }

      const otherCountryChannel = interaction.guild?.channels.cache.find(channel => channel.name === `${otherCountry.name.toLowerCase()}`);
      if (otherCountryChannel?.isTextBased()) {
        const textBasedChannel = otherCountryChannel as TextBasedChannel;
        // unfortunate as any cast, i dont know why attachment is marked as a wrong type here
        const message = await (textBasedChannel as any).send(attachment);

        const interactionArgs = {
          otherCountryId: otherCountry._id,
          guildId: interaction.guildId,
          turn: turnCounter.turn,
          allianceId: allianceId,
        }

        addInteractionData({identifier: interaction.id, data: interactionArgs});
      } else if (!otherCountryChannel){
        interaction.reply(`Cannot find the correct message channel`);
        return;
      }

      interaction.reply(`Everyone agreed, proposition sent!`);
      return;

    }
  },
}

export default acceptNewAllianceMember