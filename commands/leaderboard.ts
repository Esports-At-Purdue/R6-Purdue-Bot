import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, InteractionReplyOptions} from "discord.js";
import {updateRankings} from "../database/database.service";
import LeaderboardImage from "../objects/images/Leaderboard.Image";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Displays the PUPL Leaderboard')
        .setDefaultPermission(true)
        .addIntegerOption((option) => option
            .setName('page')
            .setDescription('The page of the leaderboard')
            .setRequired(false)
        ),

    async execute(interaction: CommandInteraction): Promise<InteractionReplyOptions> {
        await updateRankings();
        const response = {content: `<@${interaction.user.id}>`, files: null, ephemeral: false};
        const page = interaction.options.getInteger('page') ?? 1;
        response.files = [await LeaderboardImage.build(page)];

        return response;
    },
}
