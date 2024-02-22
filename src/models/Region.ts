import {Schema, Types, model} from "mongoose";

interface RegionType {
  _id?: Types.ObjectId;
  name: string;
  terrain: string;
  nationId?: string;
  population: number;
  manpower?: number;
  factories?: number;
  milfactories?: number;
  entrenchment?: number;
  resistance?: number;
  guildId: string;
  attackerEntrenchment?: number;
  attackingArmies?: string[];
  taxes?: number;
  defendingArmies?: string[];
  neighbours?: string[];
}

const regionSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  guildId: {
    type: String,
    required: true,
  },
  terrain: {
    type: String,
    required: true,
    default: "PLAINS",
  },
  nationId: {
    type: String,
    required: false,
  },
  population: {
    type: Number,
    required: true,
    default: 0,
  },
  manpower: {
    type: Number,
    required: true,
    default: 0,
  },
  factories: {
    type: Number,
    required: true,
    default: 0,
  },
  milfactories: {
    type: Number,
    required: true,
    default: 0,
  },
  taxes: {
    type: Number,
    required: true,
    default: 0,
  },
  entrenchment: {
    type: Number,
    required: true,
    default: 1,
  },
  resistance: {
    type: Number,
    required: true,
    default: 50,
  },
  attackerEntrenchment: {
    type: Number,
    required: true,
    default: 0,
  },
  attackingArmies: {
    type: Array,
    required: true,
    default: [],
  },
  defendingArmies: {
    type: Array,
    required: true,
    default: [],
  },
  neighbours: {
    type: Array,
    required: true,
    default: [],
  },
})

const RegionModel = model<RegionType & Document>('Region', regionSchema);

export default RegionModel;
export { RegionType };