import {Schema, Types, model} from "mongoose";

type UnitType = {
  _id?: Types.ObjectId;
  name: string;
  unitType: string;
  nationId?: string;
  morale: number;
  armyId: string;
  combatExperience: number;
}

const unitSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  unitType: {
    type: String,
    required: true,
  },
  nationId: {
    type: String,
    required: false,
  },
  armyId: {
    type: String,
    required: true,
  },
  morale: {
    type: Number,
    required: false,
    default: 0,
  },
  combatExperience: {
    type: Number,
    required: true,
  },
})

const UnitModel = model<UnitType & Document>('Unit', unitSchema);

export default UnitModel;
export {UnitType};

