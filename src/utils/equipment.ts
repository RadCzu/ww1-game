import { CountryType } from "../models/Country";
import { UnitType } from "../models/Unit";

function equipmentCost(unit: UnitType): number {
  switch (unit.unitType) {
    case "INFANTRY":
      return 1;
    case "CAVALRY":
      return 1;
    case "TANK":
      return 3;
    case "ARTILLERY":
      return 1;
    default:
      return 1;
  }
}

function equipmentCostForCountry(unit: UnitType, country: CountryType) {
    let cost = 1;
    if(unit.unitType === "TANK") {
      cost += 2;
    }
    country.equipment -= cost;
}

export {equipmentCost, equipmentCostForCountry}