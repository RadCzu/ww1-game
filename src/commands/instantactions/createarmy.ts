import { ApplicationCommandOptionType, PermissionFlagsBits, PermissionsBitField } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import CommanderModel, { CommanderType } from "../../models/Commander";
import CountryModel from "../../models/Country";
import RegionModel, { RegionType } from "../../models/Region";
import ArmyModel, { ArmyType } from "../../models/Army";
import UnitModel, { UnitType } from "../../models/Unit";
import createUnits from "../../utils/mobiliseUnits";

const createArmy: CommandTemplate = {
  name: "createarmy",
  description: "Creates a new army with a single 'INFANTRY' unit",
  callback: async (client, interaction) => {
    await interaction.deferReply();

    // Get details from command options
    const nationName: string = interaction.options.get("nation-name")?.value as string;
    const commanderName: string = interaction.options.get("commander-name")?.value as string;
    const regionName: string = interaction.options.get("region-name")?.value as string;
    const armyName: string = interaction.options.get("army-name")?.value as string;
    const unitName: string = interaction.options.get("innitial-unit-name")?.value as string;
    const unitType: string = interaction.options.get("unit-type")?.value as string;


    // Fetch country from the database
    let country = await CountryModel.findOne({ name: nationName, userId: interaction.user.id, guildId: interaction.guildId });

    if (!country) {
      const requiredPerms: PermissionsBitField = interaction.member?.permissions as PermissionsBitField;
      if (requiredPerms.has(PermissionFlagsBits.Administrator)) {
      country = await CountryModel.findOne({ name: nationName, guildId: interaction.guildId });
      }
      
      if (!country) {
        interaction.editReply(`No country ${nationName} exists.`);
        return;
      }
    }

    if(country.actions > 0) {
      country.actions -= 1;
      country?.save();
    } else {
      interaction.editReply(`You dont have any actions left`);
      return
    }

    // Fetch region from the database
    const region = await RegionModel.findOne({ name: regionName, guildId: interaction.guildId });

    if (!region || !country.regions.includes(region._id.toString())) {
      interaction.editReply(`Region ${regionName} does not belong to ${nationName}.`);
      return;
    }

    // Fetch or create the commander
    const commander = await CommanderModel.findOne({ name: commanderName, nationId: country._id });

    if (!commander) {
      interaction.editReply(`Commander ${commanderName} not found in ${nationName}.`);
      return;
    }

    const anyArmy = await ArmyModel.findOne({ commanderId: commander?._id, nationId: country._id });

    if(anyArmy) {
      interaction.editReply(`Commander ${commanderName} already in command of ${anyArmy.name}.`);
      return;
    }

    // Check if an army with the specified armyId already exists
    const existingArmy = await ArmyModel.findOne({ ownerId:nationName, name:armyName });

    if(existingArmy) {
      interaction.editReply(`Army ${armyName} already exists for the country of ${nationName}`);
      return;
    }

    // Create the new army
    const newArmy: ArmyType = {
      nationId: country._id.toString(),
      regionId: region._id.toString(),
      commanderId: commander._id,
      defender: true,
      name: armyName,
      units: [],
    };

    const army = new ArmyModel(newArmy);
    const units: UnitType[] = await createUnits(newArmy, army._id.toString(), 1, unitType);

    if(units.length > 0) {

      const editedUnit = await UnitModel.findOne({armyId: army._id});
     
      if(!editedUnit) {
        interaction.editReply(`Something went wrong`);
        return;
      }
      editedUnit.name = unitName;
      army.units = [editedUnit?._id.toString()];

      // Save the new army to the database
      region.defendingArmies?.push(army._id.toString());
      await region.save();
      await army.save();
      await editedUnit.save();
      interaction.editReply(`Army ${armyName} with unit ${unitName} created successfully!`);
      
    } else {
      interaction.editReply(`Army ${armyName} could not be created, not enough manpower`);
    }
  },
  options: [
    {
      name: "nation-name",
      description: "The name of the nation",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "commander-name",
      description: "The name of the commander",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "region-name",
      description: "The name of the region",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "army-name",
      description: "The name of the new army",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "innitial-unit-name",
      description: "The name of the initial unit",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "unit-type",
      description: "The type of the initial unit",
      required: true,
      type: ApplicationCommandOptionType.String,
      choices: [
        {
          name: "Infantry officer corp",
          value: "INFANTRY",
        },
        {
          name: "Cavalry officer corp",
          value: "CAVALRY",
        },
      ],
    },
  ],
};

export default createArmy;
