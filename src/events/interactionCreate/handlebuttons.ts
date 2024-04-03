import { Client, Interaction } from "discord.js";
import { getInteractionData } from "../../models/InteractionData";
import { getLocalButtonActions } from "../../utils/getLocalButtonActions";

export async function handleButtons(client: Client, interaction: Interaction): Promise<void> {
  if (!interaction.isButton()) return;

  const localActions = await getLocalButtonActions();

  const customId = interaction.customId.toString();
  console.log(`button press of: ${customId}`);
  for(const action of localActions) {
    console.log(action);
    if (customId.includes(action.name)) {
      await action.execute(client, interaction, customId);
      return;
    }
  }
  interaction.reply("Sorry, but this button does not have any functionality")
}
