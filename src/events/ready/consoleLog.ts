import {Client} from "discord.js";

export function consoleLog(client: Client): void {
  if(client.user){
    console.log(`${client.user.tag} is online`);
  } else {
    throw new Error("Unable to run consoleLog command. Client application are missing.");
  }
}