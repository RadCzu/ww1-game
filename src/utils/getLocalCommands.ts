import path = require("path");
import { getAllFiles } from "../utils/getAllFiles";
import { ApplicationCommand} from "discord.js";

export async function getLocalCommands(exceptions: string[] = []): Promise<ApplicationCommand<{}>[]> {
  let localCommands: ApplicationCommand<{}> [] | any [] = [];

  const commandCategories = getAllFiles(
    path.join(__dirname, "..", "commands"),
    true
  );

  for(const commandCategory of commandCategories) {
    const commandFiles = getAllFiles(commandCategory);
    for(const commandFile of commandFiles) {
      let commandObject = require(commandFile) as ApplicationCommand;

      if(exceptions.includes(commandObject.name)) {
        continue;
      }

      localCommands.push(commandObject);
    }
    
  }
  localCommands = localCommands.map(command => {
    if (command.default) {
      return command.default;
    }
    return command;
  });

  return localCommands;
}