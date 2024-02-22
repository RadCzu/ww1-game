import {ApplicationCommand, Client, Interaction, PermissionResolvable, PermissionsBitField} from "discord.js";
const {devs, testServer} = require("../../../config.json");
import { getLocalCommands } from '../../utils/getLocalCommands';
import { getLocalCommandObjects } from '../../utils/getLocalCommandObjects';



export async function handleCommands(client: Client, interaction: Interaction): Promise<void> {
  if (!interaction.isChatInputCommand()) return;

  const localCommands: ApplicationCommand<{}>[] = await getLocalCommands();

  try {
    const commandObject = localCommands.find(
      (cmd) => cmd.name === interaction.commandName
    );

    if (!commandObject) return;


    console.log(`/${commandObject.name} command is being called`)

    if ("devOnly" in commandObject) {
      if(interaction.member) {
        if (!devs.includes(interaction.member.user.id)) {
          interaction.reply({
            content: 'Only developers are allowed to run this command.',
            ephemeral: true,
          });
          return;
        }
      } else {
        throw new Error("Error while handling commands, interaction member is missing");
      }
    }

    if ("testOnly" in commandObject) {
      if(interaction.guild){
        if (!(interaction.guild.id === testServer)) {
          interaction.reply({
            content: 'This command cannot be ran here.',
            ephemeral: true,
          });
          return;
        }
      } else {
        throw new Error("Error while handling commands, guild is missing");
      }
    }

    if ("permissionsRequired" in commandObject) {
      const permissions: PermissionResolvable = commandObject.permissionsRequired as PermissionResolvable[]
      for (const permission of permissions) {
        if(interaction.member){
          const requiredPerms: PermissionsBitField = interaction.member?.permissions as PermissionsBitField;
          if (!requiredPerms.has(permission)) {
            interaction.reply({
              content: 'Not enough permissions.',
              ephemeral: true,
            });
            return;
          }
        } else {
          throw new Error("Error while handling commands, interaction member is missing");
        }
      }
    }

    if ("botPermissions" in commandObject) {
      const botPermissions: PermissionResolvable = commandObject.botPermissions as PermissionResolvable[];
      for (const permission of botPermissions) {
        if(interaction.guild){
          const bot = interaction.guild.members.me;
          if(bot){
            if (!bot.permissions.has(permission)) {
              interaction.reply({
                content: "I don't have enough permissions.",
                ephemeral: true,
              });
              return;
            } 
          } else {
            throw new Error("Error while handling commands, bot is missing");
          }
        } else {
          throw new Error("Error while handling commands, guild is missing");
        }
      }
    }

    if("callback" in commandObject) {
      const callbackFunction = commandObject.callback as (client: Client, interaction: Interaction) => Promise<void>;
      await callbackFunction(client, interaction);
    }

  } catch (error) {
    console.log(`error while running command: ${error}`)
  }
};
