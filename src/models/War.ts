import {Schema, Types, model} from "mongoose";

interface WarType {
  _id?: Types.ObjectId;
  attackerId: string;
  defenderId: string;
  winrate: number;
  ongoing: boolean;
  attackerWarWin?: boolean;
  attackerWins: number;
  defenderWins: number;
}

const warSchema = new Schema({
  attackerId: {
    type: String,
    required: true,
  },
  defenderId: {
    type: String,
    required: true,
  },
  winrate: {
    type: Number,
    required: true,
    default: 0.5,
  },
  ongoing: {
    type: Boolean,
    required: true,
  },
  attackerWarWin: {
    type: Boolean,
    required: false,
  },
  defenderWins: {
    type: Number,
    required: false,
  },
  attackerWins: {
    type: Number,
    required: false,
  },
})

const WarModel = model<WarType & Document>('War', warSchema);

export default WarModel;
export {WarType};