import {SlashCommandBuilder} from "@discordjs/builders";
import {Client, CommandInteraction, MessageEmbed, Snowflake, TextChannel} from "discord.js";
import {score_report} from '../config.json';
import {server_roles} from "../roles.json";
import {app} from "../index";
import {Game} from "../modules/db_types/Game";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('game')
        .setDescription('General command for interacting with games')
        .setDefaultPermission(false)
        .addSubcommand((subcommand) =>
            subcommand
                .setName('set_winner')
                .setDescription("Sets the winner of a game")
                .addIntegerOption((option) =>
                    option
                        .setName('game_number')
                        .setDescription('The game number')
                        .setRequired(true)
                )
                .addIntegerOption((option) =>
                    option
                        .setName('team_number')
                        .setDescription('The number of the winning team')
                        .setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('set_draw')
                .setDescription("Calls the game as a draw")
                .addIntegerOption((option) =>
                    option
                        .setName('game_number')
                        .setDescription('The game number')
                        .setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('info')
                .setDescription('Shows information about a game')
                .addIntegerOption((option) =>
                    option
                        .setName('game_number')
                        .setDescription('The game number')
                        .setRequired(true))
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('count')
                .setDescription('Gives the total tally of games')
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('list')
                .setDescription('Returns a list of games and their statuses')
                .addIntegerOption((option) =>
                    option
                        .setName('page')
                        .setDescription('The page to list')
                        .setRequired(false)
                )

        ),

    async execute(interaction: CommandInteraction) {
        let subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'info':
                await executeInfoCommand(interaction);
                break;

            case 'count':
                await executeCountCommand(interaction);
                break;

            case 'list':
                await executeListCommand(interaction);
                break;

            case 'set_winner':
                await executeSetWinnerCommand(interaction);
                break;

            case 'set_draw':
                await executeSetDrawCommand(interaction);
                break;
        }
    },

    async setPermissions(client: Client, commandId: Snowflake) {
        let guild = app.guild;
        let commandPermissionsManager = guild.commands.permissions;

        await commandPermissionsManager.add({
            command: commandId, permissions: [
                {
                    id: server_roles["verified"]["id"],
                    type: 'ROLE',
                    permission: true
                },
            ]
        })
    }
}

async function executeInfoCommand(interaction: CommandInteraction) {
    let index = interaction.options.getInteger('game_number');
    let game = await Game.findOne({where: {index: index}});

    if (game) {
        let embed = await game.createEmbed();
        await interaction.reply({embeds: [embed]});
    } else {
        await interaction.reply({content: "This game doesn't exist", ephemeral: true});
    }
}

async function executeCountCommand(interaction: CommandInteraction) {
    await app.gameManager.synchronize();
    let count = app.gameManager.cache.size;
    await interaction.reply({content: `There have been \`${count}\` games.`, ephemeral: true});
}

async function executeListCommand(interaction: CommandInteraction) {
    let index = interaction.options.getInteger('page');
    let embed = await app.gameManager.createList(index);
    await interaction.reply({embeds: [embed]});
}

async function executeSetWinnerCommand(interaction: CommandInteraction) {
    let index = interaction.options.getInteger('game_number');
    let teamIndex = interaction.options.getInteger('team_number');
    let game = await Game.findOne({where: {index: index}});

    if (game) {
        let channel;
        let teams = await game.getTeams();
        if (await game.getChannel()) channel = await game.getChannel();
        let teamOneChannel;
        let teamTwoChannel;

        for (const team of teams) {
            let players = await team.getMembers();
            if (team.getIndex() === 1) if (await team.getChannel()) teamOneChannel = await team.getChannel();
            if (team.getIndex() === 2) if (await team.getChannel()) teamTwoChannel = await team.getChannel();
            if (team.getIndex() === teamIndex) {
                game.setWinner(team);
                for (const player of players) {
                    player.setPoints(player.getPoints() + 10);
                    player.setWins(player.getWins() + 1);
                    await player.save();
                }
            } else {
                for (const player of players) {
                    player.setPoints(player.getPoints() + - 7 >= 0 ? player.getPoints() - 7 : 0);
                    player.setLosses(player.getLosses() + 1);
                    await player.save();
                }
            }
        }
        game.setStatus(0);
        await game.save();

        await channel.delete();
        await teamOneChannel.delete();
        await teamTwoChannel.delete();

        let scoreReportChannel = await app.guild.channels.fetch(score_report) as TextChannel;
        let embed = await game.createEmbed();
        let wonEmbed = new MessageEmbed().setTitle(`Team ${teamIndex} has won!`).setColor("GREEN");
        await scoreReportChannel.send({embeds: [wonEmbed, embed]});
        await interaction.reply({content: "Winner has been set!", ephemeral: true});
    } else {
        await interaction.reply({content: "This game doesn't exist", ephemeral: true});
    }
}

async function executeSetDrawCommand(interaction: CommandInteraction) {
    let index = interaction.options.getInteger('game_number');
    let game = await Game.findOne({where: {index: index}});

    if (game) {
        let channel;
        let teams = await game.getTeams();
        if (await game.getChannel()) channel = await game.getChannel();
        let teamOneChannel;
        let teamTwoChannel;

        for (const team of teams) {
            let players = await team.getMembers();
            if (team.getIndex() === 1) if (await team.getChannel()) teamOneChannel = await team.getChannel();
            if (team.getIndex() === 2) if (await team.getChannel()) teamTwoChannel = await team.getChannel();
            for (const player of players) {
                player.setDraws(player.getDraws() + 1);
                await player.save();
            }
        }
        game.setStatus(0);
        await game.save();

        await channel.delete();
        await teamOneChannel.delete();
        await teamTwoChannel.delete();

        let scoreReportChannel = await app.guild.channels.fetch(score_report) as TextChannel;
        let embed = await game.createEmbed();
        let firstEmbed = new MessageEmbed().setTitle(`Game ${index} is a draw!`).setColor("YELLOW");
        await scoreReportChannel.send({embeds: [firstEmbed, embed]});
        await interaction.reply({content: "A draw has been called!", ephemeral: true});
    } else {
        await interaction.reply({content: "This game doesn't exist", ephemeral: true});
    }
}