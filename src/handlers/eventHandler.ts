import { getAllFiles } from "../utils/getAllFiles";
import {Client} from "discord.js";
import path = require("path");
import util = require('util');

export async function eventHandler(client : Client){
  const eventFolders = getAllFiles(path.join(__dirname, '..', 'events'), true);
  for (const eventFolder of eventFolders) {
    const eventFiles = getAllFiles(eventFolder);
    eventFiles.sort((a: string, b: string) => a.localeCompare(b));
    const eventName: string = eventFolder.replace(/\\/g, '/').split('/').pop() as string;
    client.on(eventName, async (arg) => {
      for (const eventFile of eventFiles) {
        const eventFunction: Function = require(eventFile);
        const functionObjectName: string = util.inspect(eventFunction);

        function extractKey(str: string) {
          const startIndex = str.indexOf("{") + 1;
          const endIndex = str.indexOf(":");
        
          if (startIndex !== -1 && endIndex !== -1) {
            return str.slice(startIndex, endIndex).trim();
          } else {
            return null;
          }
        };
        const functionName = extractKey(functionObjectName);

        if (functionName && functionName in eventFunction) {
          const propertyValue = (eventFunction as Record<string, any>)[functionName];
          if (propertyValue instanceof Function) {
            await propertyValue(client, arg);
          } else {
            throw new Error("Error while handling events, imported module is not a function");
          }
        } else {
          throw new Error("Error while handling commands, no module imported");
        }

      }
    });
  }
};