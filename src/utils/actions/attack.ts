
import ArmyModel, { ArmyType } from '../../models/Army';
import CountryModel from '../../models/Country';
import RegionModel, { RegionType } from '../../models/Region';
import { landCombat } from '../landCombat';
import { casulties, killManpower } from '../manpower';
import { moveDefenderArmy, moveAttackerArmy } from '../moveDefenderArmy';
import setRegionOwner from '../setRegionOwner';

export async function attack(args: any[]): Promise<void> {
  try {
    const defender: boolean = args[0];
    const regionId: string = args[1].toString();

    //fetch the region
    const region = await RegionModel.findById(regionId);
    if(!region || !region.attackerEntrenchment || !region.entrenchment){
      console.error("invaders are missing");
      return;
    }

    // Fetch the attacking army from the database

    const attackingArmies = await ArmyModel.find({regionId: regionId, defender: false});
    const defendingArmies = await ArmyModel.find({regionId: regionId, defender: true});

    const tempAttArmy: ArmyType | null = await combineArmies(attackingArmies as unknown as ArmyType[]);
    if(!tempAttArmy) {
      console.error("all armies missing");
      return;
    }

    const tempDefArmy: ArmyType | null = await combineArmies(defendingArmies as unknown as ArmyType[]);
    if(!tempDefArmy) {
      console.error("all armies missing");
      return;
    }
    
    if(defender) {
      if(!attackingArmies || attackingArmies.length === 0) {
        console.log("Attackers retreated");
        return;
      } else {
        const combat = await landCombat(tempDefArmy, tempAttArmy, regionId, false);
        if(combat.attackerVictory) {
          //defenders win
          region.attackerEntrenchment -= 1;
          await region.save();
          console.log(region.attackerEntrenchment);
          attackingArmies.forEach((army)=> {
            casulties(army, 0.01 * combat.winnerCavalry + 0.15);
          });
          defendingArmies.forEach((army)=> {
            casulties(army, 0.1);
          });
          if(region.attackerEntrenchment <= 0) {
            console.log("Attacking armies have been forced out of the region");
            attackingArmies.forEach((army)=> {
              casulties(army, 0.02 * combat.winnerCavalry + 0.3);
              moveAttackerArmy(army._id.toString(), undefined, true);
            });
          }
          return;
        } else {
          // invaders win
          attackingArmies.forEach((army)=> {
            casulties(army, 0.5);
          });
          defendingArmies.forEach((army)=> {
            casulties(army, 0.2 + combat.winnerCavalry * 0.01);
          });
          return;
        }
      }
    } else {
      if(!defendingArmies || defendingArmies.length === 0) {
        console.log("Attackers retreated");
        const country = await CountryModel.findById(attackingArmies[0]._id);
        if(!country) {
          console.error("ERROR: conquest impossible due to 'no country'");
          return;
        }
        setRegionOwner(region.name, country.name, country.guildId, country.userId, true, false);
        return;
      } else {
        const combat = await landCombat(tempAttArmy, tempDefArmy, regionId, false);
        if(combat.attackerVictory) {
          //invaders win
          region.attackerEntrenchment += 1;
          await region.save();
          console.log(region.attackerEntrenchment);
          defendingArmies.forEach((army)=> {
            casulties(army, 0.01 * combat.winnerCavalry + 0.15);
          });
          attackingArmies.forEach((army)=> {
            casulties(army, 0.1);
          });
          if(region.entrenchment - region.attackerEntrenchment <= 0) {
            console.log("Defending armies have been forced out of the region");
            defendingArmies.forEach(async (army)=> {
              casulties(army, 0.01 * combat.winnerCavalry + 0.15);
              moveDefenderArmy(army._id.toString(), undefined, true);
              const country = await CountryModel.findById(attackingArmies[0]._id);
              if(!country) {
                console.error("ERROR: conquest impossible due to 'no country'");
                return;
              }
              setRegionOwner(region.name, country.name, country.guildId, country.userId, true, false);
            });
          }
          return;
        } else {
          // defenders win
          defendingArmies.forEach((army)=> {
            casulties(army, 0.5);
          });

          attackingArmies.forEach((army)=> {
            casulties(army, 0.2 + combat.winnerCavalry * 0.01);
          });
          return;
        }
      }
    }

  } catch (error) {
    console.error(`Error moving army: ${error}`);
  }
}

async function combineArmies(armies: ArmyType[]): Promise<ArmyType | null> {
  if (armies.length === 0) {
      return null; 
  }
  const combinedUnits: string[] = [];
  for (const army of armies) {
      combinedUnits.push(...army.units);
  }
  // Randomly select a commander among the defending armies
  const randomIndex: number = Math.floor(Math.random() * armies.length);
  const randomCommanderId: string = armies[randomIndex].commanderId;
  // Create a new army with the combined units and the randomly selected commander
  const combinedArmy: ArmyType = {
      regionId: armies[0].regionId,
      nationId: armies[0].nationId,
      commanderId: randomCommanderId,
      defender: armies[0].defender,
      units: combinedUnits,
  };
  return combinedArmy;
}
