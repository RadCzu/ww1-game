import { Client, Guild, GuildApplicationCommandManager } from "discord.js";

export async function getApplicationCommands(client: Client, guildId: string): Promise<GuildApplicationCommandManager>{
  let applicationCommands: GuildApplicationCommandManager | null = null;

  if (guildId) {
    const guild: Guild = await client.guilds.fetch(guildId);
    applicationCommands = guild.commands;
  } else if (client.application) {
    applicationCommands = client.application.commands as any as GuildApplicationCommandManager;
  } else {
    throw new Error("Unable to fetch application commands. Guild ID and client application are missing.");
  }

  if (applicationCommands) {
    await applicationCommands.fetch();
    return applicationCommands;
  } else {
    throw new Error("Application commands not found.");
  }
}