import {SlashCommandBuilder} from "@discordjs/builders";
import {ButtonInteraction, CommandInteraction, Guild, GuildMember, GuildMemberRoleManager, Snowflake} from "discord.js";
import Player from "../data/db/Player";
import {list} from "../blacklist.json";
import {server_roles} from "../roles.json";

const badWords = list.split(" ");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Command to register for PUPL.')
        .setDefaultPermission(false)
        .addStringOption((option) => option
            .setName('username')
            .setDescription('Your preferred username')
            .setRequired(false)
        )
    ,

    async execute(interaction: CommandInteraction | ButtonInteraction) {
        let id;
        let player;
        let username;
        let roleManager = interaction.member.roles as GuildMemberRoleManager;

        id = interaction.user.id;
        username = interaction instanceof ButtonInteraction ? undefined : interaction.options.getString('username');
        player = await Player.get(id);

        if (player) {
            await interaction.reply({content: "You are already registered", ephemeral: true});
            await roleManager.add(server_roles["verified"]["id"]);
        } else {
            if (username) {
                if (checkIfUsernameIsValid(username)) {
                    if (username.length < 13) {
                        player = new Player(id, username);
                        await Player.post(player);
                        await roleManager.add(server_roles["verified"]["id"]);
                        await interaction.reply({content: `You have been registered as \`${username}\``, ephemeral: true});
                    } else {
                        await interaction.reply({content: "This username is too long.", ephemeral: true});
                    }
                } else {
                    await interaction.reply({content: "This username is invalid.", ephemeral: true});
                }
            } else {
                username = (interaction.member as GuildMember).displayName;
                player = new Player(id, username);
                await Player.post(player);
                await roleManager.add(server_roles["verified"]["id"]);
                await interaction.reply({content: `You have been registered as \`${username}\``, ephemeral: true});
            }
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

function checkIfUsernameIsValid(username: String) {
    for (const word of badWords) if (username.toLowerCase().includes(word)) return null;
    let usernameFilter = new RegExp(/^[a-zA-Z0-9]([._-](?![._-])|[a-zA-Z0-9]){1,18}[a-zA-Z0-9]$/);
    let filteredUsername = username.toLowerCase().match(usernameFilter);
    return !!filteredUsername;
}