import CountryModel, { CountryType } from "../models/Country";
import TurnCounterModel from "../models/Turn";
import TurnLogModel, { TurnLogType } from "../models/TurnLog";
import * as actions from "../utils/actions/exports";
import equipmentIncome from "./income/equipmentIncome";
import taxIncome from "./income/taxIncome";

export async function executeTurn(guildId: string): Promise<void> {
  const turn = await TurnCounterModel.findOne({ guildId: guildId });

  if (turn) {
    const turnLogs = await TurnLogModel.find({ turn: turn.turn });

    const countries = await CountryModel.find({gameId: turn._id.toString(), guildId: guildId});

    for (const country of countries) {
      if(country._id !== undefined) {
        taxIncome(country);
        equipmentIncome(country);
      }
      if(country.actions < 14) {
        country.actions += 2;
      }
      country.politicalPower += 10;
      country.save();
    }

    let promiseChain = Promise.resolve();
    for (const turnLog of turnLogs) {
        promiseChain = promiseChain.then(async () => {
            const { action, args } = turnLog;
            if (typeof actions[action as keyof typeof actions] === 'function') {
                try {
                    await actions[action as keyof typeof actions](args);
                } catch (error) {
                    console.error(`Error executing action "${action}":`, error);
                }
            } else {
                console.error(`Action function "${action}" not found in actions module`);
            }
        });
    }
    await promiseChain;
    
    turn.turn += 1;
    await turn.save();
  }
}

export interface ActionArgs {
  // Define all possible arguments as optional fields
  name?: string;
}
