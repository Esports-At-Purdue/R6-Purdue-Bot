import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, InteractionReplyOptions} from "discord.js";
import Game from "../objects/Game";
import GameImage from "../objects/images/Game.Image";

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

    async execute(interaction: CommandInteraction): Promise<InteractionReplyOptions> {
        let response = {content: null, embeds: null, files: null, ephemeral: true};
        const subcommand = interaction.options.getSubcommand();
        const game = await Game.get(interaction.options.getInteger("id").toString());

        if (game) {
            switch (subcommand) {
                case "info":
                    const embed = await game.toEmbed();
                    const file = await GameImage.build(game);
                    response.content = `<@${interaction.user.id}>`;
                    response.embeds = [embed];
                    response.files = [file]
                    response.ephemeral = false;
                    break;
            }
        }
        else response.content ="This game does not exist.";

        return response;
    }
}
