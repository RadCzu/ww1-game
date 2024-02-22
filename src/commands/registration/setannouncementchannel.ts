import { ApplicationCommandOptionType, ChannelType, GuildBasedChannel, GuildMember, PermissionFlagsBits, PermissionsBitField } from "discord.js";
import { CommandTemplate } from "../../models/Command";
import TurnCounterModel, { TurnCounterType } from "../../models/Turn";

const setannouncementchannel: CommandTemplate = {
  name: "setannouncementchannel",
  description:
    "This command is used to mark a channel as used for bot's public announcements on this server",
  callback: async (client, interaction) => {
    await interaction.deferReply();

    const channel: GuildBasedChannel = interaction.options.get("target-channel")?.channel as GuildBasedChannel;
    const channelId: string = channel?.id || "";

    if (!channel) {
      await interaction.editReply("Invalid channel specified.");
      return;
    }

    if (interaction.guild && client.user?.id) {
      if (!(channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildNews) || !channel.permissionsFor(client.user?.id)?.has(PermissionFlagsBits.SendMessages)) {
        await interaction.editReply("I don't have the required permissions to send messages in that channel.");
        return;
      }
    }

    // Update or create TurnCounter document for the guild
    let turnCounter = await TurnCounterModel.findOne({ guildId: interaction.guildId });
    if (!turnCounter) {
      turnCounter = new TurnCounterModel({ guildId: interaction.guildId, turn: 0});
    }

    turnCounter.announcementChannelId = channelId;
    await turnCounter.save();

    await interaction.editReply(`Announcement channel set to <#${channelId}>.`);
  },
  options: [
    {
      name: "target-channel",
      description: "The channel to set as the announcement channel",
      required: true,
      type: ApplicationCommandOptionType.Channel,
    },
  ],
  permissionsRequired: [PermissionFlagsBits.Administrator],
  botPermissions: [PermissionFlagsBits.Administrator],
};

export default setannouncementchannel;