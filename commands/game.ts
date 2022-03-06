import {SlashCommandBuilder} from "@discordjs/builders";
import * as config from "../config.json";
import {CommandInteraction, GuildMember} from "discord.js";
import Game from "../objects/Game";
import Player from "../objects/Player";
import {response} from "express";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('game')
        .setDescription('General-use command for viewing and managing games')
        .setDefaultPermission(false)

        // manage - subcommand group
        .addSubcommandGroup((group) => group
            .setName('manage')
            .setDescription('General-use command for managing games')

            // winner - subcommand
            .addSubcommand((command) => command
                .setName('winner')
                .setDescription('Command to set the winner of a game')
                .addIntegerOption((option) => option
                    .setName('game_number')
                    .setDescription('The game number')
                    .setRequired(true))
                .addIntegerOption((option) => option
                    .setName('winner')
                    .setDescription('The number of the winning team')
                    .setRequired(true)
                    .addChoices([['Team 1', 0], ['Team 2', 1]])
                )
            )

            // draw - subcommand
            .addSubcommand((command) => command
                .setName('draw')
                .setDescription('Command to call a draw for a game')
                .addIntegerOption((option) => option
                    .setName('game_number')
                    .setDescription('The game number')
                    .setRequired(true)
                )
            )

            // sub - subcommand
            .addSubcommand((command) => command
                .setName('sub')
                .setDescription('Command to substitute a player into a game')
                .addIntegerOption((option) => option
                    .setName('game_number')
                    .setDescription('The game number')
                    .setRequired(true))
                .addUserOption((option) => option
                    .setName('sub')
                    .setDescription('The player to add to the game')
                    .setRequired(true))
                .addUserOption((option) => option
                    .setName('target')
                    .setDescription('The player to remove from the game')
                    .setRequired(true)
                )
            )

            // map - subcommand
            .addSubcommand((command) => command
                .setName('map')
                .setDescription('Command to set the map for a game')
                .addIntegerOption((option) => option
                    .setName('game_number')
                    .setDescription('The game number')
                    .setRequired(true))
                .addStringOption((option) => option
                    .setName('map')
                    .setDescription('The new map')
                    .setRequired(true)
                    .setChoices([
                            ['Bank', 'Bank'], ['Chalet', 'Chalet'], ['Clubhouse', 'Clubhouse'],
                            ['Coastline', 'Coastline'],['Kafe Dostoyevsky', 'Kafe Dostoyevsky'],
                            ['Oregon', 'Oregon'], ['Villa', 'Villa']
                        ]
                        //"Bank", "Chalet", "Clubhouse", "Coastline", "Kafe Dostoyevsky", "Oregon", "Villa"
                    )
                )
            )
        )

        // info - subcommand
        .addSubcommand((command) => command
            .setName('info')
            .setDescription('Command to view the details of a game')
            .addIntegerOption((option) => option
                .setName('game_number')
                .setDescription('The game number')
                .setRequired(true))
        )
    ,

    permissions: [
        {
            id: config.roles.registered,
            type: "ROLE",
            permission: true
        }
    ],

    async execute(interaction: CommandInteraction) {
        const command = interaction.options.getSubcommand();
        const group = interaction.options.getSubcommandGroup(false);
        const gameNumber = interaction.options.getInteger('game_number');
        const game = await Game.get(gameNumber.toString());
        if (game) {
            switch (group) {
                case null:
                    switch (command) {
                        case "info":
                            await interaction.deferReply();
                            const file = await game.toImage();
                            await interaction.editReply({files: [file]});
                            break;
                    }
                    break;
                case "manage":
                    if ((interaction.member as GuildMember).roles.cache.some((role) => {return role.id == config.roles.admin;})) {
                        let response;
                        switch(command) {
                            case "winner":
                                let code = interaction.options.getInteger('winner');
                                await game.end(code);
                                response =  "Executed";
                                break;
                            case "draw":
                                await game.end(2);
                                response = "Executed";
                                break;
                            case "map":
                                response = "Executed";
                                let map = interaction.options.getString("map");
                                await interaction.channel.send(`Game ${game.id} has been changed to ${map}`);
                                game.map = map;
                                await Game.put(game);
                                break;
                            case "sub":
                                let sub = await Player.get(interaction.options.getUser('sub').id);
                                let target = await Player.get(interaction.options.getUser('target').id);
                                if (sub) {
                                    if (target) {
                                        if (await game.sub(sub, target)) {
                                            await interaction.channel.send({content: `<@!${sub.id}> has been subbed in for <@!${target.id}>`});
                                            response = "Executed";
                                        } else response = "This substitution could no be completed."
                                    } else response = "The target is not a valid player."
                                } else response = "The sub is not a valid player."
                                break;
                        }
                        await interaction.reply({content: response, ephemeral: true});
                    } else await interaction.reply({content: "You don't have permission to do this.", ephemeral: true});
            }
        } else await interaction.reply({content: "This game does not exist.", ephemeral: true});
    },
}
