import {SlashCommandBuilder} from "@discordjs/builders";
import {Client, CommandInteraction, Snowflake} from "discord.js";
import {app} from "../index";
import {server_roles} from "../roles.json";
import {Leaderboard} from "../modules/data_types/Leaderboard";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Shows a leaderboard of the PUPL')
        .setDefaultPermission(false)
        .addIntegerOption(option =>
            option
                .setName('page')
                .setDescription('The page number')
                .setRequired(false)),

    async execute(interaction: CommandInteraction) {
        let page = interaction.options.getInteger('page')
        let leaderboard = new Leaderboard();

        await leaderboard.init(page);
        await interaction.reply({embeds: [leaderboard], ephemeral: true});
    },

    async setPermissions(client: Client, commandId: Snowflake) {
        let guild = app.guild;
        let commandPermissionsManager = guild.commands.permissions;

        await commandPermissionsManager.add({
            command: commandId, permissions: [
                {
                    id: server_roles["verified"]["id"],
                    type: 'ROLE',
                    permission: true
                },
            ]
        })
    }
}