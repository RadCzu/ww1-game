import AllianceModel from "../models/Alliance";
import { CountryType } from "../models/Country";
import WarModel from "../models/War";

export async function areAtWar(nation: CountryType, otherNation: CountryType): Promise<boolean> {

  if(!nation._id || !otherNation._id) {
    return true;
  }

  let war = await WarModel.findOne({ $or: [
    { defenderId: nation._id.toString(), attackerId: otherNation._id.toString(), ongoing: true }, 
    { defenderId: otherNation._id.toString(), attackerId: nation._id.toString(), ongoing: true }
  ]});


  if(!war) {
    return false; 
  } else {
    return true;
  }
}

export async function areAllied(nation: CountryType, otherNation: CountryType, guildId: string): Promise<boolean> {

  if(!nation._id || !otherNation._id) {
    return true;
  }

  const alliance = await AllianceModel.findOne({ 
    guildId: guildId, 
    memberNationIds: { 
        $all: [nation._id, otherNation._id] 
    }
});

  if(!alliance) {
    return false; 
  } else {
    return true;
  }
}

export async function allianceExists(guildId: string, name: string): Promise<boolean> {

  const alliance = await AllianceModel.findOne({ 
    guildId: guildId, 
    name: name,
  });

  if(!alliance) {
    return false; 
  } else {
    return true;
  }
}
