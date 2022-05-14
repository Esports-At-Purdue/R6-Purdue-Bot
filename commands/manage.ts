import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import Game from "../objects/Game";
import Player from "../objects/Player";
import {bot} from "../App";
import Queue from "../objects/Queue";
import * as blacklist from "../blacklist.json";
import {updateRankings} from "../database/database.service";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("manage")
        .setDescription("General-purpose management command")
        .setDefaultPermission(false)

        // game
        .addSubcommandGroup((group) => group
            .setName("game")
            .setDescription("Game management")
            .addSubcommand((subcommand) => subcommand
                .setName("sub")
                .setDescription("Subs a player into a game")
                .addIntegerOption((integer) => integer
                    .setName("id")
                    .setDescription("The ID of this game")
                    .setRequired(true)
                    .setMinValue(1)
                )
                .addUserOption((user) => user
                    .setName("sub")
                    .setDescription("Player to be added")
                    .setRequired(true)
                )
                .addUserOption((user) => user
                    .setName("target")
                    .setDescription("Player to be removed")
                    .setRequired(true)
                )
            )
            .addSubcommand((subcommand) => subcommand
                .setName("set-winner")
                .setDescription("Sets a winner for a game")
                .addIntegerOption((integer) => integer
                    .setName("id")
                    .setDescription("The ID of this game")
                    .setRequired(true)
                    .setMinValue(1)
                )
                .addIntegerOption((integer) => integer
                    .setName("winner")
                    .setDescription("The winner of this game")
                    .setRequired(true)
                    .setChoices([
                            ["Team 1", 0], ["Team 2", 1]
                        ]
                    )
                )
            )
            .addSubcommand((subcommand) => subcommand
                .setName("set-draw")
                .setDescription("Sets a game as a draw")
                .addIntegerOption((integer) => integer
                    .setName("id")
                    .setDescription("The ID of this game")
                    .setRequired(true)
                    .setMinValue(1)
                )
            )
            .addSubcommand((subcommand) => subcommand
                .setName("set-map")
                .setDescription("Sets the map for a game")
                .addIntegerOption((integer) => integer
                    .setName("id")
                    .setDescription("The ID of this game")
                    .setRequired(true)
                    .setMinValue(1)
                )
                .addStringOption((string) => string
                    .setName("map")
                    .setDescription("The new map")
                    .setRequired(true)
                    // "Bank", "Chalet", "Clubhouse", "Coastline", "Kafe Dostoyevsky", "Oregon", "Villa"
                    .setChoices([
                            ["Bank", "Bank"], ["Chalet", "Chalet"], ["Clubhouse", "Clubhouse"],
                            ["Coastline", "Coastline"], ["Kafe Dostoyevsky", "Kafe Dostoyevsky"],
                            ["Oregon", "Oregon"], ["Villa", "Villa"]
                        ]
                    )
                )
            )
        )

        // queue
        .addSubcommandGroup((group) => group
            .setName("queue")
            .setDescription("Queue management")
            .addSubcommand((subcommand) => subcommand
                .setName("add")
                .setDescription("Adds a player to the current queue")
                .addUserOption((user) => user
                    .setName("target")
                    .setDescription("The player too be added")
                    .setRequired(true)
                )
            )
            .addSubcommand((subcommand) => subcommand
                .setName("kick")
                .setDescription("Kicks a player from the queue")
                .addUserOption((user) => user
                    .setName("target")
                    .setDescription("The player to be kicked")
                    .setRequired(true)
                )
            )
            .addSubcommand((subcommand) => subcommand
                .setName("reset")
                .setDescription("Empties the current queue")
            )
        )

        // player
        .addSubcommandGroup((group) => group
            .setName("player")
            .setDescription("Player management")
            .addSubcommand((subcommand) => subcommand
                .setName("set-username")
                .setDescription("Changes a player's username")
                .addUserOption((user) => user
                    .setName("target")
                    .setDescription("The player to update")
                    .setRequired(true)
                )
                .addStringOption((string) => string
                    .setName("username")
                    .setDescription("The new username")
                    .setRequired(true)
                )
            )
            .addSubcommand((subcommand) => subcommand
                .setName("register")
                .setDescription("Registers a player for the PUPL")
                .addUserOption((user) => user
                    .setName("target")
                    .setDescription("The player to register")
                    .setRequired(true)
                )
                .addStringOption((string) => string
                    .setName("username")
                    .setDescription("The username of the player")
                    .setRequired(false)
                )
            )
            .addSubcommand((subcommand) => subcommand
                .setName("set-stats")
                .setDescription("Changes a player's stats")
                .addUserOption((user) => user
                    .setName("target")
                    .setDescription("The player to update")
                    .setRequired(true)
                )
                .addIntegerOption((integer) => integer
                    .setName("points")
                    .setDescription("The new amount of points")
                    .setRequired(false)
                    .setMinValue(0)
                )
                .addIntegerOption((integer) => integer
                    .setName("wins")
                    .setDescription("The new amount of wins")
                    .setRequired(false)
                    .setMinValue(0)
                )
                .addIntegerOption((integer) => integer
                    .setName("losses")
                    .setDescription("The new amount of losses")
                    .setRequired(false)
                    .setMinValue(0)
                )
                .addIntegerOption((integer) => integer
                    .setName("draws")
                    .setDescription("The new amount of draws")
                    .setRequired(false)
                    .setMinValue(0)
                )
            )
            .addSubcommand((subcommand) => subcommand
                .setName("ban")
                .setDescription("Bans a player from the PUPL")
                .addUserOption((user) => user
                    .setName("target")
                    .setDescription("The player to be banned")
                    .setRequired(true)
                )
                .addIntegerOption((integer) => integer
                    .setName("length")
                    .setDescription("The magnitude of the ban length")
                    .setRequired(true)
                    .setMaxValue(100)
                )
                .addStringOption((string) => string
                    .setName("unit")
                    .setDescription("The unit of time to use")
                    .setRequired(true)
                    .setChoices([
                            ["Second(s)", "seconds"], ["Minute(s)", "minutes"], ["Hour(s)", "hours"],
                            ["Day(s)", "days"],["Week(s)", "weeks"], ["Month(s)", "months"], ["Year(s)", "years"]
                        ]
                    )
                )
            )
            .addSubcommand((subcommand) => subcommand
                .setName("unban")
                .setDescription("Unbans a player from the PUPL")
                .addUserOption((user) => user
                    .setName("target")
                    .setDescription("The player to be unbanned")
                    .setRequired(true)
                )
            )
        )
    ,


    async execute(interaction: CommandInteraction) {
        //await interaction.deferReply();
        let subcommandGroup = interaction.options.getSubcommandGroup()
        let subcommand = interaction.options.getSubcommand();
        let response;
        let player;
        let user;

        switch (subcommandGroup) {
            case "game":
                let game = await Game.get(interaction.options.getInteger("id").toString());
                if (game) {
                    switch (subcommand) {
                        case "sub":
                            let sub = await Player.get(interaction.options.getUser('sub').id);
                            let target = await Player.get(interaction.options.getUser('target').id);
                            if (sub) {
                                if (target) {
                                    if (await game.sub(sub, target)) {
                                        response = {content: `<@!${sub.id}> has been subbed in for <@!${target.id}>`}
                                    } else response = {content: "This substitution could not be completed.", ephemeral: true};
                                } else response = {content: "The target is not a valid player.", ephemeral: true};
                            } else response = {content: "The sub is not a valid player.", ephemeral: true};
                            break;
                        case "set-winner":
                            let code = interaction.options.getInteger("winner");
                            await game.end(code);
                            response = {content: `Game ${game.id} result has been set. Team ${code + 1} won!`};
                            break;
                        case "set-draw":
                            await game.end(2);
                            response = {content: `Game ${game.id} result has been set. It's a draw!`};
                            break;
                        case "set-map":
                            let map = interaction.options.getString("map");
                            game.map = map;
                            await game.save();
                            response = {content: `Game ${game.id} has been moved to ${map}.`};
                            break;
                    }
                } else response = {content: "This game does not exist.", ephemeral: true};
                break;
            case "queue":
                switch (subcommand) {
                    case "add":
                        player = await Player.get(interaction.options.getUser("target").id);
                        if (player) {
                            if (!bot.queue.has(player.id)) {
                                await bot.queue.join(player);
                                response = {content: `${player.username} has been added`, ephemeral: true};
                            } else response = {content: `${player.username} is already in queue.`, ephemeral: true};
                        } else response = {content: "This player is not registered.", ephemeral: true};
                        break;
                    case "kick":
                        player = await Player.get(interaction.options.getUser("target").id);
                        if (player) {
                            if (bot.queue.has(player.id)) {
                                bot.queue.delete(player.id);
                                await bot.queue.update(`${player.username} has been removed`, 2);
                                response = {content: `${player.username} has been kicked from the queue.`, ephemeral: true};
                            } else response = {content: `${player.username} is not in the queue.`, ephemeral: true};
                        } else response = {content: "This player is not registered.", ephemeral: true};
                        break;
                    case "reset":
                        bot.queue = new Queue(bot.lobbyChannel);
                        await bot.queue.update("The queue has been reset.", 2);
                        response = {content: "The queue has been reset.", ephemeral: true};
                        break;
                }
                break;
            case "player":
                user = await interaction.options.getUser("target")
                player = await Player.get(user.id);
                if (player) {
                    switch (subcommand) {
                        case "set-username":
                            let oldUsername = player.username;
                            let username = interaction.options.getString("username");
                            player.username = username;
                            await player.save();
                            if (isValidUsername(username)) response = {content: `${oldUsername} is now ${username}.`, ephemeral: true};
                            else response = {content: `${oldUsername} is now ${username}. Warning, this username is against the rules. Please address this.`, ephemeral: true};
                            break;
                        case "register":
                            response = {content: "This player is already registered", ephemeral: true};
                            break;
                        case "set-stats":
                            player.points = interaction.options.getInteger("points") ?? player.points;
                            player.wins = interaction.options.getInteger("wins") ?? player.wins;
                            player.losses = interaction.options.getInteger("losses") ?? player.losses;
                            player.draws = interaction.options.getInteger("draws") ?? player.draws;
                            await player.save();
                            await updateRankings();
                            response = {content: `${player.username} has been updated.`, ephemeral: true};
                            break;
                        case "ban":
                            let magnitude = interaction.options.getInteger("length");
                            let unit = interaction.options.getString("unit");
                            let time = Math.round(Date.now() / 1000);
                            switch (unit) {
                                case "minutes": time += magnitude * 60; break;
                                case "hours": time += magnitude * 3600; break;
                                case "days": time += magnitude * 86400; break;
                                case "weeks": time += magnitude * 604800; break;
                                case "months": time += magnitude * 2629800; break;
                                case "years": time += magnitude * 31556952; break;
                            }
                            player.banTime = time;
                            await player.save();
                            if (bot.queue.has(player.id)) {
                                bot.queue.delete(player.id);
                                await bot.queue.update(`${player.username} has been kicked from the queue`, 2);
                            }
                            response = ({content: `**${player.username}** has been banned from the PUPL until <t:${time}:F>`});
                            break;
                        case "unban":
                            player.banTime = 0;
                            await player.save();
                            response = {content: `**${player.username}** has been unbanned from the PUPL`};
                            break;
                    }
                } else {
                    if (subcommand == "register") {
                        let username = interaction.options.getString("username") ?? interaction.options.getUser("target").username;
                        player = Player.post(new Player(user.id, username));
                        response = {content: `<@!${user.id}> has been registered as ${username}.`};
                    } else response = {content: "This player is not registered.", ephemeral: true};
                }
                break;
            default:
                response = {content: "Something went very wrong... Please send this to <@!751910711218667562>."};
                await bot.logger.fatal("Manage Command Failed", new Error("Inaccessible option"));
        }

        return response;
    }
}
const censoredWords = blacklist.list.split(" ");

function isValidUsername(username: String): boolean {
    for (const word of censoredWords) if (username.toLowerCase().includes(word)) return false;
    let usernameFilter = new RegExp(/^[a-zA-Z0-9]([._-](?![._-])|[a-zA-Z0-9]){1,18}[a-zA-Z0-9]$/);
    let filteredUsername = username.toLowerCase().match(usernameFilter);
    return !!filteredUsername;
}