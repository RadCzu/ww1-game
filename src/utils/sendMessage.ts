import { Client, Guild, TextBasedChannel } from "discord.js";
import { TurnCounterType } from "../models/Turn";


export async function sendMessageOnPublicChannel(bot: Client, turn: TurnCounterType, message: string) {
  try {
    if (turn?.announcementChannelId) {
      const guild = await bot.guilds.fetch(turn.guildId);
      const announcementChannel = guild.channels.cache.get(turn.announcementChannelId);
      if (announcementChannel?.isTextBased()) {
        const textBasedChannel = announcementChannel as TextBasedChannel;
        await textBasedChannel.send(`${message}`);
      }
    }
  } catch (error) {
    console.log(`error writing a message on a public channel ${error}`)
  }
}