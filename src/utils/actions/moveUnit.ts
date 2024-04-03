import AllianceModel, { AllianceType } from "../../models/Alliance";
import ArmyModel from "../../models/Army";
import UnitModel from "../../models/Unit";

export async function moveUnit(args: any[]): Promise<void> {
  try {
  const armyId = args[0] as string;
  const untiId = args[1] as string;
  const neArmyId = args[2] as string;

  const army = await ArmyModel.findById(armyId);

  if(army === null || army === undefined) {
    console.error("army missing");
    return;
  }

  const newArmy = await ArmyModel.findById(neArmyId);

  if(newArmy === null || newArmy === undefined) {
    console.error("army missing");
    return;
  }

  const unit = await UnitModel.findById(untiId);

  if(unit === null || unit === undefined) {
    console.error("unit missing");
    return;
  }

  newArmy.units.push(unit._id.toString());
  unit.armyId = newArmy._id.toString();

  const index = army.units.findIndex((id) => id === unit._id.toString());
  if (index !== -1) {
    army.units.splice(index, 1);
  }
  
  await newArmy.save();
  await army.save();
  await unit.save();

  } catch (error) {
    console.error(`Invalid parameters ${error}`);
  }
}