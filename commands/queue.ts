import {SlashCommandBuilder} from "@discordjs/builders";
import * as config from "../config.json";
import {ButtonInteraction, CommandInteraction, GuildMember} from "discord.js";
import {bot} from "../App";
import Player from "../objects/Player";
import Game from "../objects/Game";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("General-purpose queue interactions")
        .setDefaultPermission(false)

        // view - subcommand
        .addSubcommand((command) => command
            .setName('view')
            .setDescription('Command to view the queue')
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
        )

        // remove - subcommand
        .addSubcommand((command) => command
            .setName('remove')
            .setDescription('Command to remove a player from the queue')
            .addUserOption((user) => user
                .setName('target')
                .setDescription('The player to be removed from the queue')
                .setRequired(true)
            )
        ),

    permissions: [
        {
            id: config.roles.registered,
            type: 'ROLE',
            permission: true
        },
    ],

    async execute(interaction: CommandInteraction | ButtonInteraction) {
        const subcommand = interaction instanceof CommandInteraction ? interaction.options.getSubcommand() : interaction.customId;
        let player = await Player.get(interaction.user.id);
        let response;
        if (!player) response = "Use \`/register\` to be able to interact with the PUPL Queue.";
        else {
            if (player.banTime > Math.round(Date.now() / 1000)) return interaction.reply({content: `You will be unbanned <t:${player.banTime}:R>`, ephemeral: true});
            switch (subcommand) {
                case 'view': case 'v':
                    await bot.queue.update("Current Queue", 1);
                    break;
                case 'join': case 'j':
                    response = await bot.queue.join(player.getBasePlayer());
                    break;
                case 'leave': case 'l':
                    response = bot.queue.remove(player.getBasePlayer());
                    break;
                case 'remove':
                    if ((interaction.member as GuildMember).roles.cache.some((role) => {return role.id == config.roles.admin;})) {
                        interaction = interaction as CommandInteraction;
                        player = await Player.get(interaction.options.getUser('target').id);
                        if (player) {
                            if (bot.queue.has(player.id)) {
                                response = "Executed";
                                bot.queue.delete(player.id);
                                await bot.queue.update(`${player.username} has been removed from the queue`, 2);
                            } else response = `${player.username} is not in the queue`
                        } else response = "This player is not registered"
                    } else response = "You don't have permission to do this."
            }
        }
        try {
            await interaction.reply({content: response, ephemeral: true});
        } catch (error) { }
    }
}