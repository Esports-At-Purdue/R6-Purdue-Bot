// TODO: Player command
//  - Create
//  - Update
//  - Delete

import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, Guild, Snowflake} from "discord.js";
import {server_roles} from "../roles.json";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("player")
        .setDescription("General-purpose player management command.")
        .setDefaultPermission(false)

    // create

    // update

    // delete

    ,

    async execute(interaction: CommandInteraction) {
        // await interaction.reply({content: "True", ephemeral: true});
    },

    async setPermissions(commandId: Snowflake, guild: Guild) {
        let commandPermissionsManager = guild.commands.permissions;

        await commandPermissionsManager.set({
            command: commandId,
            permissions: [
                {
                    id: server_roles["administrator"]["id"],
                    type: 'ROLE',
                    permission: true
                },
            ]
        })
    }
}