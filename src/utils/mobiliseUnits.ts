import { ArmyType } from "../models/Army";
import UnitModel, { UnitType } from "../models/Unit";
import  { calculateRegionManpower, calculateTotalManpower, killManpower, killManpowerFromRegion } from "../utils/manpower";

async function createUnits(army: ArmyType, armyId: string, unitCount: number, unitType: string): Promise<UnitType[]> {
  // Create units and save them to the database
  const createdUnits: UnitType[] = [];
  const requiredManpower = unitCount * 10000; // Each unit requires 10,000 manpower

  if(army.nationId){
    // Calculate total available manpower for the country
      const totalAvailableManpower = await calculateTotalManpower(army.nationId);
    // Check if the country has enough manpower for the units
    if (totalAvailableManpower < requiredManpower) {
      return createdUnits;
    }
    killManpower(army.nationId, requiredManpower);
  } else {  
    const totalAvailableManpower = await calculateRegionManpower(army.regionId)
    if (totalAvailableManpower < requiredManpower) {
      return createdUnits;
    }
    killManpowerFromRegion(army.regionId, totalAvailableManpower);
  }

  for (let i = 0; i < unitCount; i++) {
    const newUnit: UnitType = {
      name: `Unit ${Math.random() * Math.random()}`,
      unitType: unitType,
      nationId: army.nationId,
      armyId: armyId,
      combatExperience: 0,
      morale: 0,
    };

    const unit = new UnitModel(newUnit);
    await unit.save();

    createdUnits.push(newUnit);
  }

  return createdUnits;
}

export default createUnits;
