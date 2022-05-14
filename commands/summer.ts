import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, InteractionReplyOptions, User} from "discord.js";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("summer")
        .setDescription("Summer League Command")
        .setDefaultPermission(true)

        // stats
        .addSubcommand((subcommand) => subcommand
            .setName("stats")
            .setDescription("Lists summer league stats")
            .addUserOption((user) => user
                .setName("target")
                .setDescription("The user to get stats for")
                .setRequired(false)
            )
        )

        // list
        .addSubcommand((subcommand) => subcommand
            .setName("list")
            .setDescription("Lists summer league participants")
            .addStringOption((string) => string
                .setName("target")
                .setDescription("The team to list")
                .setRequired(false)
            )
        )
    ,

    async execute(interaction: CommandInteraction): Promise<InteractionReplyOptions> {
        let response: InteractionReplyOptions;

        switch(interaction.options.getSubcommand()) {
            case "stats":
                let user: User = interaction.options.getUser("target");
                if (user != null) {

                } else {

                }
                break;
            case "list":
                let target: string = interaction.options.getString("target");
                if (target != null) {

                } else {

                }
                break;
            default:
        }

        return response;
    }
}