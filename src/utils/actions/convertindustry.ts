import AllianceModel, { AllianceType } from "../../models/Alliance";
import RegionModel from "../../models/Region";

export async function convertindustry(args: any[]): Promise<void> {
  try {
  const regionId = args[0] as string;
  const amount = args[1] as number;
  const military = args[2] as boolean;
  
  const region = await RegionModel.findById(regionId);

  if(region && region.factories !== undefined && region.milfactories !== undefined) {
    if(military) {
      region.milfactories += amount;
    } else {
      region.milfactories -= amount;
    }

    await region.save();
    console.log(`factories converted in ${region.name}`);
  }

  } catch (error) {
    console.error(`Invalid parameters ${error}`);
  }
}