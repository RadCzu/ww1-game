import { ActionRow, ApplicationCommandOptionType, GuildBasedChannel, GuildMember, PermissionFlagsBits, PermissionsBitField, TextBasedChannel } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import TurnCounterModel, { TurnCounterType } from "../../models/Turn";
import CountryModel, { CountryType } from "../../models/Country";
import WarModel from "../../models/War";
import AllianceModel, { AllianceType } from "../../models/Alliance";
import { addInteractionData } from "../../models/InteractionData";
import { allianceExists, areAllied, areAtWar } from "../../utils/diplomacy";
const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

const spy: CommandTemplate = {
  name: "spy",
  description: "Spy on another players chats",
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

    if (country.politicalPower < 18) {
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

    const otherCountrySpyRole = interaction.guild?.roles.cache.find(role => role.name === `${otherCountry.name} spy`);
    if (otherCountrySpyRole) {
      const spy = await interaction.guild?.members.fetch(country.userId) as GuildMember;
      spy.roles.add(otherCountrySpyRole);
    } else {
      interaction.editReply(`cannot find the correct role`);
      return;
    }

    if(country.actions > 0) {
      country.actions -= 1;
    } else {
      interaction.editReply(`You dont have any actions left`);
      return
    }

    //pp cost
    country.politicalPower -= 18;
    await country.save();

    interaction.editReply(`you have 5 minutes to spy on them!`);

    if (otherCountrySpyRole) {
      await setTimeoutPromise(3 * 60 * 1000);
      const spy = await interaction.guild?.members.fetch(country.userId) as GuildMember;
      spy.roles.remove(otherCountrySpyRole);
    }

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
      description: "Nation you want to spy on",
      type: ApplicationCommandOptionType.String,
    },
  ]
};

function setTimeoutPromise(delay: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
}


export default spy;
