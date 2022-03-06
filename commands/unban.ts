import {SlashCommandBuilder} from "@discordjs/builders";
import * as config from "../config.json";
import {CommandInteraction} from "discord.js";
import Player from "../objects/Player";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pupl-unban")
        .setDescription("Unbans a player from the PUPL")
        .setDefaultPermission(false)
        .addUserOption((user) => user
            .setName("target")
            .setDescription("The player to ban")
            .setRequired(true))
    ,

    permissions: [
        {
            id: config.roles.admin,
            type: "ROLE",
            permission: true
        }
    ],

    async execute(interaction: CommandInteraction) {
        let user = interaction.options.getUser("target");
        let player = await Player.get(user.id);
        if (player) {
            player.banTime = 0;
            await Player.put(player)
            await interaction.reply({content: `**${player.username}** has been unbanned from the PUPL`});
        } else await interaction.reply({content: "This user isn't registered", ephemeral: true});
    }
}