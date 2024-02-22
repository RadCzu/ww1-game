import CountryModel, { CountryType } from "../../models/Country";
import RegionModel, { RegionType } from "../../models/Region";

async function taxIncome(country: CountryType): Promise<void> {

  if(!country) {
    return;
  }

// Fetch region tax information
  for (const regionId of country.regions) {
    const region  = await RegionModel.findById(regionId) as RegionType;
    if (region && region.taxes) {
      country.money += region?.taxes;
    }
  }
}

export default taxIncome;