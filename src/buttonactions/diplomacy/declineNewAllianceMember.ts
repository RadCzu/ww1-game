import { inherits } from "util";
import ButtonAction from "../../models/ButtonAction";
import { deleteInteractionData, getInteractionData } from "../../models/InteractionData";
import AllianceModel, { AllianceType } from "../../models/Alliance";
import CountryModel from "../../models/Country";
import { areAtWar, areAllied, allianceExists } from "../../utils/diplomacy";
import { ActionRow, ActionRowBuilder, ButtonBuilder, ButtonComponent, ButtonStyle, CategoryChannelResolvable, ChannelType, ComponentType, GuildChannelResolvable, GuildMember, OverwriteResolvable, PermissionFlagsBits, Role } from "discord.js";
import TurnCounterModel from "../../models/Turn";


const declineNewAllianceMember: ButtonAction = {
  name: "declineNewAllianceMember",
  async execute(client, interaction, customId): Promise<void> {
    if(interaction.isRepliable()){
      const cleanedId: string = customId.replace(/^declineNewAllianceMember/, '');

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
    
      const alliance = await AllianceModel.findById(allianceId);
      if(!alliance) {
        interaction.reply(
          `Alliance no longer exists`
        );
        return;
      }
      const members = await CountryModel.find({_id: {$in: alliance.memberNationIds}});
      if(members.every(member => member.userId != interaction.user.id)) {
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

      deleteInteractionData(cleanedId);

      interaction.reply(`Proposition rejected by ${interaction.user}`);
    }
  },
}

export default declineNewAllianceMember