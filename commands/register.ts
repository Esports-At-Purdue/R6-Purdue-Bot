import {SlashCommandBuilder} from "@discordjs/builders";
import * as blacklist from "../blacklist.json";
import * as config from "../config.json";
import Player from "../objects/Player";
import {ButtonInteraction, CommandInteraction, GuildMemberRoleManager} from "discord.js";

const censoredWords = blacklist.list.split(" ");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("register")
        .setDescription("Registers a new player for the PUPL")
        .setDefaultPermission(false)
        .addStringOption((option) => option
            .setName("username")
            .setDescription("Your preferred username")
            .setRequired(false)
        ),

    permissions: [
        {
            id: config.guild,
            type: 'ROLE',
            permission: true
        },
    ],

    async execute(interaction: CommandInteraction | ButtonInteraction) {
        let response;
        let player = await Player.get(interaction.user.id);
        let username = interaction instanceof CommandInteraction
            ? (interaction.options.getString('username') != null)
                ?  interaction.options.getString('username') : interaction.user.username
            : interaction.user.username;
        if (player) {
            response = "You are already registered."
            await (interaction.member.roles as GuildMemberRoleManager).add(config.roles.registered);
        } else {
            if (isValidUsername(username)) {
                if (username.length < 17) {
                    response = `You have been registered as \`${username}\`.`;
                    player = new Player(interaction.user.id, username);
                    await (interaction.member.roles as GuildMemberRoleManager).add(config.roles.registered)
                    await Player.post(player);
                } else response = "This username is too long.";
            } else response = `The username, \`${username}\`, is invalid. Try using /register with a different username.`
        } await interaction.reply({content: response, ephemeral: true})
    }
}

function isValidUsername(username: String): boolean {
    for (const word of censoredWords) if (username.toLowerCase().includes(word)) return false;
    let usernameFilter = new RegExp(/^[a-zA-Z0-9]([._-](?![._-])|[a-zA-Z0-9]){1,18}[a-zA-Z0-9]$/);
    let filteredUsername = username.toLowerCase().match(usernameFilter);
    return !!filteredUsername;
}