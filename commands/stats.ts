import { GoogleSpreadsheet } from "google-spreadsheet";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import * as config from "../config.json";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stats")
        .setDescription("Competitive team stats command")
        .setDefaultPermission(false)

        .addSubcommand((command) => command
            .setName("add-game")
            .setDescription("Adds a game to the Game Log")
            .addStringOption((string) => string
                .setName("opponent")
                .setDescription("The name of the opponent")
            )
            .addIntegerOption((integer) => integer
                .setName("rounds-won")
                .setDescription("The number of rounds won")
            )
            .addIntegerOption((integer) => integer
                .setName("rounds-lost")
                .setDescription("The number of rounds lost")
            )
            .addStringOption((string) => string
                .setName("map")
                .setDescription("The map played")
                .addChoices([
                    ["Bank", "Bank"], ["Border", "Border"], ["Chalet", "Chalet"], ["Clubhouse", "Clubhouse"],
                    ["Coastline", "Coastline"], ["Kafe Dostoyevsky", "Kafe"], ["Oregon", "Oregon"],
                    ["Skyscraper", "Skyscraper"], ["Theme Park", "Theme"], ["Villa", "Villa"]
                ])
            )
            .addStringOption((string) => string
                .setName("event")
                .setDescription("The event/league this game is for")
            )
        )
    ,

    permissions: [
        {
            id: config.guild,
            type: 'ROLE',
            permission: true
        },
    ],

    async execute(interaction: CommandInteraction) {
        await interaction.deferReply();

        const credentials = require('../white-team-stats-345107-9b3eff64ca50.json');
        const doc = new GoogleSpreadsheet('1k7H09Tu1RNWhnOin9ro-wWxRYxF_0sy62_ojELWMqOk');
        await doc.useServiceAccountAuth({
            client_email: credentials.client_email,
            private_key: credentials.private_key,
        });
        await doc.loadInfo();

        switch (interaction.options.getSubcommand()) {
            case "add-game":
                let gameLogSheet = await doc.sheetsByIndex[1];
                console.log()
                break;
        }

        await interaction.reply({content: "Success"});
    }
}