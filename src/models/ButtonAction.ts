import { Client, Interaction } from "discord.js";

export default abstract class ButtonAction {
  name: string = "";
  abstract execute(client: Client, interaction: Interaction, customId: string): Promise<void>;
}