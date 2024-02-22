import { PermissionFlagsBits } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import TurnCounterModel, { TurnCounterType } from "../../models/Turn";
import { executeTurn } from "../../utils/executeTurn";


const forceTurn: CommandTemplate = {
  name: "forceturn",
  description: "forces the next turn to happen at any time (admin only)",
  callback: async (client, interaction) => {
    await interaction.deferReply();

    if(!interaction.guildId) {
      interaction.editReply(
        `this is a server only bot`
      );
    }
    
    const turn = await TurnCounterModel.findOne({ guildId: interaction.guildId });

    if(turn) {
      await executeTurn(interaction.guildId as string);
      interaction.editReply(
        `Next turn! Turn ${turn.turn + 1} begins!`
      );
    } else {

      const newTurn = new TurnCounterModel({
        guildId: interaction.guildId as string,
        turn: 0,
      });

      newTurn.save();

      interaction.editReply(
        `There is no turn counter for this server so i created a new one\n
        It is currently turn 0`
      );
    }

  },
  permissionsRequired: [PermissionFlagsBits.Administrator],
  botPermissions: [PermissionFlagsBits.Administrator],
};

export default forceTurn;