import {
    Client,
    ClientOptions,
    Collection,
    Guild,
    Intents, MessageEmbed,
    TextChannel
} from "discord.js";
import {connectToDatabase} from "../database/database.service";
import {Routes} from "discord-api-types/v9";
import * as config from "../config.json";
import {REST} from "@discordjs/rest";
import Queue from "./Queue";
import * as fs from "fs";
import * as request from "postman-request";
import Logger from "./Logger";
import Registrant from "./Registrant";
import {bot, registrants} from "../index";

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

    async init() {
        this._guild = await this.guilds.fetch(config.guild);
        this._logChannel = await this._guild.channels.fetch(config.channels.log) as TextChannel;
        this._lobbyChannel = await this._guild.channels.fetch(config.channels["10mans"]) as TextChannel;
        this._logger = new Logger(this._logChannel);
        await connectToDatabase()
        await this.initializeQueue();
        await this.initializeCommands(config.token);
    }

    async initializeQueue() {
        this._queue = new Queue(this._lobbyChannel);
        await this.queue.update("A new queue has started", 3);
        for (const [,message] of (await this.lobbyChannel.messages.fetch({limit: 6}))) {
            if (message.author.id == this.user.id) {
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
            await this.logger.info("Application commands uploaded");
        } catch (error) {
            await this.logger.error("Error uploading application commands", error);
        }
    }
}