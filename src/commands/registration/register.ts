import { ApplicationCommandOptionType, PermissionFlagsBits, ChannelType, Role, GuildMember } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import Country from "../../models/Country";
import AllianceModel, { AllianceType } from "../../models/Alliance";
import TurnCounterModel from "../../models/Turn";

const register: CommandTemplate = {
  name: "register",
  description:
    "This command is used to register new countries by the game master",
  callback: async (client, interaction) => {
    await interaction.deferReply();
    if(!interaction.guildId) {
      await interaction.editReply(`guild-only command!`);
      return;
    }
    const nationName: string = interaction.options.get("nation-name")?.value as string;
    const userId: string = interaction.options.get("target-user")?.value as string;
    const guildId = interaction.guildId;
    const game = await TurnCounterModel.findOne({guildId: interaction.guildId});
    if(!game  || !game._id) {
      await interaction.editReply(`game not yet registered!`);
      return;
    }

    // Create a new country in the database
    const country = new Country({
      userId: userId,
      guildId: guildId,
      gameId: game._id.toString(),
      name: nationName,
      stability: 100,
      actions: 10,
      politicalPower: 0,
      tech: 1.0,
      equipment: 100,
      money: 0,
      regions: [],
    });

    await country.save();

    // Create roles for the country and spy
    const countryRole = await interaction.guild?.roles.create({
      name: nationName,
    }) as Role;

    const spyRole = await interaction.guild?.roles.create({
      name: `${nationName} spy`,
    }) as Role;

    //assign the country role
    const targetUser = await interaction.guild?.members.fetch(userId) as GuildMember;

    targetUser.roles.add(countryRole);

    // Create a category for the country channels
    const category = await interaction.guild?.channels.create(
      { 
        name: `${nationName}-input`, 
        type: ChannelType.GuildCategory, 
      }
    );


    
    // Create an input channel with viewing allowed only for the roles
    const inputChannel = await interaction.guild?.channels.create(
      { 
        name: `${nationName}`, 
        type: ChannelType.GuildText,
        parent: category,
        permissionOverwrites: [
          {
            id: countryRole,
            allow: [
              PermissionFlagsBits.ViewChannel, 
              PermissionFlagsBits.SendMessages, 
            ],
          },
          {
            id: spyRole,
            allow: [
              PermissionFlagsBits.ViewChannel, 
            ],
            deny: [
              PermissionFlagsBits.SendMessages, 
            ],
          },
          {
            id: interaction.guild?.roles.everyone,
            deny: [
              PermissionFlagsBits.ViewChannel, 
            ],
          },
        ],
      }
    );

    if(!inputChannel) {
      await interaction.editReply(`Error creating a new channel`);
      return;
    }

    const alliance: AllianceType = {
      name: nationName,
      guildId: interaction.guildId,
      roleId: countryRole.id,
      channelId: inputChannel.id,
      memberNationIds: [country._id.toString()],
    }

    // Create an alliance for the role
    await AllianceModel.create(alliance);

    await interaction.editReply(`Country ${nationName} registered successfully!`);
  },
  options: [
    {
      name: "target-user",
      description: "The nation owner",
      required: true,
      type: ApplicationCommandOptionType.Mentionable,
    },
    {
      name: "nation-name",
      required: true,
      description: "The name of this new nation",
      type: ApplicationCommandOptionType.String,
    },
  ],
  permissionsRequired: [PermissionFlagsBits.Administrator],
  botPermissions: [PermissionFlagsBits.Administrator],
};

export default register;