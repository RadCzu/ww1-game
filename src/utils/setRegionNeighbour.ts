import RegionModel, { RegionType } from '../models/Region';

async function setRegionConnection(regionName1: string, regionName2: string, guildId: string): Promise<void> {
  // Find the regions by names and guildId
  const region1 = await RegionModel.findOne({ name: regionName1, guildId: guildId });
  const region2 = await RegionModel.findOne({ name: regionName2, guildId: guildId });

  if (!region1 || !region2) {
    // Handle if any of the regions is not found
    console.error(`One or both regions not found in guild ${guildId}.`);
    return;
  }

  if(!region1.neighbours) {
    region1.neighbours = [];
  }

  if(!region2.neighbours) {
    region2.neighbours = [];
  }

  // Assign region2 to the neighbors of region1
  region1.neighbours.push(region2._id.toString());

  // Assign region1 to the neighbors of region2
  region2.neighbours.push(region1._id.toString());

  // Save the changes to the database
  await region1.save();
  await region2.save();

  // Log the connection
  console.log(`Regions ${regionName1} and ${regionName2} are now neighbors in guild ${guildId}.`);
}

async function removeRegionConnection(regionName1: string, regionName2: string, guildId: string): Promise<void> {
  // Find the regions by names and guildId
  const region1 = await RegionModel.findOne({ name: regionName1, guildId: guildId });
  const region2 = await RegionModel.findOne({ name: regionName2, guildId: guildId });

  if (!region1 || !region2) {
    // Handle if any of the regions is not found
    console.error(`One or both regions not found in guild ${guildId}.`);
    return;
  }

  if(!region1.neighbours) {
    region1.neighbours = [];
  }

  if(!region2.neighbours) {
    region2.neighbours = [];
  }

  // Remove region2 from the neighbors of region1
  region1.neighbours = region1.neighbours.filter(neighbourId => neighbourId !== region2._id.toString());

  // Remove region1 from the neighbors of region2
  region2.neighbours = region2.neighbours.filter(neighbourId => neighbourId !== region1._id.toString());

  // Save the changes to the database
  await region1.save();
  await region2.save();

  // Log the disconnection
  console.log(`Connection between regions ${regionName1} and ${regionName2} removed in guild ${guildId}.`);
}

export { setRegionConnection, removeRegionConnection };