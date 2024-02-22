
import ArmyModel, { ArmyType } from '../../models/Army';
import CountryModel from '../../models/Country';
import RegionModel, { RegionType } from '../../models/Region';
import { landCombat } from '../landCombat';
import { casulties, killManpower } from '../manpower';
import { moveDefenderArmy } from '../moveDefenderArmy';
import setRegionOwner from '../setRegionOwner';

export async function invade(args: any[]): Promise<void> {
  try {
    const armyId: string = args[0].toString();
    const newRegionId: string = args[1].toString();

    // Fetch the army from the database
    const attackerArmy = await ArmyModel.findById(armyId);

    const country = await CountryModel.findById(attackerArmy?.nationId);
    if (!attackerArmy) {
      console.error(`Army not found with ID: ${armyId}`);
      return;
    }

    if(!country) {
      console.error(`Country not found with ID: ${attackerArmy?.nationId}`);
      return;
    }

    // Fetch the old and new regions from the database
    const oldRegion = await RegionModel.findById(attackerArmy.regionId);
    const newRegion = await RegionModel.findById(newRegionId);
    if(!newRegion) {
      console.error(`REGION NOT FOUND`);
      return;
    }

    if(!oldRegion) {
      console.error(`REGION NOT FOUND`);
      return;
    }

    //execute correct scenario

    if(newRegion.defendingArmies && newRegion.defendingArmies.length > 0) {
      //fetch all defenders into a new army
      const defenderIds = newRegion.defendingArmies;

      const defendingArmies = await ArmyModel.find({ _id: { $in: [defenderIds]}  });
      if(!defendingArmies) {
        console.error(` Defending armies not found`);
        return;
      }

      const tempArmy: ArmyType | null = await combineDefendingArmies(defendingArmies as unknown as ArmyType[]);
      if(!tempArmy) {
        console.error("all armies missing");
        return;
      }
      const invasion = await landCombat(attackerArmy, tempArmy, newRegion._id.toString(), true);

      if(invasion.attackerVictory) {
        // Add the army to the new region's attacking armies list
        if(!newRegion.attackingArmies) {
          newRegion.attackingArmies = [];
        }

        // Update the army's regionId to the new region
        newRegion.attackingArmies.push(armyId); 
        attackerArmy.regionId = newRegionId;
        attackerArmy.defender = false;
        
        // Remove the army from the old region's defending armies list
        if(!oldRegion.defendingArmies) {
          oldRegion.defendingArmies = [];
        }
 
        oldRegion.defendingArmies = oldRegion.defendingArmies.filter((a) => a !== armyId);

        //casulties:

        defendingArmies.map(async (army) => {
          casulties(army, 0.01 * invasion.winnerCavalry + 0.15);
        });

        casulties(attackerArmy, 0.1);
        
        // Add excess entrenchment to the attacker
        if(!newRegion.attackerEntrenchment || newRegion.attackerEntrenchment < 3) {
        newRegion.attackerEntrenchment = 3;
        }
        if(newRegion.entrenchment) {
          newRegion.entrenchment -= 1;
          if(newRegion.entrenchment - newRegion.attackerEntrenchment <= 0) {
            defendingArmies.map(army => {
              if(army._id)
              moveDefenderArmy(army._id.toString(), undefined, true);
            })
            setRegionOwner(newRegion.name, country.name, country.guildId, country.userId, true, false);
            // make the defender retreat;
          }
        }

        await defendingArmies.forEach(army => army.save());
        await oldRegion.save();
        await attackerArmy.save();
        await newRegion.save();
        console.log(`Army moved successfully from ${oldRegion.name} to ${newRegion.name}`);
      } else {
        // when the defender wins
        // only casulties happen

        //casulties:
        defendingArmies.map(async (army) => {
          casulties(army, 0.05);
        });

        casulties(attackerArmy, 0.01 * invasion.winnerCavalry + 0.2);
        await defendingArmies.forEach(army => army.save());
        await oldRegion.save();
        await attackerArmy.save();
        await newRegion.save();
        console.log(`Army ${attackerArmy.name} failed to invade ${newRegion.name}`);
      }
    } else {
      setRegionOwner(newRegion.name, country.name, country.guildId, country.userId, true, false);

      newRegion.defendingArmies = [attackerArmy._id.toString()];

      if(!oldRegion.defendingArmies) {
        oldRegion.defendingArmies = [];
      }
      oldRegion.defendingArmies = oldRegion.defendingArmies.filter((a) => a !== armyId);

      await oldRegion.save();
      await attackerArmy.save();
      await newRegion.save();
    }

  } catch (error) {
    console.error(`Error moving army: ${error}`);
  }
}

async function combineDefendingArmies(defendingArmies: ArmyType[]): Promise<ArmyType | null> {
  if (defendingArmies.length === 0) {
      return null; 
  }
  const combinedUnits: string[] = [];
  for (const army of defendingArmies) {
      combinedUnits.push(...army.units);
  }
  // Randomly select a commander among the defending armies
  const randomIndex: number = Math.floor(Math.random() * defendingArmies.length);
  const randomCommanderId: string = defendingArmies[randomIndex].commanderId;
  // Create a new army with the combined units and the randomly selected commander
  const combinedDefenderArmy: ArmyType = {
      regionId: defendingArmies[0].regionId,
      nationId: defendingArmies[0].nationId,
      commanderId: randomCommanderId,
      defender: true,
      units: combinedUnits,
  };
  return combinedDefenderArmy;
}
