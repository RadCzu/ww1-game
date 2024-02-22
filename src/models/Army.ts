import {Schema, Types, model} from "mongoose";

interface ArmyType {
  _id?: Types.ObjectId;
  regionId: string;
  nationId: string;
  commanderId: string;
  defender: boolean;
  name?: string;
  units: string[];
}

const armySchema = new Schema({
  nationId: {
    type: String,
    required: true,
  },
  regionId: {
    type: String,
    required: true,
  },
  commanderId: {
    type: String,
    required: true,
  },
  defender: {
    type: Boolean,
    required: true,
    default: true,
  },
  name: {
    type: String,
    required: false,
  },
  units: {
    type: Array,
    required: true,
  },

})

const ArmyModel = model<ArmyType & Document>('Army', armySchema);

export default ArmyModel;
export {ArmyType};