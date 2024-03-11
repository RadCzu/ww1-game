import AllianceModel from "../models/Alliance";
import ArmyModel from "../models/Army";
import RegionModel, { RegionType } from "../models/Region";


async function moveDefenderArmy(armyId: string, newRegionId?: string, random?: boolean): Promise<boolean> {


  let newRegion = await RegionModel.findById(newRegionId);

  // Fetch the army from the database
  const army = await ArmyModel.findById(armyId);

  if (!army) {
    console.error(`Army not found with ID: ${armyId}`);
    return true;
  }

  const oldRegion = await RegionModel.findById(army?.regionId);

  if(!oldRegion) {
    console.error(`REGION NOT FOUND`);
    return true;
  }

  if(random) {
    const possibleEscapes = oldRegion.neighbours;
    if(!possibleEscapes || possibleEscapes.length === 0) {
      console.log(`Army oblitterated in ${oldRegion.name} due to no possible escape`);
      return false;
    }

    //check weather the army owner is friends with any neighbouring regions
    const alliances = await AllianceModel.find({ guildId: oldRegion.guildId, memberNationIds: { $elemMatch: { $eq: army.nationId }}});
    const allianceMemberNationIds = alliances.map(alliance => alliance.memberNationIds).flat();
    const ownedNeighbouringRegions = await RegionModel.find({ nationId: { $in: allianceMemberNationIds }, guildId: oldRegion.guildId });

    if(!`ownedNeighbouringRegions` || ownedNeighbouringRegions.length === 0) {
      console.log(`Army oblitterated in ${oldRegion.name} due to no possible escape`);
      return false;
    }
    const randomRegionId = Math.floor(Math.random() * ownedNeighbouringRegions.length);

    newRegion = ownedNeighbouringRegions[randomRegionId - 1];
  } 

  console.log("new defender region:");
  console.log(newRegion);

  if(!newRegion) {
    console.error(`REGION NOT FOUND`);
    return true;
  }

  // Remove the army from the old region's defending armies list
  if(!oldRegion.defendingArmies) {
    oldRegion.defendingArmies = [];
  }

  if(!newRegion.defendingArmies) {
    newRegion.defendingArmies = [];
  }

  oldRegion.defendingArmies = oldRegion.defendingArmies.filter((a) => a !== armyId);
  await oldRegion.save();

  // Add the army to the new region's defending armies list
  newRegion.defendingArmies.push(armyId);
  await newRegion.save();

  // Update the army's regionId to the new region

  army.regionId = newRegion._id.toString();
  await army.save();

  console.log(`Army moved successfully from ${oldRegion.name} to ${newRegion.name}`);

  return true;
}

async function moveAttackerArmy(armyId: string, newRegionId?: string, random?: boolean): Promise<boolean> {

  let newRegion = await RegionModel.findOne({_id: newRegionId});

  // Fetch the army from the database
  const army = await ArmyModel.findById(armyId);

  if (!army) {
    console.error(`Army not found with ID: ${armyId}`);
    return true;
  }

  const oldRegion = await RegionModel.findById(army?.regionId);

  if(!oldRegion) {
    console.error(`REGION NOT FOUND`);
    return true;
  }

  if(random) {
    const possibleEscapes = oldRegion.neighbours;

    if(!possibleEscapes || possibleEscapes.length === 0) {
      console.log(`Attacking army oblitterated in ${oldRegion.name} no possible escape`);
      return false;
    }

    //check weather the army owner is friends with any neighbouring regions
    const alliances = await AllianceModel.find({ guildId: oldRegion.guildId, memberNationIds: { $elemMatch: { $eq: army.nationId }}});
    const allianceMemberNationIds = alliances.map(alliance => alliance.memberNationIds).flat();
    const ownedNeighbouringRegions = await RegionModel.find({ nationId: { $in: allianceMemberNationIds }, guildId: oldRegion.guildId });

    if(!ownedNeighbouringRegions || ownedNeighbouringRegions.length === 0) {
      console.log(`Attacking army oblitterated in ${oldRegion.name} due to no possible escape`);
      return false;
    }

    const randomRegionIndex = Math.floor(Math.random() * ownedNeighbouringRegions.length);
    newRegion = ownedNeighbouringRegions[randomRegionIndex - 1];
  } 

  if(!newRegion) {
    console.error(`REGION NOT FOUND`);
    return true;
  }

  // Remove the army from the old region's defending armies list
  if(!oldRegion.attackingArmies) {
    oldRegion.attackingArmies = [];
  }

  if(!newRegion.defendingArmies) {
    newRegion.defendingArmies = [];
  }

  oldRegion.attackingArmies = oldRegion.attackingArmies.filter((a) => a !== armyId);

  if(oldRegion.attackingArmies.length <= 0) {
    oldRegion.attackerEntrenchment = 0;
  }

  await oldRegion.save();

  // Add the army to the new region's defending armies list
  newRegion.defendingArmies.push(armyId);
  await newRegion.save();

  // Update the army's regionId to the new region

  army.regionId = newRegion._id.toString();
  army.defender = true;
  await army.save();

  console.log(`Army moved successfully from ${oldRegion.name} to ${newRegion.name}`);

  return true;
}

export { moveDefenderArmy, moveAttackerArmy}