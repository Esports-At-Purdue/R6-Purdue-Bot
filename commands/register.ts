import {SlashCommandBuilder} from "@discordjs/builders";
import {Client, CommandInteraction, GuildMember, Snowflake} from "discord.js";
import {User} from "../modules/db_types/User";
import {server_roles} from "../roles.json";
import {guild_id} from "../config.json";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Register a profile for 10-Mans')
        .setDefaultPermission(false)
        .addStringOption(string => string
            .setName('username')
            .setDescription('Your Uplay Username')
            .setRequired(true)),
    async execute(interaction: CommandInteraction) {
        let user;
        let username;
        let guildMember;
        let isValidUsername;

        guildMember = interaction.member;
        user = await User.findByPk(guildMember.id.toString());
        username = interaction.options.getString('username');
        isValidUsername = await checkIfUsernameIsValid(username);

        if (user) return interaction.reply({content: "You have already been registered!", ephemeral: true});
        if (isValidUsername) return await finishRegistration(interaction, guildMember, username);
        await interaction.reply({content: `The username you provided, \`${username}\`, is invalid.`, ephemeral: true});
    },
    async setPermissions(client: Client, commandId: Snowflake) {
        let guild = await client.guilds.fetch(guild_id);
        let commandPermissionsManager = guild.commands.permissions;

        await commandPermissionsManager.add({
            command: commandId, permissions: [
                {
                    id: guild_id,
                    type: 'ROLE',
                    permission: true
                },
            ]
        })
    }
}

async function checkIfUsernameIsValid(username: String) {
    let usernameFilter = new RegExp(/^[a-zA-Z0-9]([._-](?![._-])|[a-zA-Z0-9]){3,18}[a-zA-Z0-9]$/);
    let filteredUsername = username.toLowerCase().match(usernameFilter);
    return !!filteredUsername;
}

async function finishRegistration(interaction: CommandInteraction, guildMember: GuildMember, username: String) {
    User.create({id: guildMember.id, username: username})
    await guildMember.roles.add(server_roles["verified"]["id"]);
    await interaction.reply({content: `You have been registered as \`${username}\``});
}
