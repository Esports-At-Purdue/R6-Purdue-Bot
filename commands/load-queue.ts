import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {collections} from "../database/database.service";
import Player from "../objects/Player";
import {bot} from "../App";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("load-queue")
        .setDescription("Queue testing command")
        .setDefaultPermission(false),

    async execute(interaction: CommandInteraction) {
        let documents = await collections.players.find().sort({_rank: 1}).limit(10).toArray();
        for (const document of documents) {
            let player = Player.fromObject(document);
            if (player.username != "Techno") await bot.queue.set(player.id, setTimeout(() => {}, 10000));
        }
        return ({content: "Queue Loaded.", ephemeral: true});
    }
}