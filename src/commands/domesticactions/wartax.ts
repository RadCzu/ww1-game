import { ApplicationCommandOptionType, PermissionFlagsBits, PermissionsBitField } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import CountryModel, { CountryType } from "../../models/Country";
import TurnCounterModel from "../../models/Turn";
import taxIncome from "../../utils/income/taxIncome";

const wartax: CommandTemplate = {
  name: "wartax",
  description: "Gives extra income (100% tax income), costs 2 political power and 5 stability",
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


    if(country.actions > 0) {
      await taxIncome(country);
      country.stability -= 4;
      country.actions -= 1;
      country.politicalPower -= 2;
      await country.save();
    } else {
      interaction.editReply(`You dont have any actions left`);
      return
    }



    interaction.editReply(
      `War taxes have been raised in ${nationName}`
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

export default wartax;