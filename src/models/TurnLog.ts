import {Schema, Types, model} from "mongoose";

interface TurnLogType {
  _id?: Types.ObjectId;
  guildId: string;
  nationId: string;
  turn: number;
  action: string;
  args: any[];
}

const turnLogScheema = new Schema({
  guildId: {
    type: String,
    required: true,
  },
  nationId: {
    type: String,
    required: true,
  },
  turn: {
    type: Number,
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  args: {
    type: [Schema.Types.Mixed],
    required: true,
  },
})

const TurnLogModel = model<TurnLogType & Document>('TurnLog', turnLogScheema);

export default TurnLogModel;
export {TurnLogType};