import { ApplicationCommand, ApplicationCommandDataResolvable, ApplicationCommandOption, Client, GuildApplicationCommandManager, ChatInputApplicationCommandData } from "discord.js";
import { testServer } from '../../../config.json';
import { areCommandsDifferent } from '../../utils/areCommandsDifferent';
import { getApplicationCommands } from '../../utils/getApplicationCommands';
import { getLocalCommands } from '../../utils/getLocalCommands';
import { getLocalCommandObjects } from '../../utils/getLocalCommandObjects';
import { CommandTemplate } from '../../models/Command';

export async function registerCommands(client: Client): Promise<void> {
  try {
    console.log("registering commands...");
    const localCommands: ApplicationCommand<{}>[] = await getLocalCommands();
    const commandObjects: CommandTemplate[] = await getLocalCommandObjects();
    const applicationCommands: GuildApplicationCommandManager = await getApplicationCommands(
      client,
      testServer,
    );

    for (let i = 0; i < localCommands.length; i++) {
      let localCommand: ApplicationCommand = localCommands[i];
      let localCommandObject: CommandTemplate = commandObjects[i];

      const name: string = localCommand.name;
      const description: string = localCommand.description;
      const options: ApplicationCommandOption[] = localCommand.options as ApplicationCommandOption[];

      const existingCommand: ApplicationCommand<{}> | undefined = applicationCommands.cache.find(
        (cmd: ApplicationCommand<{}>) => cmd.name === name
      );

      const data1: Partial<ApplicationCommandDataResolvable> = {
        description,
        options: options  as ChatInputApplicationCommandData['options'],
      };

      const data2: ApplicationCommandDataResolvable = {
        name,
        description,
        options: options  as ChatInputApplicationCommandData['options'],
      };

      if (existingCommand) {

        if (localCommandObject.deleted) {
          await applicationCommands.delete(existingCommand.id);
          console.log(`deleted command: ${name}`);
          continue;
        }

        if (await areCommandsDifferent(existingCommand, localCommand)) {
          await applicationCommands.edit(existingCommand.id, data1);

          console.log(`command ${name} was edited`);
        }
        console.log(`command ${name} is correct`);
      } else {
        if (localCommandObject.deleted) {
          console.log(`registration of command ${name} was skipped`);
          continue;
        }

        await applicationCommands.create(data2);

        console.log(`command ${name} was created`);
      }
    }
  } catch (error) {
    console.log(`error while registering commands ${error}`);
  }
}