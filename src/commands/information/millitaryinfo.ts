import { ApplicationCommandOptionType, PermissionFlagsBits, PermissionsBitField } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import CountryModel, { CountryType } from "../../models/Country";
import ArmyModel, { ArmyType } from "../../models/Army";
import RegionModel, { RegionType } from "../../models/Region";
import UnitModel, { UnitType } from "../../models/Unit";
import {getUnitTypePower} from "../../utils/getUnitPower";
import CommanderModel from "../../models/Commander";

const millitaryinfo: CommandTemplate = {
  name: "millitaryinfo",
  description: "Displays more detailed information about the millitary of a nation",
  callback: async (client, interaction) => {
    await interaction.deferReply();
    const userID = interaction.user.id;
    const nationName: string = interaction.options.get("nation-name")?.value as string;

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

    const armies = await ArmyModel.find({nationId: country._id});
  

    if (!armies) {
      interaction.editReply(`Ypur country has no armies`);
      return;
    }

    let responseMessage = `**Information about ${country.name} millitary:**`;
    responseMessage += `\ntech: ${country.tech}`
    responseMessage += `\nequipment: ${country.equipment}`

    for(const army of armies) {
      const region = await RegionModel.findById(army.regionId);
      const commander = await CommanderModel.findById(army.commanderId);
      const units = await UnitModel.find({_id: {$in:army.units}});
      if(region === undefined || region === null) {
        break;
      }
      if(commander === undefined || commander === null) {
        break;
      }
      if(units === undefined || units === null) {
        break;
      }
      
      const infantry = units.filter((unit) => {return unit.unitType === "INFANTRY"})
      const cavalry = units.filter((unit) => {return unit.unitType === "CAVALRY"})
      const artillery = units.filter((unit) => {return unit.unitType === "ARTILLERY"})
      const tanks = units.filter((unit) => {return unit.unitType === "TANKS"})

      responseMessage += `\n**${army.name}:**`
      responseMessage += `\n- commanded by: ${commander.name}`
      responseMessage += `\n- stationed in: ${region.name}`
      responseMessage += `\n- ${army.units.length} units`
      
      if(infantry.length > 0)
      responseMessage += `\n\t${infantry.length} infantry`
      if(cavalry.length > 0)
      responseMessage += `\n\t${cavalry.length} cavalry`
      if(artillery.length > 0)
      responseMessage += `\n\t${artillery.length} artillery`
      if(tanks.length > 0)
      responseMessage += `\n\t${tanks.length} tanks\n`
    }

    interaction.editReply(
      responseMessage
    );
  },
  options: [
    {
      name: "nation-name",
      required: true,
      description: "The name of the nation",
      type: ApplicationCommandOptionType.String,
    },
  ],
};

export default millitaryinfo;