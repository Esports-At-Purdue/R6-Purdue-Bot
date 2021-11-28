import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, Guild, GuildMember, Snowflake} from "discord.js";
import {list} from "../blacklist.json";
import Player from "../data/db/Player";
import Log, {LogType} from "../data/Log";

const badWords = list.split(" ");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('General-use profile command')
        .setDefaultPermission(false)

        // update - subcommand group
        .addSubcommandGroup((group) => group
            .setName('update')
            .setDescription('General-use profile update command group')

            // username - subcommand
            .addSubcommand((command) => command
                .setName('username')
                .setDescription('Command to update profile username')
                .addStringOption((option) => option
                    .setName('username')
                    .setDescription('Your preferred username')
                    .setRequired(true)
                )
            )
        )

        // info - subcommand
        .addSubcommand((command) => command
            .setName('info')
            .setDescription('Command to view a profile')
            .addMentionableOption((mentionable) => mentionable
                .setName('target')
                .setDescription('The profile to view')
            )
        ),

    async execute(interaction: CommandInteraction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'username':
                await updateUsername(interaction);
                break;

            case 'info':
                await info(interaction);
        }
    },

    async setPermissions(commandId: Snowflake, guild: Guild) {
        let commandPermissionsManager = guild.commands.permissions;

        await commandPermissionsManager.set({
            command: commandId,
            permissions: [
                {
                    id: guild.id,
                    type: 'ROLE',
                    permission: true
                },
            ]
        })
    }
}

async function updateUsername(interaction: CommandInteraction) {
    const username = interaction.options.getString('username');

    try {
        const player = await Player.get(interaction.user.id);
        if (checkIfUsernameIsValid(username)) {
            player.username = username;
            await interaction.reply({content: `You have updated your username to \`${username}\``});
            await Player.put(player);
        } else await interaction.reply({content: "This username is invalid", ephemeral: true});
    } catch (error) {
        await interaction.reply({content: `Unable to retrieve your profile`, ephemeral: true});
        await new Log(LogType.ERROR, error).send();
    }
}

async function info(interaction: CommandInteraction) {
    let player;
    const id = interaction.user.id;
    const mentionable = interaction.options.getMentionable('target') as GuildMember;

    if (mentionable) player = await Player.get(mentionable.id)
    else player = await Player.get(id);

    if (player) {
        await interaction.deferReply();
        const image = await player.buildProfileImage();
        await interaction.editReply({files: [image]});
    } else {
        await interaction.reply({content: `Unable to retrieve this profile`, ephemeral: true});
    }
}

function checkIfUsernameIsValid(username: String) {
    for (const word of badWords) if (username.toLowerCase().includes(word)) return null;
    let usernameFilter = new RegExp(/^[a-zA-Z0-9]([._-](?![._-])|[a-zA-Z0-9]){1,18}[a-zA-Z0-9]$/);
    let filteredUsername = username.toLowerCase().match(usernameFilter);
    return !!filteredUsername;
}