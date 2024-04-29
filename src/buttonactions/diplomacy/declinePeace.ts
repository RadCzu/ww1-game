import { inherits } from "util";
import ButtonAction from "../../models/ButtonAction";
import { deleteInteractionData, getInteractionData } from "../../models/InteractionData";
import AllianceModel, { AllianceType } from "../../models/Alliance";
import CountryModel from "../../models/Country";
import { areAtWar, areAllied, allianceExists } from "../../utils/diplomacy";
import { ActionRow, ActionRowBuilder, ButtonBuilder, ButtonComponent, ButtonStyle, CategoryChannelResolvable, ChannelType, ComponentType, GuildChannelResolvable, GuildMember, OverwriteResolvable, PermissionFlagsBits, PermissionsBitField, Role, TextBasedChannel } from "discord.js";
import TurnCounterModel from "../../models/Turn";


const declinePeace: ButtonAction = {
  name: "declinePeace",
  async execute(client, interaction, customId): Promise<void> {
    if(interaction.isRepliable()){
      const cleanedId: string = customId.replace(/^declinePeace/, '');

      const { countryId, otherCountryId, guildId, turn } = getInteractionData(cleanedId);

      if(countryId === null || countryId === undefined)  {
        interaction.reply(
          `Interaction already has been used`
        );
        return;
      }

      const country = await CountryModel.findById(countryId);

      const otherCountry = await CountryModel.findById(otherCountryId);

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
  
      if (!country) {
        interaction.reply(
          `The other nation does not exist anymore`
        );
        return;
      }
  
      if (!otherCountry) {
        interaction.reply(
          `Your nation does not exist`
        );
        return;
      }

      const requiredPerms = interaction.member?.permissions as PermissionsBitField;
      if((interaction.user.id != otherCountry.userId) && (!requiredPerms.has(PermissionFlagsBits.Administrator))) {
        interaction.reply("Hey, its not your country")
        return;
      }
  
      if(!await areAtWar(country, otherCountry)) {
        interaction.reply(
          `Sorry, but you arent at war with them anymore`
        );
        return;
      }

      const otherCountryChannel = interaction.guild?.channels.cache.find(channel => channel.name === `${country.name.toLowerCase()}`);
      if (otherCountryChannel?.isTextBased()) {
        const textBasedChannel = otherCountryChannel as TextBasedChannel;
        const countryMember = await interaction.guild?.members.fetch(country.userId);
        if (countryMember) {
          await textBasedChannel.send(`${countryMember}, ${otherCountry.name} has rejected your peace offer`);
        } else {
          await textBasedChannel.send(`${otherCountry.name} has rejected your peace offer`);
        }
      } else if (!otherCountryChannel){
        interaction.reply(`cannot find the correct message channel`);
        return;
      }

      deleteInteractionData(cleanedId);

      interaction.reply(`Offer declined`);
    }
  },
}

export default declinePeace