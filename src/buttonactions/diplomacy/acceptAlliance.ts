import { inherits } from "util";
import ButtonAction from "../../models/ButtonAction";
import { deleteInteractionData, getInteractionData } from "../../models/InteractionData";
import AllianceModel, { AllianceType } from "../../models/Alliance";
import CountryModel from "../../models/Country";
import { areAtWar, areAllied, allianceExists } from "../../utils/diplomacy";
import { CategoryChannelResolvable, ChannelType, GuildChannelResolvable, GuildMember, OverwriteResolvable, PermissionFlagsBits, PermissionsBitField, Role } from "discord.js";
import TurnCounterModel from "../../models/Turn";


const acceptAlliance: ButtonAction = {
  name: "acceptAlliance",
  async execute(client, interaction, customId): Promise<void> {
    if(interaction.isRepliable()){
      const cleanedId: string = customId.replace(/^acceptAlliance/, '');
      
      const { countryId, otherCountryId, guildId, turn, allianceName } = getInteractionData(cleanedId);

      if(countryId === null || countryId === undefined)  {
        interaction.reply(
          `Interaction already has been used`
        );
        return;
      }

      console.log(`countryID: ${countryId} otherCountryId: ${otherCountryId} guildId: ${guildId} allianceName: ${allianceName}`)

      const country = await CountryModel.findById(countryId);

      const otherCountry = await CountryModel.findById(otherCountryId);

      const turnCounter = await TurnCounterModel.findOne({guildId: interaction.guildId});

      if(!turnCounter) {
        interaction.reply(
          `No turn counter`
        );
        return;
      }

      if(turnCounter.turn != turn) {
        deleteInteractionData(cleanedId);
        interaction.reply(
          `Alliance deadline expired, it is now turn ${turnCounter.turn}`
        );
        return;
      }
  
      if (!country) {
        interaction.reply(
          `The other nation does not exist anymore`
        );
        return;
      }
  
      if (!otherCountry) {
        interaction.reply(
          `Your nation does not exist`
        );
        return;
      }

      const requiredPerms = interaction.member?.permissions as PermissionsBitField;
      if((interaction.user.id != otherCountry.userId) && (!requiredPerms.has(PermissionFlagsBits.Administrator))) {
        interaction.reply("hey, its not your country")
        return;
      }
  
      if(await areAtWar(country, otherCountry)) {
        interaction.reply(
          `Sorry, but you are at war with them`
        );
        return;
      }
  
      if(await areAllied(country, otherCountry, guildId)) {
        interaction.reply(
          `You are already allied`
        );
        return;
      }

      if(await allianceExists(guildId, allianceName)) {
        interaction.reply(
          `Someone already formed an alliance of this name`
        );
        return;
      }
      let category: CategoryChannelResolvable | null | undefined;

      try {
        category = await interaction.guild?.channels.fetch(turnCounter.allianceCategoryId) as CategoryChannelResolvable | null | undefined;
        if(category === null || category === undefined) {
            category = await interaction.guild?.channels.create(
            { 
              name: `alliances`, 
              type: ChannelType.GuildCategory, 
            }
          );
          if(category) {
            turnCounter.allianceCategoryId = category.id;
            turnCounter.save();
          }
        }
      } catch (createError) {
        console.log(category);
        if(category === null || category === undefined) {
            category = await interaction.guild?.channels.create(
            { 
              name: `alliances`, 
              type: ChannelType.GuildCategory, 
            }
          );
          if(category) {
            turnCounter.allianceCategoryId = category.id;
            turnCounter.save();
          }
        }
      }

      const allianceRole = await interaction.guild?.roles.create({
        name: allianceName,
      }) as Role;

      const spyRoleFounder = interaction.guild?.roles.cache.find(role => role.name === `${country.name} spy`);
      const spyRoleMember = interaction.guild?.roles.cache.find(role => role.name === `${otherCountry.name} spy`);
      let spyObj1 = {}
      if(spyRoleFounder) {
        spyObj1 = {
          id: spyRoleFounder.id,
          allow: [
            PermissionFlagsBits.ViewChannel, 
          ],
          deny: [
            PermissionFlagsBits.SendMessages, 
          ],
        }
      }

      let spyObj2 = {}
      if(spyRoleMember) {
        spyObj2 = {
          id: spyRoleMember.id,
          allow: [
            PermissionFlagsBits.ViewChannel, 
          ],
          deny: [
            PermissionFlagsBits.SendMessages, 
          ],
        }
      }

      const inputChannel = await interaction.guild?.channels.create(
        { 
          name: `${allianceName}`, 
          type: ChannelType.GuildText,
          parent: category,
          permissionOverwrites: [
            {
              id: allianceRole,
              allow: [
                PermissionFlagsBits.ViewChannel, 
                PermissionFlagsBits.SendMessages, 
              ],
            },
            spyObj1 as OverwriteResolvable,
            spyObj2 as OverwriteResolvable,
            {
              id: interaction.guild?.roles.everyone,
              deny: [
                PermissionFlagsBits.ViewChannel, 
              ],
            },
          ],
        }
      );

      if(inputChannel === undefined) {
        interaction.reply(`Error: Missing alliance channel`);
        return
      }

      const allainceTemplate: AllianceType = {
        name: allianceName,
        guildId: guildId,
        roleId: allianceRole.id,
        memberNationIds: [countryId, otherCountryId],
        channelId: inputChannel.id,
      }

      const alliance = await AllianceModel.create(allainceTemplate);

      const allianceMember1 = await interaction.guild?.members.fetch(country.userId) as GuildMember;
      const allianceMember2 = await interaction.guild?.members.fetch(otherCountry.userId) as GuildMember;

      allianceMember1.roles.add(allianceRole);
      allianceMember2.roles.add(allianceRole);

      country.save()
      otherCountry.save()

      deleteInteractionData(cleanedId);

      interaction.reply(`Alliance ${allianceName} between ${country.name} and ${otherCountry.name} has been signed \n
      you can now move troops in each other's territories`);
    }
  },
}

export default acceptAlliance