import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, Guild, Snowflake} from "discord.js";
import {server_roles} from "../roles.json";
import {bot} from "../App";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('q')
        .setDescription('General-use queue command')
        .setDefaultPermission(false)

        // view - subcommand
        .addSubcommand((command) => command
            .setName('v')
            .setDescription('Command to view the queue')
        )

        // join - subcommand
        .addSubcommand((command) => command
            .setName('j')
            .setDescription('Command to join the queue')
        )

        // leave - subcommand
        .addSubcommand((command) => command
            .setName('l')
            .setDescription('Command to leave the queue')
        ),

    async execute(interaction: CommandInteraction) {
        const command = bot.client["commands"].get("queue");
        await command.execute(interaction);
    },

    async setPermissions(commandId: Snowflake, guild: Guild) {
        let commandPermissionsManager = guild.commands.permissions;

        await commandPermissionsManager.set({
            command: commandId,
            permissions: [
                {
                    id: server_roles["verified"]["id"],
                    type: 'ROLE',
                    permission: true
                },
            ]
        })
    }
}