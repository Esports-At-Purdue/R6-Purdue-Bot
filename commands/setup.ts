import {CommandInteraction, MessageActionRow, MessageButton, MessageEmbed} from "discord.js";
import * as config from "../config.json";
import {SlashCommandBuilder} from "@discordjs/builders";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('General-purpose command for menu setup')
        .setDefaultPermission(false)
        .addStringOption(option => option
            .setName("menu_name")
            .setDescription("The name of the menu to setup")
            .setRequired(true)
            .setChoices(
                {name: "roles", value: "roles_menu"},
                {name: "welcome", value: "welcome_menu"},
                {name: "ranks", value: "ranks_menu"},
                {name: "league", value: "league_menu"},
                {name: "register", value: "register_menu"}
            )
        )
    ,

    async execute(command: CommandInteraction) {
        let response;
        let menu = command.options.getString("menu_name");
        switch (menu) {
            case "roles_menu":
                response = await buildRoleMenu();
                break;
            case "ranks_menu":
                response = await buildRanksMenu();
                break;
            case "welcome_menu":
                response = await buildWelcomeMenu();
                break;
            case "league_menu":
                response = await buildLeagueMenu();
                break;
            case "register_menu":
                response = await buildRegisterMenu();
                break;
            default: response = {content: "Unknown setup menu", ephemeral: true};
        }
        return response;
    }
}

async function buildLeagueMenu() {
    let row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(config.roles.summer)
                .setLabel("Click Me For Summer League!")
                .setStyle("PRIMARY")
                .setEmoji(config.emotes.summer)
        )

    return ({components: [row]});
}

async function buildWelcomeMenu() {
    let row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(config.roles.r6)
                .setLabel("Access R6@Purdue!")
                .setStyle("SUCCESS")
                .setEmoji(config.emotes.logo)
        )
    return ({components: [row]});
}

async function buildRanksMenu() {
    let embed = new MessageEmbed()
        .setTitle("R6@Purdue Rank Menu")
        .setColor("#f1c40f")
        .setDescription("Select your R6 Rank!");

    let row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(config.roles.ranks.unranked)
                .setLabel("Unranked")
                .setStyle("SECONDARY")
                .setEmoji(config.emotes.unranked),
            new MessageButton()
                .setCustomId(config.roles.ranks.copper)
                .setLabel("Copper")
                .setStyle("SECONDARY")
                .setEmoji(config.emotes.copper),
            new MessageButton()
                .setCustomId(config.roles.ranks.bronze)
                .setLabel("Bronze")
                .setStyle("SECONDARY")
                .setEmoji(config.emotes.bronze),
            new MessageButton()
                .setCustomId(config.roles.ranks.silver)
                .setLabel("Silver")
                .setStyle("SECONDARY")
                .setEmoji(config.emotes.silver),
        );

    let row2 = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(config.roles.ranks.gold)
                .setLabel("Gold")
                .setStyle("SECONDARY")
                .setEmoji(config.emotes.gold),
            new MessageButton()
                .setCustomId(config.roles.ranks.platinum)
                .setLabel("Platinum")
                .setStyle("SECONDARY")
                .setEmoji(config.emotes.platinum),
            new MessageButton()
                .setCustomId(config.roles.ranks.diamond)
                .setLabel("Diamond")
                .setStyle("SECONDARY")
                .setEmoji(config.emotes.diamond),
            new MessageButton()
                .setCustomId(config.roles.ranks.champion)
                .setLabel("Champion")
                .setStyle("SECONDARY")
                .setEmoji(config.emotes.champion)
        );

    return ({embeds: [embed], components: [row, row2]});
}

async function buildRegisterMenu() {
    let embed = new MessageEmbed()
        .setTitle("Summer League Registration Menu")
        .setColor("#f1c40f")
        .setDescription("" +
            "• **Solo** - Register Solo.\n" +
            "• **Duo** - Register with a Duo.\n\n" +
            "_Google Form Submissions will overwrite Discord Submissions_");

    let row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setLabel("Solo")
                .setStyle('SUCCESS')
                .setCustomId("solo"),
            new MessageButton()
                .setLabel("Duo")
                .setStyle('SUCCESS')
                .setCustomId("duo"),
        )

    return ({embeds: [embed], components: [row]});
}

async function buildRoleMenu() {
    let embed = new MessageEmbed()
        .setTitle("R6@Purdue Server Roles")
        .setColor("#f1c40f")
        .setDescription("" +
            "• **Purdue** - React if you are an alumnus, student, or incoming freshman.\n" +
            "• **PUPL** - React to receive access to ten-mans channels and notifications.\n" +
            "• **Game Night** - React to receive access game night channels and notifications.");

    let row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setLabel("Purdue")
                .setStyle('SECONDARY')
                .setEmoji(config.emotes.purdue)
                .setCustomId(config.roles.purdue),
            new MessageButton()
                .setLabel("Games")
                .setStyle('SECONDARY')
                .setEmoji("🎲")
                .setCustomId(config.roles.games),
            new MessageButton()
                .setLabel("PUPL")
                .setStyle('SECONDARY')
                .setEmoji(config.emotes.pupl)
                .setCustomId(config.roles.registered)
        )

    return ({embeds: [embed], components: [row]});
}