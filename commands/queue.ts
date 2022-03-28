import {SlashCommandBuilder} from "@discordjs/builders";
import * as config from "../config.json";
import {ButtonInteraction, CommandInteraction} from "discord.js";
import {bot} from "../App";
import Player from "../objects/Player";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("General-purpose queue interactions")
        .setDefaultPermission(false)

        // view - subcommand
        .addSubcommand((command) => command
            .setName('bump')
            .setDescription('Command to bump the queue')
        )

        // join - subcommand
        .addSubcommand((command) => command
            .setName('join')
            .setDescription('Command to join the queue')
        )

        // leave - subcommand
        .addSubcommand((command) => command
            .setName('leave')
            .setDescription('Command to leave the queue')
        ),

    permissions: [
        {
            id: config.roles.registered,
            type: 'ROLE',
            permission: true
        }
    ],

    async execute(interaction: CommandInteraction | ButtonInteraction) {
        await interaction.deferReply();
        let response;
        let subcommand = interaction instanceof CommandInteraction ? interaction.options.getSubcommand() : interaction.customId;
        let player = await Player.get(interaction.user.id);
        if (!player) response = {content: "Use \`/register\` to be able to interact with the PUPL Queue.", ephemeral: true};
        else {
            if (player.banTime > Math.round(Date.now() / 1000)) return interaction.reply({content: `You will be unbanned <t:${player.banTime}:R>`, ephemeral: true});
            switch (subcommand) {
                case 'bump': case 'v':
                    await bot.queue.update("Current Queue", 1);
                    response = {content: "The queue has been bumped!", ephemeral: true};
                    break;
                case 'join': case 'j':
                    response = {content: await bot.queue.join(player.getBasePlayer()), ephemeral: true};
                    break;
                case 'leave': case 'l':
                    response = {content: bot.queue.remove(player.getBasePlayer()), ephemeral: true};
                    break;
                default:
                    response = {content: "Something went very wrong... Please send this to <@!751910711218667562>."};
                    await bot.logger.fatal("Manage Command Failed", new Error("Inaccessible option"));
            }
        }
        try {
            if (response.ephemeral) {
                await interaction.deleteReply();
                await interaction.followUp(response);
            } else await interaction.editReply(response);
        } catch (ignored) {}
    }
}