import { Schema, model, Document, Types } from 'mongoose';

interface CountryType {
  _id?: Types.ObjectId;
  userId: string;
  guildId: string;
  gameId: string;
  name: string;
  capitalId: string;
  actions: number;
  stability: number;
  politicalPower: number;
  tech: number;
  equipment: number;
  money: number;
  regions: string[]; 
}

const countrySchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  gameId: {
    type: String,
    required: true,
  },
  guildId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  capitalId: {
    type: String,
    required: false,
  },
  equipment: {
    type: Number,
    required: true,
    default: 0,
  },
  actions: {
    type: Number,
    required: true,
    default: 0,
  },
  stability: {
    type: Number,
    required: true,
  },
  politicalPower: {
    type: Number,
    required: true,
  },
  tech: {
    type: Number,
    required: true,
  },
  money: {
    type: Number,
    required: true,
  },
  regions: {
    type: Array,
    required: true,
  },
})

const CountryModel = model<CountryType & Document>('Country', countrySchema);

export default CountryModel;
export { CountryType };