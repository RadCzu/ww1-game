
import ArmyModel, { } from '../../models/Army';
import RegionModel, { } from '../../models/Region';
import { moveDefenderArmy } from '../moveDefenderArmy';

export async function movearmy(args: any[]): Promise<void> {
  try {
    const armyId: string = args[0].toString();
    const newRegionId: string = args[1].toString();

    moveDefenderArmy(armyId, newRegionId)

  } catch (error) {
    console.error(`Error moving army: ${error}`);
  }
}