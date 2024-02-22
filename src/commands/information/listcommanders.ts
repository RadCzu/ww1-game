import { ApplicationCommandOptionType, PermissionFlagsBits, PermissionsBitField } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import CommanderModel from "../../models/Commander";
import ArmyModel from "../../models/Army";
import CountryModel from "../../models/Country";

const commanderList: CommandTemplate = {
  name: "commanderlist",
  description: "Displays information about all commanders of a anation",
  callback: async (client, interaction) => {
    await interaction.deferReply();
    
    // Fetch all commanders from the database
    const commanders = await CommanderModel.find();
    const nationName = interaction.options.get("nation-name")?.value;
    const country = await CountryModel.findOne({name: nationName, guildId: interaction.guildId});

    if(!nationName) {
      interaction.editReply(`No nation ${nationName} found.`);
      return;
    }

    if (!commanders || commanders.length === 0) {
      interaction.editReply("No commanders found.");
      return;
    }

    let response: string;

    if(country) {
      response = `**Commander List for country: ${nationName}**\n`;
    } else {
      response = `**Neutral commander List**\n`;
    }

    // Iterate through each commander and display information
    for (const commander of commanders) {

      if(country?._id.toString() === commander.nationId) {
        response += `\n**${commander.name}**\n`;
        // Fetch and display the name of the army they command, if any
        const army = await ArmyModel.findOne({ commanderId: commander._id });
        if (army && army.name) {
          response += `- Commands Army: ${army.name}\n`;
        } else {
          response += `- Available\n`;
        }
      }
    }
    response += "--------------------------\n";
    // Display the commander list
    interaction.editReply(response);
  },
  options: [
    {
      name: "nation-name",
      description: "The name of the nation",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
  ],
};

export default commanderList;