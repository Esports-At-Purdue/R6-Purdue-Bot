import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("flip")
        .setDescription("Flip a coin for heads or tails")
        .setDefaultPermission(true)
    ,

    async execute(interaction: CommandInteraction) {
        let random = Math.random();
        let message = random > 0.5 ? `<@${interaction.user.id}> Heads` : `<@${interaction.user.id}> Tails`
        return ({content: message});
    }
}