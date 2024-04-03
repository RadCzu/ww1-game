import {Schema, Types, model} from "mongoose";

interface TurnCounterType {
  _id?: Types.ObjectId;
  guildId: string;
  turn: number;
  announcementChannelId: string;
  allianceCategoryId: string;
}

const turnCounterScheema = new Schema({
  guildId: {
    type: String,
    required: true,
  },
  turn: {
    type: Number,
    required: true,
  },
  announcementChannelId: {
    type: String,
    required: true,
  },
  allianceCategoryId: {
    type: String,
    required: true,
  },
})

const TurnCounterModel = model<TurnCounterType & Document>('TurnCounter', turnCounterScheema);

export default TurnCounterModel;
export {TurnCounterType};