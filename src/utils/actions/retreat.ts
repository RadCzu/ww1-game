
import { nextTick } from 'process';
import ArmyModel, { ArmyType } from '../../models/Army';
import CountryModel from '../../models/Country';
import RegionModel, { RegionType } from '../../models/Region';
import { landCombat } from '../landCombat';
import { casulties, killManpower } from '../manpower';
import { moveAttackerArmy, moveDefenderArmy } from '../moveDefenderArmy';
import setRegionOwner from '../setRegionOwner';

export async function retreat(args: any[]): Promise<void> {
  try {
    const armyId: string = args[0].toString();
    const newRegionId: string = args[1].toString();
    const all: boolean = args[2];

    // Fetch the army from the database
    const army = await ArmyModel.findById(armyId);

    const country = await CountryModel.findById(army?.nationId);
    if (!army) {
      console.error(`Army not found with ID: ${armyId}`);
      return;
    }

    if(!country) {
      console.error(`Country not found with ID: ${army?.nationId}`);
      return;
    }

    // Fetch the old and new regions from the database
    const oldRegion = await RegionModel.findById(army.regionId);
    const newRegion = await RegionModel.findById(newRegionId);
    if(!newRegion) {
      console.error(`REGION NOT FOUND`);
      return;
    }

    if(!oldRegion || !oldRegion.defendingArmies || !oldRegion.attackingArmies) {
      console.error(`REGION NOT FOUND`);
      return;
    }

    //execute

    if(army.defender) {
      if(all) {
        const armies = await ArmyModel.find({nationId: army.nationId, regionId: army.regionId});
        for(const playerArmy of armies) {
          await moveDefenderArmy(playerArmy._id.toString(), newRegion.id, false);
          await casulties(playerArmy, 5);
          await playerArmy.save();
        }
      } else {
        await moveDefenderArmy(armyId, newRegion.id, false);
        await casulties(army, 5);
        await army.save();
      }
    } else {
      if(all) {
        const armies = await ArmyModel.find({nationId: army.nationId, regionId: army.regionId});
        for(const playerArmy of armies) {
          await moveAttackerArmy(armyId, newRegion.id, false);
          await casulties(army, 5);
          await playerArmy.save();
        }
      } else {
        await moveAttackerArmy(armyId, newRegion.id, false);
        await casulties(army, 5);
        await army.save();
      }
    }

    console.log(`army: ${army.name} moved to: ${newRegion.name}`);

  } catch (error) {
    console.error(`Error moving army: ${error}`);
  }
}