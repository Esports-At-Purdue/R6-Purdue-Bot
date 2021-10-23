import {SlashCommandBuilder} from "@discordjs/builders";
import {Client, CommandInteraction, GuildMember, Snowflake} from "discord.js";
import {guild_id} from "../config.json";
import {server_roles} from "../roles.json";
import {User} from "../modules/db_types/User";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('username')
        .setDescription('Update your registered username')
        .setDefaultPermission(false)
        .addStringOption(option => option
            .setName('username')
            .setDescription('The new username')
            .setRequired(true))
        .addUserOption(option => option
            .setName('target')
            .setDescription('The user you want to change')
            .setRequired(false)),

    async execute(interaction: CommandInteraction) {
        let isValidUsername;
        let isModOrAdmin;
        let guildMember;
        let username;
        let target;
        let user;

        guildMember = interaction.member;
        isModOrAdmin = checkIfIsModOrAdmin(guildMember);
        username = interaction.options.getString('username');
        target = interaction.options.getUser('target');
        isValidUsername = checkIfUsernameIsValid(username);

        if (isValidUsername) {
            if (target) {
                user = await User.findByPk(target.id) as User;
                if (user) {
                    if (isModOrAdmin) {
                        user.setUsername(username);
                        await user.save();
                        await interaction.reply({content: `${target} had their username updated to \`${username}\`.`});
                    } else {
                        await interaction.reply({content: "You do not have permission to update other's usernames.", ephemeral: true});
                    }
                } else {
                    await interaction.reply({content: "This user is not registered.", ephemeral: true});
                }
            } else {
                user = await User.findByPk(guildMember.id) as User;
                if (user) {
                    user.setUsername(username);
                    await user.save();
                    await interaction.reply({content: `You successfully updated your username to \`${username}\``});
                } else {
                    await interaction.reply({content: `You must be registered to use this command`, ephemeral: true});
                }
            }
        } else {
            await interaction.reply({content: `The username, \`${username}\`, is invalid.`, ephemeral: true});
        }
    },

    async setPermissions(client: Client, commandId: Snowflake) {
        let guild = await client.guilds.fetch(guild_id);
        let verifiedId = server_roles["verified"]["id"]
        let commandPermissionsManager = guild.commands.permissions;

        await commandPermissionsManager.add({
            command: commandId, permissions: [
                {
                    id: verifiedId,
                    type: 'ROLE',
                    permission: true
                },
            ]
        })
    }
}

function checkIfIsModOrAdmin(guildMember: GuildMember) {
    let roles = guildMember.roles.cache;
    for (const [string, role] of roles) {
        if (role.id === server_roles["moderator"]["id"]|| role.id === server_roles["administrator"]["id"]) return true;
    }
    return false;
}

function checkIfUsernameIsValid(username: String) {
    let usernameFilter = new RegExp(/^[a-zA-Z0-9]([._-](?![._-])|[a-zA-Z0-9]){3,18}[a-zA-Z0-9]$/);
    let filteredUsername = username.toLowerCase().match(usernameFilter);
    return !!filteredUsername;
}