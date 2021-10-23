import {SlashCommandBuilder} from "@discordjs/builders";
import {Client, CommandInteraction, Snowflake} from "discord.js";
import {guild_id} from "../config.json";
import {server_roles} from "../roles.json";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('flip')
        .setDescription('Flips a coin randomly')
        .setDefaultPermission(false),

    async execute(interaction: CommandInteraction) {
        let random;
        let message;

        random = Math.random() < 0.5;
        message = random ? `Team 1` : `Team 2`;

        await interaction.reply({content: `**${message}**`});
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
