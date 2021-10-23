import {SlashCommandBuilder} from "@discordjs/builders";
import {Client, CommandInteraction, Snowflake} from "discord.js";
import {guild_id} from "../config.json";
import {server_roles} from "../roles.json";
import {app} from "../index";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('View the 10-mans queue.')
        .setDefaultPermission(false),
    async execute(interaction: CommandInteraction) {
        let embed;
        let queue;
        let members;

        queue = app.queue;
        members = queue.members;
        embed = await queue.buildEmbed(members);

        return interaction.reply({embeds: [embed], ephemeral: true});
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