import { ApplicationCommandOptionType, BooleanCache, PermissionFlagsBits, PermissionsBitField, ShardEvents } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import CountryModel from "../../models/Country";
import RegionModel, { RegionType } from "../../models/Region";
import ArmyModel from "../../models/Army";
import UnitModel from "../../models/Unit";
import { casulties } from "../../utils/manpower";

const shell: CommandTemplate = {
  name: "shell",
  description: "deals damadge to the enemy in your region",
  callback: async (client, interaction) => {
    await interaction.deferReply();

    // Get details from command options
    const nationName: string = interaction.options.get("nation-name")?.value as string;
    const armyName: string = interaction.options.get("army-name")?.value as string;

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

    const army = await ArmyModel.findOne({name: armyName, nationId: country._id.toString()});

    if(!army) {
      interaction.editReply(`No army of this name exists under ${nationName}, check for potential typos`);
      return;
    }


    //fetch the region and check if it can be entrenched further
    const region = await RegionModel.findById(army.regionId);

    if(!region) {
      interaction.editReply(`Region does not exist`);
      return;
    }

    if(region.entrenchment === undefined || region.attackerEntrenchment === undefined) {
      interaction.editReply(`Region entrenchment missing`);
      return;
    }

    const units = await UnitModel.find({id: {$in: army.units}});
    let artillery = 0;
    console.log("units:");
    console.log(units);
    for(const unit of units) {
      if(unit.unitType === "ARTILLERY") {
        artillery +=1;
      }
    }

    if(artillery === 0) {
      interaction.editReply(`Requires artillery units in army`);
      return;
    }

    if(country.equipment < artillery) {
      interaction.editReply(`Not enough equipment`);
      return;
    }
    
    if(region.attackingArmies === undefined || (army.defender && region.attackingArmies.length === 0)) {
      interaction.editReply(`attacking armies missing`);
      return;
    }

    //this should never happen
    if(region.defendingArmies === undefined || (!army.defender && region.defendingArmies.length === 0)) {
      interaction.editReply(`defending armies missing`);
      return;
    }
    
    if(country.actions > 0) {
      country.actions -= 1;
      country.equipment -= artillery;
      country?.save();
    } else {
      interaction.editReply(`You dont have any actions left`);
      return
    }

    for(const unit of units) {
      if(unit.unitType === "ARTILLERY") {
        unit.combatExperience += 1;
        if(army.defender) {
          if(rollDestruction() && region.attackerEntrenchment > 1) {
            console.log(`attackers trenches destroyed in ${region.name}`);
            region.attackerEntrenchment -= 1;
            region.entrenchment -= 1;
            await region.save();
          }
        } else {
          if(rollDestruction() && region.entrenchment - region.attackerEntrenchment > 1) {
            console.log(`defenders trenches destroyed in ${region.name}`);
            region.entrenchment -= 1;
            await region.save();
          }
        }
        await unit.save();
      }
    }
    
    if(army.defender) {
      const attackingArmies = await ArmyModel.find({regionId: region._id, defender: false});
      for(const army of attackingArmies) {
        await casulties(army, artillery);
        await army.save();
      }
    } else {

      const defendingArmies = await ArmyModel.find({regionId: region._id, defender: true});
      for(const army of defendingArmies) {
        await casulties(army, artillery);
        await army.save();
      }
    }



    region.save();
    interaction.editReply(`Defender entrenchment in ${region.name} is now ${region.entrenchment - region.attackerEntrenchment}. Attackers are holding: ${region.attackerEntrenchment}`);
  },
  options: [
    {
      name: "nation-name",
      description: "The name of the nation",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "army-name",
      description: "The name of the army",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
  ],
};

function rollDestruction(): boolean {
  const rand = Math.random() * 100;
  console.log(rand);
  if(rand >= 0) {
    return true;
  } else {
    return false;
  }
}

export default shell;
