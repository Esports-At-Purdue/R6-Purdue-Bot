import {SlashCommandBuilder} from "@discordjs/builders";
import * as config from "../config.json";
import {CommandInteraction} from "discord.js";
import Game from "../objects/Game";
import {bot} from "../App";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("game")
        .setDescription("General-use command for viewing and managing games")
        .setDefaultPermission(false)

        // info - subcommand
        .addSubcommand((command) => command
            .setName("info")
            .setDescription("Command to view the details of a game")
            .addIntegerOption((option) => option
                .setName("id")
                .setDescription("The ID of this game")
                .setRequired(true))
        )
    ,

    permissions: [
        {
            id: config.roles.registered,
            type: "ROLE",
            permission: true
        }
    ],

    async execute(interaction: CommandInteraction) {
        await interaction.deferReply();
        let response;
        const subcommand = interaction.options.getSubcommand();
        const game = await Game.get(interaction.options.getInteger("id").toString());

        if (game) {
            switch (subcommand) {
                case "info":
                    await interaction.deferReply();
                    const file = await game.toImage();
                    await interaction.editReply({files: [file]});
                    response = null;
                    break;
                default:
                    response = {content: "Something went very wrong... Please send this to <@!751910711218667562>."};
                    await bot.logger.fatal("Manage Command Failed", new Error("Inaccessible option"));
            }
        }
        else response = {content: "This game does not exist.", ephemeral: true};
        if (response) {
            if (response.ephemeral) {
                await interaction.deleteReply();
                await interaction.followUp(response);
            } else await interaction.editReply(response);
        }
    }
}
