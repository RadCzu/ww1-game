import { ApplicationCommandOptionType, PermissionFlagsBits, PermissionsBitField } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import CommanderModel, { CommanderType } from "../../models/Commander";
import CountryModel from "../../models/Country";

const promoteCommander: CommandTemplate = {
  name: "promotecommander",
  description: "Promotes a new general for a nation",
  callback: async (client, interaction) => {
    await interaction.deferReply();

    // Get general details from the command options
    const nationName: string = interaction.options.get("nation-name")?.value as string;
    const country =  await CountryModel.findOne({name: nationName, guildId: interaction.guildId});

    let skill: number;
    const requiredPerms: PermissionsBitField = interaction.member?.permissions as PermissionsBitField;
    if(requiredPerms.has(PermissionFlagsBits.Administrator) && interaction.options.get("skill")) {
      skill = interaction.options.get("skill")?.value as number;
    } else {
      skill = Math.floor(Math.random() * 5) + 1;
    }

    if(!country && !interaction.options.get("neutral")?.value) {
      interaction.editReply(`No country ${nationName} exists`);
      return;
    }

    if(interaction.member?.user.id !== country?.userId && !requiredPerms.has(PermissionFlagsBits.Administrator)){
      interaction.editReply(`Not your country lol`);
      return;
    }

    if(country && country.actions > 0) {
      country.actions -= 1;
      country?.save();
    } else {
      interaction.editReply(`You dont have any actions left`);
      return
    }

    const commanderName: string = interaction.options.get("commander-name")?.value as string;

    // Create a new general object
    const newGeneral: CommanderType = {
      name: commanderName,
      nationId: country?._id,
      skill: skill,
    };

    // Save the new general to the database
    const general = new CommanderModel(newGeneral);
    await general.save();



    interaction.editReply(`General ${commanderName} promoted successfully!`);
  },
  options: [
    {
      name: "nation-name",
      description: "The name of the nation",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "commander-name",
      description: "The name of the general",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "skill",
      description: "The skill level of the general (1-5, admin-only)",
      required: false,
      type: ApplicationCommandOptionType.Integer,
    },
    {
      name: "neutral",
      description: "Neutrality flag for the general (admin only)",
      required: false,
      type: ApplicationCommandOptionType.Boolean,
    },
  ],
};

export default promoteCommander;