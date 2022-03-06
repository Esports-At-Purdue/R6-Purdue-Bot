import {CommandInteraction, MessageActionRow, MessageButton, MessageEmbed} from "discord.js";
import * as config from "../config.json";
import {bot} from "../App";
import {SlashCommandBuilder} from "@discordjs/builders";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('General-purpose command for menu setup')
        .setDefaultPermission(false)

        // Server-Roles-Menu
        .addSubcommand((command) => command
            .setName('roles')
            .setDescription('Reaction roles menu subcommand')
        )
    ,
    permissions: [
        {
            id: config.roles.officer,
            type: 'ROLE',
            permission: true
        },
        {
            id: config.roles.admin,
            type: 'ROLE',
            permission: true
        }
    ],

    async execute(command: CommandInteraction) {
        const subcommand = command.options.getSubcommand();
        switch (subcommand) {
            case 'roles':
                await command.reply({content: "Menu generated", ephemeral: true});
                await command.channel.send({embeds: [roleMenuEmbed()], components: [await roleMenuRow()]});
                break;
            default: await command.reply({content: "Unknown setup menu", ephemeral: true});
        }
    }
}

const roleMenuEmbed = () => {
    return new MessageEmbed()
        .setTitle("R6@Purdue Server Roles")
        .setDescription("" +
            "• Purdue - React if you are an alumnus, student, or incoming freshman.\n" +
            "• Other - React if you aren't affiliated with Purdue.\n" +
            "• Games - React to receive access game night channels and notifications.\n" +
            "• PUPL - React to receive access to ten-mans channels and notifications.");
}

const roleMenuRow = async () => {
    let guild = await bot.guild;
    return new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setLabel("Purdue")
                .setStyle('SECONDARY')
                .setEmoji(await guild.emojis.fetch(config.emotes.purdue))
                .setCustomId(config.roles.purdue),
            new MessageButton()
                .setLabel("Other")
                .setStyle('SECONDARY')
                .setEmoji("🚫")
                .setCustomId(config.roles.other),
            new MessageButton()
                .setLabel("Games")
                .setStyle('SECONDARY')
                .setEmoji("🎲")
                .setCustomId(config.roles.games),
            new MessageButton()
                .setLabel("PUPL")
                .setStyle('SECONDARY')
                .setEmoji(await guild.emojis.fetch(config.emotes.pupl))
                .setCustomId(config.roles.registered)
        )
}