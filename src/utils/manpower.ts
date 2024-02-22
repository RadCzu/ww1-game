import { ArmyType } from '../models/Army';
import RegionModel, { RegionType } from '../models/Region';

async function calculateTotalManpower(countryId: string): Promise<number> {
  try {
    
    // Find all regions belonging to the specified country
    const regions = await RegionModel.find({ nationId: countryId });

    // Calculate total manpower from all regions
    const totalManpower = regions.reduce((sum, region) => sum + (region.manpower || 0), 0);

    return totalManpower;
  } catch (error) {
    console.error(`Error calculating total manpower: ${error}`);
    return 0;
  }
}

async function killManpower(nationId: string, amount: number): Promise<void> {

  let countryRegions = await RegionModel.find({ nationId: nationId });
  let remainingManpower = amount;

  countryRegions = shuffleArray(countryRegions);
  for (const region of countryRegions) {
    // Subtract manpower and population
    if(region.manpower)
    if ( region.manpower <= remainingManpower) {
      const temp = remainingManpower - region.manpower;
      region.population -= region.manpower;
      region.manpower = 0;
      remainingManpower = temp;
    } else {
      region.manpower -= remainingManpower;
      region.population -= remainingManpower;
      remainingManpower = 0;
    }

    // Save the changes to the database
    await region.save();

    if (remainingManpower <= 0) {
      break;
    }
  }
}

async function killManpowerFromRegion(regionId: string, amount: number): Promise<void> {
  const region = await RegionModel.findById(regionId);

  if (!region) {
    throw new Error(`Region with ID ${regionId} not found.`);
  }

  // Subtract manpower and population
  if (region.manpower && region.manpower >= amount) {
    region.manpower -= amount;
  } else {
    region.manpower = 0;
  }

  region.population -= amount;

  // Save the changes to the database
  await region.save();
}

async function calculateRegionManpower(regionId: string): Promise<number> {
  try {
    
    // Find region
    const region = await RegionModel.findById({ regionId: regionId });

    if(!region) {
      return 0;
    }

    // Calculate total manpower from all regions
    if(region.manpower) {
      return region.manpower;
    } else {
      return 0;
    }
    
  } catch (error) {
    console.error(`Error calculating total manpower: ${error}`);
    return 0;
  }
}

async function casulties(army: ArmyType, procent: number): Promise<void> {
  try {
    // Calculate total manpower of the army owner
    const totalManpower = await calculateTotalManpower(army.nationId);

    // Calculate the limit for casualties
    const casualtyLimit = procent * 10000 * army.units.length;

    // If the casualty limit exceeds the total manpower, adjust the limit
    if (casualtyLimit > totalManpower) {
      // Determine the number of units to remove
      const unitsToRemove = Math.ceil((casualtyLimit - totalManpower) / 10000);
      
      // Remove random units from the army
      for (let i = 0; i < unitsToRemove; i++) {
        const randomIndex = Math.floor(Math.random() * army.units.length);
        army.units.splice(randomIndex, 1);
      }

      // Distribute the removed manpower back to a random region owned by the nation
      for (let i = 0; i < unitsToRemove; i++) {
        const regions = await RegionModel.find({ nationId: army.nationId });
        
        const randomRegion = shuffleArray(regions)[0];
        if (randomRegion && randomRegion.manpower) {
          randomRegion.manpower += 10000;
          await randomRegion.save();
        }
      }
    }

    // Call the killManpower function to apply casualties
    await killManpower(army.nationId, casualtyLimit);
  } catch (error) {
    console.error(`Error calculating casualties: ${error}`);
  }
}


function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export {calculateTotalManpower, killManpower, killManpowerFromRegion, calculateRegionManpower, casulties};
