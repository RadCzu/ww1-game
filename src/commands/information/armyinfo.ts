import { ApplicationCommandOptionType, PermissionFlagsBits, PermissionsBitField } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import CountryModel, { CountryType } from "../../models/Country";
import ArmyModel, { ArmyType } from "../../models/Army";
import RegionModel, { RegionType } from "../../models/Region";
import UnitModel, { UnitType } from "../../models/Unit";
import {getUnitTypePower} from "../../utils/getUnitPower";

const armyinfo: CommandTemplate = {
  name: "armyinfo",
  description: "Displays information about the army",
  callback: async (client, interaction) => {
    await interaction.deferReply();
    const userID = interaction.user.id;
    const nationName: string = interaction.options.get("nation-name")?.value as string;
    const armyName: string = interaction.options.get("army-name")?.value as string;

    let query;
    const requiredPerms: PermissionsBitField = interaction.member?.permissions as PermissionsBitField;
    if (requiredPerms.has(PermissionFlagsBits.Administrator)) {
      query = {
        name: nationName,
        guildId: interaction.guildId,
      };
    } else {
      query = {
        userId: userID,
        name: nationName,
        guildId: interaction.guildId,
      };
    }

    const country: CountryType = await CountryModel.findOne(query) as CountryType;

    if (!country) {
      interaction.editReply(
        `Nation does not exist, or you do not have the permissions required to view its army stats`
      );
      return;
    }

    const army: ArmyType = await ArmyModel.findOne({ name: armyName, nationId: country._id }) as ArmyType;

    if (!army) {
      interaction.editReply(`Army ${armyName} does not exist for ${nationName}`);
      return;
    }

    const region: RegionType = await RegionModel.findById(army.regionId) as RegionType;

    let responseMessage = `**Information about army ${armyName}:**\n`;
    responseMessage += `Stationed in: ${region.name}\n`;
    if(!region.attackerEntrenchment) {
      region.attackerEntrenchment = 0;
    }
      // Check if the army is the defender
    if (army.defender && region.entrenchment) {
      responseMessage += `Entrenchment (Defender): ${region.entrenchment - region.attackerEntrenchment}\n`;
    } else {
      responseMessage += `Entrenchment (Invader): ${region.attackerEntrenchment}\n`;
    }
    let totalPower = 0;

     // Get detailed information about the units in the army
     const unitDetails: string[] = [];
     for (let i = 0; i < army.units.length; i++) {
       const unitId = army.units[i];
       const unit: UnitType = await UnitModel.findById(unitId) as UnitType;
       totalPower += getUnitTypePower(unit.unitType, region.terrain);
       unitDetails.push(
         `**${i + 1}. ${unit.name} ${unit.unitType}**\tMorale: ${unit.morale}\n\tCombat Experience: ${unit.combatExperience}`
       );
     }
    responseMessage += `Total Army power: ${totalPower * country.tech}\n`;

 
     // Join the unit details into a single string
     const unitsMessage = `Units:\n${unitDetails.join("\n")}`;
 
     // Calculate the total length of the response
     const totalLength = responseMessage.length + unitsMessage.length;
 
     // Send the response
     if (totalLength <= 2000) {
       responseMessage += unitsMessage;
       interaction.editReply(responseMessage);
     } else {
       // If the message is too long, split it into multiple messages
       const chunks = [];
       let currentChunk = "";
       for (const unitDetail of unitDetails) {
         if ((currentChunk + unitDetail).length > 1998) {
           chunks.push(currentChunk);
           currentChunk = unitDetail;
         } else {
           currentChunk += "\n";
           currentChunk += unitDetail;
         }
       }
 
       // Add the last chunk
       chunks.push(currentChunk);
 
       // Send each chunk as a separate message
       for (const chunk of chunks) {
         await interaction.followUp(chunk);
       }
     }
  },
  options: [
    {
      name: "nation-name",
      required: true,
      description: "The name of the nation",
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "army-name",
      required: true,
      description: "The name of the army",
      type: ApplicationCommandOptionType.String,
    },
  ],
};

export default armyinfo;