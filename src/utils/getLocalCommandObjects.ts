import path = require("path");
import { getAllFiles } from "../utils/getAllFiles";
import { CommandTemplate } from "../models/Command";

export async function getLocalCommandObjects(exceptions: string[] = []): Promise<CommandTemplate[]> {
  let localCommands: CommandTemplate [] | any [] = [];

  const commandCategories = getAllFiles(
    path.join(__dirname, "..", "commands"),
    true
  );

  for(const commandCategory of commandCategories) {
    const commandFiles = getAllFiles(commandCategory);
    for(const commandFile of commandFiles) {
      let commandObject: CommandTemplate = require(commandFile) as CommandTemplate;
       
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