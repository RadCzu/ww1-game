import CountryModel, { CountryType } from "../../models/Country";
import RegionModel, { RegionType } from "../../models/Region";

async function equipmentIncome(country: CountryType): Promise<void> {

  if(!country) {
    return;
  }

// Fetch region equipment information
  for (const regionId of country.regions) {
    const region  = await RegionModel.findById(regionId) as RegionType;
    if (region && region.factories !== undefined && region.milfactories !== undefined) {
      country.equipment += region.milfactories;
      country.money += (region?.factories - region.milfactories) * 4000;
      country.money -= region.milfactories * 5000;
    }
  }
}

export default equipmentIncome;