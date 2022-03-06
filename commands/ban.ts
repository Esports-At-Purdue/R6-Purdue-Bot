import {SlashCommandBuilder} from "@discordjs/builders";
import * as config from "../config.json";
import {CommandInteraction} from "discord.js";
import Player from "../objects/Player";
import {bot} from "../App";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pupl-ban")
        .setDescription("Bans a player from the PUPL")
        .setDefaultPermission(false)
        .addUserOption((user) => user
            .setName("target")
            .setDescription("The player to ban")
            .setRequired(true))
        .addIntegerOption((integer) => integer
            .setName("time")
            .setDescription("The magnitude of time to ban the user")
            .setRequired(true))
        .addStringOption((string) => string
            .setName("unit")
            .setDescription("The unit of time to use")
            .setChoices([
                    ['Second(s)', 'seconds'], ['Minute(s)', 'minutes'], ['Hour(s)', 'hours'],
                    ['Day(s)', 'days'],['Week(s)', 'weeks'], ['Month(s)', 'months'], ['Year(s)', 'years']
                ])
            .setRequired(true)
        )
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
        let magnitude = interaction.options.getInteger("time");
        let unit = interaction.options.getString("unit");
        let time = Math.round(Date.now() / 1000);
        let player = await Player.get(user.id);

        // 34087060985
        switch (unit) {
            case "minutes": time += magnitude * 60; break;
            case "hours": time += magnitude * 3600; break;
            case "days": time += magnitude * 86400; break;
            case "weeks": time += magnitude * 604800; break;
            case "months": time += magnitude * 2629800; break;
            case "years": time += magnitude * 31556952; break;
        }
        if (time > 34087060985) {
            await interaction.reply({content: `Perhaps ${magnitude} ${unit} is too long... try a shorter time.`, ephemeral: true});
        } else {
            if (player) {
                player.banTime = time;
                if (bot.queue.has(player.id)) {
                    bot.queue.delete(player.id);
                    await bot.queue.update(`${player.username} has been banned from the queue`, 2);
                }
                await Player.put(player)
                await interaction.reply({content: `**${player.username}** has been banned from the PUPL until <t:${time}:F>`});
            } else await interaction.reply({content: "This user isn't registered", ephemeral: true});
        }
    }
}