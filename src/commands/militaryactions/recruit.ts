import { ApplicationCommandOptionType, GuildBasedChannel, PermissionFlagsBits, PermissionsBitField, TextBasedChannel } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import CountryModel, { CountryType } from "../../models/Country";
import TurnLogModel, { TurnLogType } from "../../models/TurnLog";
import TurnCounterModel from "../../models/Turn";
import ArmyModel, { ArmyType } from "../../models/Army";
import { calculateTotalManpower, killManpower } from "../../utils/manpower";
import { mobilise as mobil } from "../../utils/actions/mobilise";

const recruit: CommandTemplate = {
  name: "recruit",
  description: "recruit up to 3 units for an army",
  callback: async (client, interaction) => {
    await interaction.deferReply();

    const armyName = interaction.options.get("army-name")?.value;
    const countryName = interaction.options.get("nation-name")?.value;

    if(!armyName || !countryName || !interaction.guildId) {
      interaction.editReply(
        `input error`
      );
      return;
    }

    const turn = await TurnCounterModel.findOne({guildId: interaction.guildId});

    if(!turn) {
      interaction.editReply(
        `No turn counter`
      );
      return;
    }

    //country check  
    let query;
    const requiredPerms: PermissionsBitField = interaction.member?.permissions as PermissionsBitField;
    if (requiredPerms.has(PermissionFlagsBits.Administrator)) {
      query = {
        name: countryName,
        guildId: interaction.guildId,
      };
    } else {
      query = {
        userId: interaction.user.id,
        name: countryName,
        guildId: interaction.guildId,
      };
    }
    const country = await CountryModel.findOne(query);

    if(!country) {
      interaction.editReply(
        `This country does not exist or it does not belong to you`
      );
      return;
    }

    const army: ArmyType = await ArmyModel.findOne({
      nationId: country._id,
      name: armyName,
    }) as ArmyType;

    if(!army || !army._id) {
      interaction.editReply(
        `${armyName} does not exist, check for potential typos and case differences`
      );
      return;
    }

    const infantryAmount: number = interaction.options.get("infantry")?.value as number || 0;
    const cavalryAmount: number = interaction.options.get("cavalry")?.value as number || 0;
    const artilleryAmount: number = interaction.options.get("artillery")?.value as number || 0;
    const tankAmount: number = interaction.options.get("tanks")?.value as number || 0;

    if(tankAmount > 0 && country.tech < 3.0) {
      interaction.editReply(
        `Sorry, your tech is insufficient to produce tanks`
      );
      return;
    }

    let totalUnitCount = 0;
    let totalEquipment = 0;
    let totalCost = 0;

    if(infantryAmount) {
      totalUnitCount += infantryAmount;
      totalEquipment += infantryAmount * 3;
      totalCost += infantryAmount * 10000;
    }
    if(cavalryAmount) {
      totalUnitCount += cavalryAmount;
      totalEquipment += cavalryAmount * 3;
      totalCost += cavalryAmount * 12500;
    }
    if(artilleryAmount) {
      totalUnitCount += artilleryAmount;
      totalEquipment += artilleryAmount * 5;
      totalCost += artilleryAmount * 15000;
    }
    if(tankAmount) {
      totalUnitCount += tankAmount;
      totalEquipment += tankAmount * 10;
      totalCost += tankAmount * 17500;
    }

    if(totalUnitCount <= 0) {
      interaction.editReply(
        `Cannot mobilise 0 or less units`
      );
      return;
    }

    if(totalUnitCount > 3) {
      interaction.editReply(
        `Cannot recruit more than 3 units, try /mobilise instead`
      );
      return;
    }

    const countryManpower = await calculateTotalManpower(country._id);

    if(totalUnitCount * 10000 > countryManpower) {
      interaction.editReply(
        `Not enough manpower`
      );
      return;
    }

    if(totalEquipment > country.equipment) {
      interaction.editReply(
        `Not enough equipment`
      );
      return;
    }

    if(totalCost > country.money) {
      interaction.editReply(
        `Not enough money`
      );
      return;
    }
    
    //action check  
    if(country.actions > 0) {
      country.actions -= 1;
      country.save();
    } else {
      interaction.editReply(
        `Not enough actions`
      );
      return;
    }

    country.money -= totalCost;
    await killManpower(country._id, totalUnitCount * 10000);
    country.equipment -= totalEquipment;
    await country.save();
    const args: string[] = [army._id?.toString(), infantryAmount.toString(), cavalryAmount.toString(), artilleryAmount.toString(), tankAmount.toString()];
    await mobil(args);

    interaction.editReply(
      `Order 'recruit ${totalUnitCount} units to ${armyName}' was accepted, you now have ${country.actions} actions left`
    );

  },
  options: [
    {
      name: "nation-name",
      description: "Your nation",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "army-name",
      description: "the specific army",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "infantry",
      description: "amount of infantry units",
      required: false,
      type: ApplicationCommandOptionType.Number,
    },
    {
      name: "cavalry",
      description: "amount of cavalry units",
      required: false,
      type: ApplicationCommandOptionType.Number,
    },
    {
      name: "artillery",
      description: "amount of artillery units",
      required: false,
      type: ApplicationCommandOptionType.Number,
    },
    {
      name: "tanks",
      description: "amount of tank units",
      required: false,
      type: ApplicationCommandOptionType.Number,
    },
  ]
};

export default recruit;
