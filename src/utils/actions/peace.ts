import RegionModel, { RegionType } from "../../models/Region";
import CountryModel, { CountryType } from "../../models/Country";
import ArmyModel, { ArmyType } from "../../models/Army";
import WarModel from "../../models/War";
import { moveAttackerArmy } from "../moveDefenderArmy";

export async function peace(args: any[]): Promise<void> {
  try {
    const countryId1 = args[0] as string;
    const countryId2 = args[1] as string;

      
    const country1 = await CountryModel.findById(countryId1);
    const country2 = await CountryModel.findById(countryId2);

    if(!country1 || !country2) {
      console.error(`Error occurred during peace process: missing country`);
      return;
    }

    // Find regions belonging to both countries
    const regions1 = await RegionModel.find({ nationId: countryId1 });
    const regions2 = await RegionModel.find({ nationId: countryId2 });

    // Move armies of country1 back to their capital region
    await moveHostileArmiesBackToCapital(regions1, country2);

    // Move armies of country2 back to their capital region
    await moveHostileArmiesBackToCapital(regions2, country1);

    const war = await WarModel.findOne({ $or: [
      { defenderId: country1._id?.toString(), attackerId: country2._id?.toString() }, 
      { defenderId: country2._id?.toString(), attackerId: country1._id?.toString() }
    ]});

    if(war) {
      war.ongoing = false;
      await war.save()
    } else {
      console.error(`Error occurred during peace process: missing war`);
    }

    console.log("Peace process completed successfully.");
  } catch (error) {
    console.error(`Error occurred during peace process: ${error}`);
  }
}

async function moveHostileArmiesBackToCapital(regions: RegionType[], country: CountryType): Promise<void> {
  for (const region of regions) {
    const hostileArmies = await ArmyModel.find({ regionId: region._id, nationId: country._id?.toString() });
    for (const army of hostileArmies) {
      await moveAttackerArmy(army.id, country.capitalId);
    }
  }
}