import {SlashCommandBuilder} from "@discordjs/builders";
import * as config from "../config.json";
import {CommandInteraction, MessageEmbed} from "discord.js";
import {bot} from "../App";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Displays info about other commands.")
        .setDefaultPermission(true),

    permissions: [
        {
            id: config.guild,
            type: "ROLE",
            permission: true
        }
    ],

    async execute(interaction: CommandInteraction) {
        let embed = new MessageEmbed().setTitle("Help Menu - R6@Purdue").setColor("#5a69ea").setDescription("");
        let list = [];
        await bot.commands.forEach(command => {
            list.push([toTitleCase(command.data.name), command.data.description])
        });
        list.sort();
        for (const [name, description] of list) {
            embed.setDescription(embed.description.concat(`**${name}** - ${description}\n\n`));
        }
        await interaction.reply({embeds: [embed]});
    }
}

function toTitleCase(string): string {
    string = string.toLowerCase().split('-');
    for (let i = 0; i < string.length; i++) {
        string[i] = string[i].charAt(0).toUpperCase() + string[i].slice(1);
    }
    return string.join('-');
}