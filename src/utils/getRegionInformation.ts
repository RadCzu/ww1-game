import RegionModel, { RegionType } from '../models/Region';
import ArmyModel, { ArmyType } from '../models/Army';
import CountryModel, { CountryType } from '../models/Country';

async function getRegionDescription(region: RegionType, detailed: boolean): Promise<string> {
  let description = `\n**${region.name}:**\n`;

  if (detailed) {
    if(region.nationId) {
      const nation = await CountryModel.findById(region.nationId) as CountryType;
      
      description += `- Under control of: ${nation?.name}\n`;
    } else {
      description += `- Independent region\n`;
    }
  }

  if(region.milfactories === undefined || region.factories === undefined) {
    console.error("missing region for describtion (factories)");
    return description;
  }
  
  description += `- Terrain: ${region.terrain}\n`;
  description += `- Population: ${region.population}\n`;
  description += `- Manpower: ${region.manpower}\n`;
  description += `- Factories: ${region.factories}\n`;
  if(detailed) {
    description += `\t civilian: ${region.factories - region.milfactories}\n`;
    description += `\t military: ${region.milfactories}\n`;
    description += `- Resistance to occupiers: ${region.resistance}%\n`;
  }
  description += `- Tax income: ${region.taxes}\n`;

  // Fetch and display defending armies
  if (region.defendingArmies && region.defendingArmies.length > 0) {
    description += `- Defending Armies:\n`;

    for (const armyId of region.defendingArmies) {
      const army = await ArmyModel.findById(armyId) as ArmyType | null;
      if (army && army.name) {
        description += `  - ${army.name}\n`;
      }
    }
  }

  if (detailed) {
    if (region.entrenchment !== undefined && region.attackerEntrenchment !== undefined) {
      description += `- Entrenchment: ${region.entrenchment - region.attackerEntrenchment}\n`;

      // Fetch and display attacking armies
      if (region.attackingArmies && region.attackingArmies.length > 0) {
        description += `- Attacker Armies:\n`;

        for (const armyId of region.attackingArmies) {
          const army = await ArmyModel.findById(armyId) as ArmyType | null;
          if (army && army.name) {
            description += `  - ${army.name}\n`;
          }
        }
        description += `- AttackerEntrenchment: ${region.attackerEntrenchment}\n`;
      }
    }


    // Fetch and display names of neighboring regions
    if (region.neighbours && region.neighbours.length > 0) {
      description += `- Neighbours:\n`;

      for (const neighbourId of region.neighbours) {
        const neighbour = await RegionModel.findById(neighbourId) as RegionType | null;
        if (neighbour && neighbour.name) {
          description += `  - ${neighbour.name}\n`;
        }
      }
    }
  }

  return description;
}

export default getRegionDescription;