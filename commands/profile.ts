import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, GuildMember} from "discord.js";
import Player from "../objects/Player";
import * as blacklist from "../blacklist.json";
import {updateRankings} from "../database/database.service";

const censoredWords = blacklist.list.split(" ");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("profile")
        .setDescription("General-use profile command")
        .setDefaultPermission(true)

        // info - subcommand
        .addSubcommand((command) => command
            .setName('info')
            .setDescription('Command to view a profile')
            .addMentionableOption((mentionable) => mentionable
                .setName('target')
                .setDescription('The profile to view')
            )
        )

        // set-name - subcommand
        .addSubcommand((command) => command
            .setName('set-name')
            .setDescription('Command to change your name')
            .addStringOption((string) => string
                .setName('username')
                .setDescription('Your new username')
                .setRequired(true)
            )
        )
    ,

    async execute(interaction: CommandInteraction) {
        let response;
        let player;
        await updateRankings();
        const subcommand = interaction.options.getSubcommand();
        switch (subcommand) {
            case "info":
                const mentionable = interaction.options.getMentionable('target') as GuildMember;
                player = mentionable ? await Player.get(mentionable.id) : await Player.get(interaction.user.id);
                if (player) {
                    const image = await player.toImage();
                    response = ({content: `<@${interaction.user.id}>`, files: [image]});
                } else {
                    response = {content: `Unable to retrieve this profile`, ephemeral: true};
                }
                break;

            case "set-name":
                let username = interaction.options.getString("username");
                player = (await Player.get(interaction.user.id)) as Player;
                if (player) {
                    if (isValidUsername(username)) {
                        player.username = username;
                        await Player.put(player);
                        response = {content: `Success! You have changed your username to \`${username}\``, ephemeral: true}
                    } else {
                        response = {content: `Sorry, the provided username, \`${username}\`, isn't allowed`, ephemeral: true}
                    }
                } else {
                    response = {content: `Unable to retrieve this profile`, ephemeral: true};
                }
        }
        return response;
    }
}

function isValidUsername(username: String): boolean {
    for (const word of censoredWords) if (username.toLowerCase().includes(word)) return false;
    let usernameFilter = new RegExp(/^[a-zA-Z0-9]([._-](?![._-])|[a-zA-Z0-9]){1,18}[a-zA-Z0-9]$/);
    let filteredUsername = username.toLowerCase().match(usernameFilter);
    return !!filteredUsername;
}