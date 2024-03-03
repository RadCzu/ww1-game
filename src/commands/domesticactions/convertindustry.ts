import { ApplicationCommandOptionType, PermissionFlagsBits, PermissionsBitField } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import CountryModel, { CountryType } from "../../models/Country";
import RegionModel, { RegionType } from "../../models/Region";
import TurnCounterModel from "../../models/Turn";
import TurnLogModel, { TurnLogType } from "../../models/TurnLog";

const convertindustry: CommandTemplate = {
  name: "convertindustry",
  description: "Converts industry to a diffetent type, costs 2 political power",
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
        `Nation does not exist, or you do not have the permissions use it`
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

    
    if (region.factories === undefined || region.milfactories === undefined) {
      interaction.editReply(
        `Regions factories are missing`
      );
      return;
    }

    if(military) {
      if (amount + region.milfactories > region.factories) {
        interaction.editReply(
          `Region does not have that many civillian factories`
        );
        return;
      }
    } else {
      if (region.milfactories < amount) {
        interaction.editReply(
          `Region does not have that many milutary factories`
        );
        return;
      }
    }

    if(country.actions > 0) {
      country.politicalPower -= 2;
      country.actions -= 1;
      await country.save();
    } else {
      interaction.editReply(`You dont have any actions left`);
      return
    }

    const newAction: TurnLogType = {
      guildId: interaction.guildId,
      nationId: country._id.toString(),
      turn: turn.turn,
      action: 'convertindustry',
      args: [region?._id, amount, military],
    };

    TurnLogModel.create(newAction);


    interaction.editReply(
      `${amount} factories in ${region.name} are being converted`
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
      description: "civilian -> military?",
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

export default convertindustry;