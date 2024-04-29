import { Client} from "discord.js";
import { CronJob } from 'cron';
import { executeTurn } from "../../utils/executeTurn";
import TurnCounterModel, { TurnCounterType } from "../../models/Turn";
import { sendMessageOnPublicChannel } from "../../utils/sendMessage";


export async function dailyTurnExecution(client: Client): Promise<void> {

  const turnCounters: TurnCounterType[] = await TurnCounterModel.find({});

  try {
    let scheduledAction = new CronJob('00 52 21 * * *', async () => {
      for(const turnCounter of turnCounters) {
        await executeTurn(turnCounter.guildId);
        await sendMessageOnPublicChannel(client, turnCounter, `Turn ${turnCounter.turn} Begins!`);
      }
    });
  
    scheduledAction.start()
  } catch (error) {
    console.log(`error while starting the turn process ${error}`);
  }
}