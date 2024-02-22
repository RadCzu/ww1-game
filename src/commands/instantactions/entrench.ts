import { ApplicationCommandOptionType, PermissionFlagsBits, PermissionsBitField } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import CountryModel from "../../models/Country";
import RegionModel, { RegionType } from "../../models/Region";
import ArmyModel from "../../models/Army";

const entrench: CommandTemplate = {
  name: "entrench",
  description: "Increases entrenchment in an owned region by 1",
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

    const maxEntrenchment: number = checkMaxEntrenchment(region.terrain);
    if(!region.attackerEntrenchment) {
      region.attackerEntrenchment = 0;
    }
    if(!region.entrenchment) {
      region.entrenchment = region.attackerEntrenchment + 1;
    }

    if(region.entrenchment + 1 > maxEntrenchment) {
      interaction.editReply(`Reached maximum entrenchment in the region`);
      return
    }

    if(army.defender) {
      region.entrenchment += 1;
    } else {
      region.entrenchment += 1;
      region.attackerEntrenchment += 1;
    }

    if(country.actions > 0) {
      country.actions -= 1;
      country?.save();
    } else {
      interaction.editReply(`You dont have any actions left`);
      return
    }

    region.save();
    interaction.editReply(`Entrenchment in ${region.name} is now ${region.entrenchment - region.attackerEntrenchment}`);
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



//hardcoded max entrenchment in regions
function checkMaxEntrenchment(regionType: string): number {
  switch (regionType) {
    case "WASTELAND":
      return 12;
    case "PLAINS":
      return 15;
    case "WOODS":
      return 12;
    case "MOUNTAINS":
      return 7;
    case "COAST":
      return 8;
    default:
      return 10;
  }
}

export default entrench;
