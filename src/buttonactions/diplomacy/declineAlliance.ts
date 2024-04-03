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

      if(countryId === null || countryId === undefined)  {
        interaction.reply(
          `Interaction already has been used`
        );
        return;
      }

      deleteInteractionData(cleanedId);

      interaction.reply(`Offer declined`);
    }
  },
}

export default declineAlliance