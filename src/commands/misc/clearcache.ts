import { ApplicationCommand, ApplicationCommandDataResolvable, ApplicationCommandOption, ChatInputApplicationCommandData, GuildApplicationCommandManager, PermissionFlagsBits } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import { getApplicationCommands } from "../../utils/getApplicationCommands";
import { testServer } from '../../../config.json';
import { getLocalCommandObjects } from "../../utils/getLocalCommandObjects";
import { getLocalCommands } from "../../utils/getLocalCommands";
import { registerCommands } from "../../events/ready/01registerCommands";

const ping: CommandTemplate = {
  name: "clearcache",
  description: "Clears all commands",
  testOnly: true,
  callback: async (client, interaction) => {
    await interaction.deferReply();

    const localCommands: ApplicationCommand<{}>[] = await getLocalCommands();
    const applicationCommands: GuildApplicationCommandManager = await getApplicationCommands(
      client,
      testServer,
    );

    for (let i = 0; i < localCommands.length; i++) {
      let localCommand: ApplicationCommand = localCommands[i];
      const name: string = localCommand.name;

      const existingCommand: ApplicationCommand<{}> | undefined = applicationCommands.cache.find(
        (cmd: ApplicationCommand<{}>) => cmd.name === name
      );

      if (existingCommand) {
        console.log(`delete ${existingCommand.name}`);
        if(existingCommand.name !== interaction.command?.name){
          await applicationCommands.delete(existingCommand.id);
        }
      }
    }

    registerCommands(client);

    interaction.editReply(
      `Commands cleared`
    );

  },
  permissionsRequired: [PermissionFlagsBits.Administrator],
};

export default ping;