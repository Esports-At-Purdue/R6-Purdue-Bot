import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, MessageEmbed} from "discord.js";
import {bot} from "../App";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Displays info about other commands.")
        .setDefaultPermission(true),

    async execute(interaction: CommandInteraction) {
        let response;
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
        } response = ({embeds: [embed]});
        return response;
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