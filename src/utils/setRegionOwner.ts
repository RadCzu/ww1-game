import CountryModel, { CountryType } from '../models/Country';
import RegionModel, { RegionType } from '../models/Region';

async function setRegionOwner(regionName: string, nationName: string, guildId: string, userId: string, triggerResistance: boolean, setAsCapital: boolean): Promise<void> {
  // Find the region by name
  const region = await RegionModel.findOne({ name: regionName, guildId: guildId});
  if(!region) {
    console.log("didnt find the region");
    return;
  }


  
  // Find the country by name and guildId
  const country = await CountryModel.findOne({ name: nationName, guildId: guildId, userId: userId});

  if(!country) {
    console.log("didnt find the country");
    return;
  }

  if(setAsCapital) {
    country.capitalId = region._id.toString();
    region.resistance = 90;
  }

  // Unassign the region from any previous country
  const previousCountry = await CountryModel.findOneAndUpdate(
    { _id: region.nationId },
    { $pull: { regions: region._id } },
  );

  if(triggerResistance && region.resistance && region.taxes && region.manpower) {
    region.taxes = Math.floor(region.taxes * (region.resistance / 100));
    region.manpower = Math.floor(region.manpower * (region.resistance / 100));
    region.resistance = Math.floor(region.resistance * 0.2);
    if(previousCountry && previousCountry.stability) {
      previousCountry.stability -= 10;
      country.stability += 5;
      if(previousCountry.capitalId === region._id.toString()) {
        previousCountry.stability -= 55;
      }
    }
  }

  // Update the region's nationId field
  region.nationId = country._id;

  // Update the country's regions field
  country.regions.push(region._id.toString());

  // Save the changes to the database
  await region.save();
  await country.save();
  await previousCountry?.save();

  // Log the assignment
    console.log(`Region ${regionName} assigned to country ${nationName} in guild ${guildId}.`);

  // If there was a previous country, log the unassignment
  if (previousCountry) {
    console.log(`Region ${regionName} unassigned from country ${previousCountry.name} in guild ${guildId}.`);
  }
}

export default setRegionOwner;