import {ButtonInteraction, CommandInteraction, GuildMember, GuildMemberRoleManager} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import * as blacklist from "../blacklist.json";
import * as config from "../config.json";
import Player from "../objects/Player";

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
        await interaction.deferReply();
        let response;
        let username;
        let player = await Player.get(interaction.user.id);

        if (player) {
            await (interaction.member as GuildMember).roles.add(config.roles.registered);
            response = {content: "You are already registered", ephemeral: true};
        } else {
            if (interaction instanceof CommandInteraction) username = interaction.options.getString("username");
            username ??= interaction.user.username;
            if (isValidUsername(username)) {
                if (username.length < 17 && username.length > 2) {
                    await Player.post(new Player(interaction.user.id, username));
                    await (interaction.member.roles as GuildMemberRoleManager).add(config.roles.registered);
                    response = {content: `You have been registered as \`${username}\``, ephemeral: true};
                } else response = {content: `Your username must be 3-16 characters long.`, ephemeral: true};
            } else response = {content: `The username, \`${username}\`, is invalid. Try using /register with a different username.`, ephemeral: true};
        }
        if (response.ephemeral) {
            await interaction.deleteReply();
            await interaction.followUp(response);
        } else await interaction.editReply(response);
    }
}

function isValidUsername(username: String): boolean {
    for (const word of censoredWords) if (username.toLowerCase().includes(word)) return false;
    let usernameFilter = new RegExp(/^[a-zA-Z0-9]([._-](?![._-])|[a-zA-Z0-9]){1,18}[a-zA-Z0-9]$/);
    let filteredUsername = username.toLowerCase().match(usernameFilter);
    return !!filteredUsername;
}