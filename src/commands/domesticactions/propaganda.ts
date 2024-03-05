import { ApplicationCommandOptionType, PermissionFlagsBits, PermissionsBitField } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import CountryModel, { CountryType } from "../../models/Country";
import RegionModel, { RegionType } from "../../models/Region";
import TurnCounterModel from "../../models/Turn";

const buildindustry: CommandTemplate = {
  name: "propaganda",
  description: "costs 10 political power",
  callback: async (client, interaction) => {

    const PPcost = 10;
    const moneyCost = 150000;

    await interaction.deferReply();
    const userID = interaction.user.id;
    const nationName: string = interaction.options.get("nation-name")?.value as string;
    const regionName: string = interaction.options.get("region-name")?.value as string;

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

    const region = await RegionModel.findOne({ name: regionName, nationId: country._id });

    if (!region) {
      interaction.editReply(
        `Region does not belong to you or does not exist`
      );
      return;
    }

    if (region.resistance === undefined) {
      interaction.editReply(
        `Region does not have resistance field`
      );
      return;
    }

    if (country.politicalPower - PPcost <= 0) {
      interaction.editReply(
        `not enough political power`
      );
      return;
    }

    if (country.money - moneyCost <= - 200000) {
      interaction.editReply(
        `not enough money`
      );
      return;
    }



    if(country.actions > 0) {
      country.actions -= 1;
      country.stability += 4;
      region.resistance += 5;
      country.money -= moneyCost;
      country.politicalPower -= PPcost;
      await country.save();
    } else {
      interaction.editReply(`You dont have any actions left`);
      return
    }

    interaction.editReply(
      `propaganda`
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
    {
      name: "region-name",
      required: true,
      description: "The name of the region",
      type: ApplicationCommandOptionType.String,
    },
  ],
};

export default buildindustry;