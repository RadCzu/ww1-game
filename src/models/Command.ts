import { ApplicationCommandOptionData, Client, CommandInteraction } from "discord.js";

export interface CommandTemplate {
  name: string,
  description: string,
  devOnly?: boolean,
  testOnly?: boolean,
  options?: ApplicationCommandOptionData[],
  deleted?: boolean,
  callback: (client: Client, interaction: CommandInteraction) => void,
  permissionsRequired?: bigint[],
  botPermissions?: bigint[],
};