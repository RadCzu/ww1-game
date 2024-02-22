import Army from "../models/Army";
import Region, { RegionType } from "../models/Region";
import { UnitType } from '../models/Unit';

function getPowerInTerrain(unitType: string, terrain: string): number {
  if(unitType === "CAVALRY") {
    switch (terrain) {
      case "WASTELAND":
        return 5.3;
      case "PLAINS":
        return 4.4;
      case "WOODS":
        return 4;
      case "MOUNTAINS":
        return 2.5;
      case "COAST":
        return 3;
      default:
        break;
    }
  }
  return 4;
}

function getTerrainModifier(terrain: string, invasion: boolean): number {
  if(invasion) {
    switch (terrain) {
      case "WASTELAND":
        return 0.9;
      case "PLAINS":
        return 1;
      case "WOODS":
        return 1.25;
      case "MOUNTAINS":
        return 1.2;
      case "COAST":
        return 1.5;
      default:
        break;
    }
  } else {
    switch (terrain) {
      case "WASTELAND":
        return 1.25;
      case "PLAINS":
        return 1.2;
      case "WOODS":
        return 1.25;
      case "MOUNTAINS":
        return 1.3;
      case "COAST":
        return 1.15;
      default:
        break;
    }
  }
  return 1;
}

async function getUnitPower(unit: UnitType, region: RegionType): Promise<number> {
  const experience = unit.combatExperience ? unit.combatExperience * 0.2 : 0;
  switch (unit.unitType) {
    case "INFANTRY":
      return 5 + experience;
    case "CAVALRY":
      return getPowerInTerrain(unit.unitType, region.terrain) + experience;
    case "TANK":
      return 10 + experience;
    case "ARTILLERY":
      return 1 + experience;
    default:
      console.log(`Something went wrong with the unit: ${unit}`);
      return 0 + experience;
  }
}

function getUnitTypePower(unitType: string, terrain: string): number {
  switch (unitType) {
    case "INFANTRY":
      return 5;
    case "CAVALRY":
      return getPowerInTerrain(unitType, terrain);
    case "TANK":
      return 10;
    case "ARTILLERY":
      return 1;
    default:
      console.log(`Something went wrong`);
      return 0;
  }
}

export {getUnitPower, getUnitTypePower, getTerrainModifier};
