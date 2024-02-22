
import ArmyModel, { } from '../../models/Army';
import UnitModel, { UnitType } from '../../models/Unit';

export async function mobilise(args: any[]): Promise<void> {
  try {
    const armyId: string = args[0] as string;
    const infantry: number = args[1] as number;
    const cavalry: number = args[2] as number;
    const artillery: number = args[3] as number;
    const tanks: number = args[4] as number;

    const army = await ArmyModel.findById(armyId);

    for(let i = 0; i < infantry; i++) {
      const newUnit: UnitType = {
        name: `${army?.name} ${i + 1} infantry division`,
        unitType: "INFANTRY",
        nationId: army?.nationId,
        armyId: armyId,
        combatExperience: 0,
        morale: 0,
      };
      const model = new UnitModel(newUnit);
      model.save();
      army?.units.push(model._id.toString());
    }

    for(let i = 0; i < cavalry; i++) {
      const newUnit: UnitType = {
        name: `${army?.name} ${i + 1} cavalry division`,
        unitType: "CAVALRY",
        nationId: army?.nationId,
        armyId: armyId,
        combatExperience: 0,
        morale: 0,
      };
      const model = new UnitModel(newUnit);
      model.save();
      army?.units.push(model._id.toString());
    }

    for(let i = 0; i < artillery; i++) {
      const newUnit: UnitType = {
        name: `${army?.name} ${i + 1} artillery division`,
        unitType: "ARTILLERY",
        nationId: army?.nationId,
        armyId: armyId,
        combatExperience: 0,
        morale: 0,
      };
      const model = new UnitModel(newUnit);
      model.save();
      army?.units.push(model._id.toString());
    }

    for(let i = 0; i < tanks; i++) {
      const newUnit: UnitType = {
        name: `${army?.name} ${i + 1} tank division`,
        unitType: "TANK",
        nationId: army?.nationId,
        armyId: armyId,
        combatExperience: 0,
        morale: 0,
      };
      const model = new UnitModel(newUnit);
      model.save();
      army?.units.push(model._id.toString());
    }
    
    army?.save();

    console.log(`Units mobilised for ${army?.name}`);
  } catch (error) {
    console.error(`Error mobilising units to army: ${error}`);
  }
}