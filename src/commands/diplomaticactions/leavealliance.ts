import { CommandTemplate } from "../../models/Command";
import AllianceModel from "../../models/Alliance";
import CountryModel from "../../models/Country";
import { ApplicationCommandOptionType, PermissionFlagsBits, PermissionsBitField } from "discord.js";

const leavealliance: CommandTemplate = {
  name: "leavealliance",
  description: "Leave an alliance for 10 political power",
  callback: async (client, interaction) => {
    await interaction.deferReply();

    const userID = interaction.user.id;
    const nationName: string = interaction.options.get("nation-name")?.value as string;
    const allianceName: string = interaction.options.get("alliance-name")?.value as string;

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

    const country = await CountryModel.findOne(query);

    if (!country) {
      interaction.editReply(`You don't own a nation named ${nationName}`);
      return;
    }

    if (country.politicalPower < 10) {
      interaction.editReply(`You don't have enough PP for this action`);
      return;
    }

    const alliance = await AllianceModel.findOne({ name: allianceName, guildId: interaction.guildId });

    if (!alliance) {
      interaction.editReply(`Alliance ${allianceName} does not exist`);
      return;
    }

    if (allianceName === nationName) {
      interaction.editReply("Alliance name cannot be the same as the nation name");
      return;
    }

    if (country.politicalPower < 10) {
      interaction.editReply(`10 political power is required for this action`);
      return;
    }

    if (!alliance.memberNationIds.includes(country._id)) {
      interaction.editReply(`Your nation is not part of alliance ${allianceName}`);
      return;
    }
    console.log("before");
    console.log( alliance.memberNationIds);
    alliance.memberNationIds = alliance.memberNationIds.filter(memberId => memberId != country._id);
    console.log("after");
    console.log( alliance.memberNationIds);

    const member = await interaction.guild?.members.fetch(userID);
    if (member) {
      const allianceRole = interaction.guild?.roles.cache.find(role => role.name === allianceName);
      if (allianceRole) {
        await member.roles.remove(allianceRole);
      } else {
        console.log("Alliance role not found");
      }
    } else {
      console.log("Member not found");
    }

    if (alliance.memberNationIds.length > 0) {
      alliance.save();
    } else {
      const allianceRole = interaction.guild?.roles.cache.find(role => role.name === allianceName);
      if (allianceRole) {
        await allianceRole.delete();
      }

      await AllianceModel.findByIdAndDelete(alliance.id);
    }

    country.politicalPower -= 10;
    await country.save();
    interaction.editReply(`You have successfully left alliance ${allianceName}`);
  },
  options: [
    {
      name: "nation-name",
      required: true,
      description: "Your nation name",
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "alliance-name",
      required: true,
      description: "Name of the alliance you want to leave",
      type: ApplicationCommandOptionType.String,
    },
  ]
};

export default leavealliance;