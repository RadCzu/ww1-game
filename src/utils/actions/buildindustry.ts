import AllianceModel, { AllianceType } from "../../models/Alliance";
import RegionModel from "../../models/Region";

export async function buildindustry(args: any[]): Promise<void> {
  try {
  const regionId = args[0] as string;
  const amount = args[1] as number;
  const military = args[2] as boolean;
  
  const region = await RegionModel.findById(regionId);

  if(region && region.factories !== undefined && region.milfactories !== undefined) {
    region.factories += amount;
    if(military) {
      region.milfactories += amount;
    }
    region.save();
    console.log(`${amount} factories built in ${region.name}`);
  }

  } catch (error) {
    console.error(`Invalid parameters ${error}`);
  }
}