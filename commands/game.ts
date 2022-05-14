import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import Game from "../objects/Game";
import {bot} from "../App";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("game")
        .setDescription("General-use command for viewing and managing games")
        .setDefaultPermission(true)

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

    async execute(interaction: CommandInteraction) {
        let response;
        const subcommand = interaction.options.getSubcommand();
        const game = await Game.get(interaction.options.getInteger("id").toString());

        if (game) {
            switch (subcommand) {
                case "info":
                    const embed = await game.toEmbed();
                    //const file = await game.toImage();
                    response = ({embeds: [embed]});
                    break;
                default:
                    response = {content: "Something went very wrong... Please send this to <@!751910711218667562>.", ephemeral: true};
                    await bot.logger.fatal("Manage Command Failed", new Error("Inaccessible option"));
            }
        }
        else response = {content: "This game does not exist.", ephemeral: true};

        return response;
    }
}
