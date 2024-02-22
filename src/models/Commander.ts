import { Schema, model, Document, Types } from 'mongoose';

interface CommanderType {
  _id?: Types.ObjectId;
  name: string;
  nationId?: string;
  skill: number;
}

const commanderSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  nationId: {
    type: String,
    required: false,
  },
  skill: {
    type: Number,
    required: true,
  },
});

const CommanderModel = model<CommanderType & Document>('Commander', commanderSchema);

export default CommanderModel;
export { CommanderType };