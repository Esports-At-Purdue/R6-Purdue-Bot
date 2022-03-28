import {
    ApplicationCommand,
    Client,
    ClientOptions,
    Collection,
    Guild,
    Intents, MessageActionRow, MessageButton,
    MessageEmbed,
    TextChannel
} from "discord.js";
import {collections, connectToDatabase, updateRankings} from "../database/database.service";
import {playersRouter} from "../database/players.router";
import {teamsRouter} from "../database/teams.router";
import {gamesRouter} from "../database/games.router";
import {Routes} from "discord-api-types/v9";
import * as config from "../config.json";
import {REST} from "@discordjs/rest";
import * as express from "express";
import Queue from "./Queue";
import * as fs from "fs";
import Logger from "./Logger";
import {ApplicationCommandOptionTypes} from "discord.js/typings/enums";

const options = {
    intents: [
        Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_PRESENCES
    ]
} as ClientOptions;

export default class Bot extends Client{
    private _guild: Guild;
    private _queue: Queue;
    private _logger: Logger;
    private _commands: Collection<any, any>;
    private _lobbyChannel: TextChannel;
    private _logChannel: TextChannel;

    constructor() {
        super(options);
        this._commands = new Collection();
    }

    get guild(): Guild {
        return this._guild;
    }

    set guild(value: Guild) {
        this._guild = value;
    }

    get queue() {
        return this._queue;
    }

    set queue(value) {
        this._queue = value;
    }

    get logger(): Logger {
        return this._logger;
    }

    set logger(value: Logger) {
        this._logger = value;
    }

    get commands() {
        return this._commands;
    }

    set commands(value) {
        this._commands = value;
    }

    get lobbyChannel(): TextChannel {
        return this._lobbyChannel;
    }

    set lobbyChannel(value: TextChannel) {
        this._lobbyChannel = value;
    }

    get logChannel(): TextChannel {
        return this._logChannel;
    }

    set logChannel(value: TextChannel) {
        this._logChannel = value;
    }

    async init() {
        this._guild = await this.guilds.fetch(config.guild);
        this._logChannel = await this._guild.channels.fetch(config.channels.log) as TextChannel;
        this._lobbyChannel = await this._guild.channels.fetch(config.channels.lobby) as TextChannel;
        this._logger = new Logger(this._logChannel);
        await this.initializeExpress(28017);
        await this.initializeQueue();
        await this.initializeCommands(config.token);
    }

    async initializeExpress(address: number) {
        await connectToDatabase().then(() => {
            express().use("/players", playersRouter);
            express().use("/teams", teamsRouter);
            express().use("/games", gamesRouter);
            express().listen(address, () => {
                this.logger.info(`Server started at http://localhost:${address}`)
            })
        }).catch((error: Error) => {
            this.logger.fatal("Database connection failure", error);
            process.exit(0);
        })
    }

    async initializeQueue() {
        this._queue = new Queue(this._lobbyChannel);
        await this.queue.update("A new queue has started", 3);
        for (const [,message] of (await this.lobbyChannel.messages.fetch({limit: 6}))) {
            if (message.author.id == this.user.id) {
                await message.edit({components: []});
                if (message.embeds.some(embed => embed.title == "A new queue has started")) {
                    await message.delete();
                }
            }
        }
    }

    async initializeCommands(token: string) {
        const commands = [];
        const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
        const rest = new REST({ version: '9' }).setToken(token);
        const id = this.application.id;
        const guild = this.guilds.cache.get(config.guild);

        for (const file of commandFiles) {
            const command = require(`../commands/${file}`);
            if (command.data) {
                commands.push(command.data.toJSON());
                await this.commands.set(command.data.name, command);
            }
        }

        try {
            await rest.put(Routes.applicationGuildCommands(id, guild.id), {body: commands});
            const guildCommands = await rest.get(Routes.applicationGuildCommands(id, guild.id)) as Array<ApplicationCommand>;
            for (const guildCommand of guildCommands) {
                const command = this.commands.get(guildCommand.name);
                await guild.commands.permissions.set({
                    command: guildCommand.id,
                    permissions: command.permissions
                })
            }
            await this.logger.info("Application commands uploaded");
        } catch (error) {
            await this.logger.error("Error uploading application commands", error);
        }
    }
}