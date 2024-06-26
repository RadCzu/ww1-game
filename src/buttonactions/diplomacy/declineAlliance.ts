import { inherits } from "util";
import ButtonAction from "../../models/ButtonAction";
import { deleteInteractionData, getInteractionData } from "../../models/InteractionData";
import AllianceModel, { AllianceType } from "../../models/Alliance";
import CountryModel from "../../models/Country";
import { areAtWar, areAllied, allianceExists } from "../../utils/diplomacy";
import { ActionRow, ActionRowBuilder, ButtonBuilder, ButtonComponent, ButtonStyle, CategoryChannelResolvable, ChannelType, ComponentType, GuildChannelResolvable, GuildMember, OverwriteResolvable, PermissionFlagsBits, Role } from "discord.js";
import TurnCounterModel from "../../models/Turn";


const declineAlliance: ButtonAction = {
  name: "declineAlliance",
  async execute(client, interaction, customId): Promise<void> {
    if(interaction.isRepliable()){
      const cleanedId: string = customId.replace(/^declineAlliance/, '');

      const { countryId, otherCountryId, guildId, turn, allianceName } = getInteractionData(cleanedId);

      if(otherCountryId === null || otherCountryId === undefined)  {
        interaction.reply(
          `Interaction already has been used`
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

      if(turnCounter.turn != turn) {
        deleteInteractionData(cleanedId);
        interaction.reply(
          `Proposition deadline expired on turn ${turn}, it is now turn ${turnCounter.turn}`
        );
        return;
      }
  
      const country = await CountryModel.findById(otherCountryId);
      if(!country) {
        interaction.reply(
          `Your country no longer exists`
        );
        return;
      }

      if(interaction.user.id != country.userId) {
        interaction.reply(
          `Not your country`
        );
        return;
      }

      deleteInteractionData(cleanedId);

      interaction.reply(`Offer declined`);
    }
  },
}

export default declineAlliance