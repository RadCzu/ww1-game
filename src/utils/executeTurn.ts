import ArmyModel from "../models/Army";
import CountryModel, { CountryType } from "../models/Country";
import TurnCounterModel from "../models/Turn";
import TurnLogModel, { TurnLogType } from "../models/TurnLog";
import UnitModel from "../models/Unit";
import * as actions from "../utils/actions/exports";
import equipmentIncome from "./income/equipmentIncome";
import taxIncome from "./income/taxIncome";

export async function executeTurn(guildId: string): Promise<void> {
  const turn = await TurnCounterModel.findOne({ guildId: guildId });

  if (turn) {


    const turnLogs = await TurnLogModel.find({ turn: turn.turn });

    console.log(`turn ${turn.turn}`);

    const countries = await CountryModel.find({gameId: turn._id.toString(), guildId: guildId});
    const cav: number[] = [];

    for(const country of countries) {
      cav.push(await getCountryCavCount(country));
    }

    const countryCavPairs = countries.map((country, index) => ({country, cavCount: cav[index] }));

    countryCavPairs.sort((a, b) => b.cavCount - a.cavCount);

    const sortedCountries = countryCavPairs.map(pair => pair.country);

    for (const country of sortedCountries) {
      if(country.stability > 0) {
        if(country._id !== undefined) {
          await taxIncome(country);
          await equipmentIncome(country);
        }
        if(country.actions < 14) {
          country.actions += 2;
        }
        country.politicalPower += 10;
        country.save();
      }
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

async function getCountryCavCount(country: CountryType): Promise<number> {
  const armies = await ArmyModel.find({nationId: country._id});
  let cav = 0;
  for(const army of armies) {
    const units = await UnitModel.find({ _id: {$in: army.units}});
    for(const unit of units) {
      if(unit.unitType === "CAVALRY") {
        cav += 1;
      }
    }
  }
  return cav;
}
