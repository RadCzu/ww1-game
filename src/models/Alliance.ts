import {Schema, Types, model} from "mongoose";

interface AllianceType {
  _id?: Types.ObjectId;
  name: string;
  guildId: string;
  roleId: string;
  channelId: string;
  memberNationIds: string[];
}

const allianceSchema = new Schema({
  guildId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  roleId: {
    type: String,
    required: true,
  },
  channelId: {
    type: String,
    required: true,
  },
  memberNationIds: {
    type: [String],
    required: true,
    default: [],
  },
})

const AllianceModel = model<AllianceType & Document>('Alliance', allianceSchema);

export default AllianceModel;
export {AllianceType};