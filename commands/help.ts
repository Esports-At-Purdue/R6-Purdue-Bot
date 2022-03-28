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
            list.push([toTitleCase(command.data.name), command.data.description, command.data.options])
        });
        list.sort();
        for (const [name, description, options] of list) {
            //if (name == "Verify") {
                embed.setDescription(embed.description.concat(`**${name}** - ${description}\n`));
                for (const option of options) {
                    embed.setDescription(embed.description.concat(mapOptions(name.toLowerCase(), option)));
                    //console.log(mapOptions(name, option));
                }
                embed.setDescription(embed.description.concat("\n"))
            //}
        } await interaction.reply({embeds: [embed]});
    }
}

function mapOptions(name, option): string {
    let response = "";
    let options = option.options;
    if (option.type) {
        response = response.concat(`⠀⠀⠀⠀\`<${option.name}>\` - ${option.description}\n`)
    } else {
        response = response.concat(`⠀⠀\`/${name} ${option.name}\` - ${option.description}\n`);
        for (let subOption of options) {
            response = response.concat(mapOptions(`${name} ${option.name}`, subOption))
        }
    }
    return response;
}

function toTitleCase(string): string {
    string = string.toLowerCase().split('-');
    for (let i = 0; i < string.length; i++) {
        string[i] = string[i].charAt(0).toUpperCase() + string[i].slice(1);
    }
    return string.join('-');
}