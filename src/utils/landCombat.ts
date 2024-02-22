import { Document } from 'mongoose';
import ArmyModel, { ArmyType } from '../models/Army';
import UnitModel, { UnitType } from '../models/Unit';
import CountryModel, { CountryType } from '../models/Country';
import CommanderModel, { CommanderType } from '../models/Commander';
import {getTerrainModifier, getUnitPower} from '../utils/getUnitPower';
import rollTactics from '../utils/rollTactics';
import RegionModel from '../models/Region';
import WarModel from '../models/War';
import { equipmentCost } from './equipment';
import { moveAttackerArmy } from './moveDefenderArmy';

class CombatResults{
  attackerVictory: boolean  = false;
  winnerCavalry: number = 0;

  constructor(attackerVictory: boolean, winnerCavalry: number) {
    this.attackerVictory = attackerVictory;
    this.winnerCavalry = winnerCavalry;
  }
}

export async function landCombat(
  attackers: ArmyType,
  defenders: ArmyType,
  regionId: string,
  invasion: boolean,
): Promise<CombatResults> {

  //fetch the region
  const region = await RegionModel.findById(regionId);

  if(!region) {
    console.error(`missing region!`)
    return new CombatResults(false, 0);
  }

  if(attackers === null || defenders === null) {
    console.error(`missing army: \nattackers: ${attackers} \ndefenders: ${defenders}`)
    return new CombatResults(false, 0);
  }

  //calculate the attacker's power and morale
  let attackerPower: number = 0;
  let attackerMorale: number = 0;

  let attCav = 0;
  let defCav = 0;

  const attackerCountry = await CountryModel.findById(attackers.nationId);
  const defenderCountry = await CountryModel.findById(defenders.nationId);

  if(!attackerCountry || !defenderCountry) {
    console.error(`missing country!`)
    return new CombatResults(false, 0);
  }
  
  const attWins = await getWinningWars(attackerCountry);

  for (const unitId of attackers.units) {
    const unit = await UnitModel.findById( unitId );
    if(!unit) {
      console.log("unit not found");
      break;
    }

    if(unit.unitType === "CAVALRY") {
      attCav += 1;
    }

    if(attackerCountry.equipment - equipmentCost(unit) < 0) {
      attackerMorale = (attackerMorale + 4 + unit.morale + attWins);
      attackerPower += 1;
    } else {
      attackerCountry.equipment -= equipmentCost(unit);
      attackerPower += await getUnitPower(unit, region) * (attackerCountry?.tech || 1);
      attackerMorale += 5 + unit.morale + attWins;
    } 

    unit.combatExperience += 1;
    unit.save();
  }

  //calculate the defender's power and morale
  let defenderPower: number = 0;
  let defenderMorale: number = 0;
  const defWins = await getWinningWars(defenderCountry);

  for (const unitId of defenders.units) {
    const unit = await UnitModel.findById( unitId );

    if(!unit) {
      console.log("unit not found");
      break;
    }

    if(unit.unitType === "CAVALRY") {
      defCav += 1;
    }

    //handle equipment
    if(defenderCountry.equipment - equipmentCost(unit) < 0) {
      defenderMorale = (defenderMorale + 5 + defWins + unit.morale);
      defenderPower += 1;
    } else {
      defenderCountry.equipment -= equipmentCost(unit);
      defenderPower += await getUnitPower(unit, region) * (defenderCountry?.tech || 1);
      defenderMorale += 5 + unit.morale + defWins;
    }   

    unit.combatExperience += 1;
    unit.save();
  }

  //apply terrain modifiers
  defenderPower *= getTerrainModifier(region.terrain, invasion);

  //random tactics are rolled
  const attackingCommander = await CommanderModel.findOne({
    _id: attackers.commanderId,
  });
  const defendingCommander = await CommanderModel.findOne({
    _id: defenders.commanderId,
  });

  attackerPower *= rollTactics(attackingCommander?.skill || 1);
  defenderPower *= rollTactics(defendingCommander?.skill || 1);

  //morale advantage is added to the power
  if (defenderMorale > attackerMorale) {
    defenderPower += defenderMorale - attackerMorale;
  } else {
    attackerPower += attackerMorale - defenderMorale;
  }

  const attackerCombatStrength =
    Math.random() * attackerPower + attackerPower * 0.5;
  const defenderCombatStrength =
    Math.random() * defenderPower + defenderPower * 0.5;

  const attackerWin = attackerCombatStrength > defenderCombatStrength;
  console.log(`attacker strength: ${attackerCombatStrength} \ndefender strength: ${defenderCombatStrength}`);
  if(attackerWin) {
    updateWar(attackerCountry, defenderCountry);
  } else {
    updateWar(defenderCountry, attackerCountry);
  }

  attackerCountry.save();
  defenderCountry.save();

  return new CombatResults(attackerWin, attackerWin?attCav:defCav);
}

async function getWinningWars(country: CountryType) {
  let defensiveWars = await WarModel.find({defenderId: country._id});
  let offensiveWars = await WarModel.find({attackerId: country._id});

  defensiveWars = defensiveWars.filter((war) => {
    return war.winrate < 0.5;
  });

  offensiveWars = offensiveWars.filter((war) => {
    return war.winrate >= 0.5;
  });

  return defensiveWars.length + offensiveWars.length;
}

async function updateWar(winner: CountryType, loser: CountryType) {
  let war = await WarModel.findOne({ $or: [
    { defenderId: winner._id?.toString(), attackerId: loser._id?.toString() }, 
    { defenderId: loser._id?.toString(), attackerId: winner._id?.toString() }
  ]});

  if(!war) {
    war = await WarModel.create({
      attackerId: winner._id,
      defenderId: loser._id,
      winrate: 1,
      ongoing: true,
      attackerWarWin: false,
      attackerWins: 0,
      defenderWins: 0,
    });
    console.error("missing war, creating a new one");
  }

  if(war.attackerId === winner._id?.toString()) {
    war.attackerWins += 1;
  } else {
    war.defenderWins += 1;
  }

  if(war.defenderWins > 0) {
    war.winrate = war.attackerWins / (war.defenderWins + war.attackerWins);
  } else {
    war.winrate = 1;
  }

  war.save();
}



