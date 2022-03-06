import {SlashCommandBuilder} from "@discordjs/builders";
import * as config from "../config.json";
import {CommandInteraction, GuildMember} from "discord.js";
import Player from "../objects/Player";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("profile")
        .setDescription("General-use profile command")
        .setDefaultPermission(false)

        // info - subcommand
        .addSubcommand((command) => command
            .setName('info')
            .setDescription('Command to view a profile')
            .addMentionableOption((mentionable) => mentionable
                .setName('target')
                .setDescription('The profile to view')
            )
        ),

    permissions: [
        {
            id: config.roles.registered,
            type: "ROLE",
            permission: true
        }
    ],

    async execute(interaction: CommandInteraction) {
        const subcommand = interaction.options.getSubcommand();
        switch (subcommand) {
            case "info": {
                const mentionable = interaction.options.getMentionable('target') as GuildMember;
                let player = mentionable ? await Player.get(mentionable.id) : await Player.get(interaction.user.id);
                if (player) {
                    await interaction.deferReply();
                    const image = await player.toImage();
                    await interaction.editReply({files: [image]});
                } else {
                    await interaction.reply({content: `Unable to retrieve this profile`, ephemeral: true});
                }
            }
            break;
        }
    }
}