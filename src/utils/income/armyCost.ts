import CountryModel, { CountryType } from "../../models/Country";
import RegionModel, { RegionType } from "../../models/Region";
import UnitModel, { UnitType } from "../../models/Unit";

async function armyCost(country: CountryType): Promise<void> {
  try {
    // Find all units belonging to the country
    const units: UnitType[] = await UnitModel.find({ nationId: country._id });

    // Calculate the total cost
    const totalCost: number = units.length * 3500;

    // Deduct the total cost from the country's money
    country.money -= totalCost;

  } catch (error) {
    console.error("Error deducting money for army upkeep:", error);
    throw error;
  }
}

export default armyCost;