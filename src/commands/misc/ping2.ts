import { ApplicationCommandOptionType, PermissionFlagsBits, PermissionsBitField } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import CountryModel, { CountryType } from "../../models/Country";
import TurnLogModel, { TurnLogType } from "../../models/TurnLog";
import TurnCounterModel from "../../models/Turn";


const ping2: CommandTemplate = {
  name: "ping2",
  description: "Pong2!",
  testOnly: true,
  deleted: false,
  callback: async (client, interaction) => {
    await interaction.deferReply();

    const countryname = interaction.options.get("country-name")?.value;
    if(!countryname || !interaction.guildId) {
      return;
    }

    const turn = await TurnCounterModel.findOne({guildId: interaction.guildId});

    if(!turn) {
      interaction.editReply(
        `No turn counter`
      );
      return;
    }

    let country = await CountryModel.findOne({name: countryname, userId: interaction.user.id, guildId: interaction.guildId});
    const requiredPerms: PermissionsBitField = interaction.member?.permissions as PermissionsBitField;
    if(requiredPerms.has(PermissionFlagsBits.Administrator)) {
      country = await CountryModel.findOne({name: countryname, guildId: interaction.guildId});
    }

    if(!country) {
      if(requiredPerms.has(PermissionFlagsBits.Administrator)) {
        country = await CountryModel.findOne({name: countryname, guildId: interaction.guildId});
      }
      if (!country) {
        interaction.editReply(
          `Its not your country or it does not exist`
        );
        return;
      }
    }

    if(country.actions > 0) {
      country.actions -= 1;
      country.save();
    } else {
      interaction.editReply(
        `Not enough actions`
      );
      return;
    }

    const newAction: TurnLogType = {
      guildId: interaction.guildId,
      nationId: country._id.toString(),
      turn: turn.turn,
      action: 'ping',
      args: [country.name],
    };

    TurnLogModel.create(newAction);

    interaction.editReply(
      `Action added`
    );
  },
  options: [
    {
      name: "country-name",
      description: "Your nation",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
  ]
};

export default ping2;
