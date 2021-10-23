import {SlashCommandBuilder, userMention} from '@discordjs/builders'
import {Student} from '../modules/db_types/Student';
import {server_roles} from '../roles.json'
import {Client, CommandInteraction, Snowflake} from "discord.js";
import {guild_id} from "../config.json";
import {sendLogToDiscord} from "../index";
import {Log, LogType} from "../modules/data_types/Log";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('authenticate')
        .setDescription('Authenticates email address with unique code')
        .setDefaultPermission(false)
        .addIntegerOption(integer => integer
            .setName('code')
            .setDescription('Code received in verification email.')
            .setRequired(true)),
    async execute(interaction: CommandInteraction) {
        let student; //Database Student
        let code; //Unique authentication code
        let guildMember; //Discord student that initiated the interaction
        let clientInput; //The authentication code the guildMember input

        guildMember = interaction.member;
        clientInput = interaction.options.getInteger('code');
        student = await Student.findByPk(guildMember.id.toString());

        if (student) {
            code = student.code;

            if (code === 0) return interaction.reply({content: "You have already been authenticated!", ephemeral: true});
            if (code !== clientInput) return interaction.reply({content: "Sorry, this code is incorrect.", ephemeral: true});

            await activateProfile(student, guildMember);
            return interaction.reply({content: "You have successfully been authenticated!", ephemeral: true});

        }
        return interaction.reply({content: "You need to submit an email for verification first. (/verify)", ephemeral: true});

    },
    async setPermissions(client: Client, commandId: Snowflake) {
        let guild = await client.guilds.fetch(guild_id);
        let commandPermissionsManager = guild.commands.permissions;

        await commandPermissionsManager.add({
            command: commandId, permissions: [
                {
                    id: guild.id,
                    type: 'ROLE',
                    permission: true
                },
            ]
        })
    }
}

/**
 * Activates a User profile in the database and adds the verified role
 * @param profile
 * @param guildMember
 */
async function activateProfile(profile, guildMember) {
    let purdueRole = await guildMember.guild.roles.fetch(server_roles["purdue"]["id"]);

    await Student.update({status: true, code: 0}, {where: {id: guildMember.id}});
    await sendLogToDiscord(new Log(LogType.DATABASE_UPDATE, `Profile Activated:\nMember: ${userMention(guildMember.id)}\nId: ${guildMember.id}`));
    guildMember.roles.add(purdueRole);
}