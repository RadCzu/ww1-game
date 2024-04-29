import { ApplicationCommandOptionType, PermissionFlagsBits, PermissionsBitField } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import CountryModel, { CountryType } from "../../models/Country";
import TurnCounterModel from "../../models/Turn";
import taxIncome from "../../utils/income/taxIncome";

const research: CommandTemplate = {
  name: "research",
  description: "Gain extra 0.1 tech for the price of 40000$",
  callback: async (client, interaction) => {
    await interaction.deferReply();
    const userID = interaction.user.id;
    const nationName: string = interaction.options.get("nation-name")?.value as string;

    const turn = await TurnCounterModel.findOne({guildId: interaction.guildId});

    if(!interaction.guildId) {
      interaction.editReply(
        `guild-only command!`
      );
      return;
    }

    if(!turn) {
      interaction.editReply(
        `No turn counter`
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

    if (!country) {
      interaction.editReply(
        `Nation does not exist, or you do not have the permissions required to view its army stats`
      );
      return;
    }

    if(country.money < 40000) {
      interaction.editReply(
        `Not enough money`
      );
      return;
    }

    if(country.actions > 0) {
      await taxIncome(country);
      country.tech += 0.1;
      country.actions -= 1;
      country.money -= 40000;
      await country.save();
    } else {
      interaction.editReply(`You dont have any actions left`);
      return
    }

    interaction.editReply(
      `${nationName} tech is now ${country.tech}`
    );
    return;
  },
  options: [
    {
      name: "nation-name",
      required: true,
      description: "The name of the nation",
      type: ApplicationCommandOptionType.String,
    },
  ],
};

export default research;