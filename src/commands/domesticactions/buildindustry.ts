import { ApplicationCommandOptionType, PermissionFlagsBits, PermissionsBitField } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import CountryModel, { CountryType } from "../../models/Country";
import RegionModel, { RegionType } from "../../models/Region";
import TurnCounterModel from "../../models/Turn";
import TurnLogModel, { TurnLogType } from "../../models/TurnLog";

const buildindustry: CommandTemplate = {
  name: "buildindustry",
  description: "increases the amount of factories in a region costs 25000 per factory",
  callback: async (client, interaction) => {
    await interaction.deferReply();
    const userID = interaction.user.id;
    const nationName: string = interaction.options.get("nation-name")?.value as string;
    const regionName: string = interaction.options.get("region-name")?.value as string;
    const amount: number = interaction.options.get("amount")?.value as number;
    const military: boolean = interaction.options.get("military")?.value as boolean;

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

    if (amount > 10) {
      interaction.editReply(
        `Factory construction limit is 10`
      );
      return;
    }


    if (country.money < 25000 * amount) {
      interaction.editReply(
        `Not enough money`
      );
      return;
    }


    if(country.actions > 0) {
      country.actions -= 1;
      country.money -= 25000 * amount;
      await country.save();
    } else {
      interaction.editReply(`You dont have any actions left`);
      return
    }

    const newAction: TurnLogType = {
      guildId: interaction.guildId,
      nationId: country._id.toString(),
      turn: turn.turn,
      action: 'buildindustry',
      args: [region?._id, amount, military],
    };

    TurnLogModel.create(newAction);


    interaction.editReply(
      `${amount} factories in ${region.name} are under construction`
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
    {
      name: "military",
      required: true,
      description: "FDactory type (true = military)",
      type: ApplicationCommandOptionType.Boolean,
    },
    {
      name: "amount",
      required: true,
      description: "amount of factories",
      type: ApplicationCommandOptionType.Number,
    },
  ],
};

export default buildindustry;