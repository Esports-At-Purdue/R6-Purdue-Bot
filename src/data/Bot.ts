import {Client, ClientOptions, Intents} from "discord.js";
import Queue from "./Queue";

export default class Bot {

    private readonly _options: ClientOptions;    // ClientOptions contains gateway intents
    private readonly _client: Client;            // Instance of DiscordClient
    private _queue: Queue;                       // Instance of Queue

    constructor() {
        this._options = {
            intents: [
                Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS,
                Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES,
                Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
            ]
        }


        this._client = new Client(this._options);
        this._queue = new Queue();
    }

    async updateCommands() {

    }

    get options(): ClientOptions {
        return this._options;
    }

    get client(): Client {
        return this._client;
    }

    get queue(): Queue {
        return this._queue;
    }

    set queue(value: Queue) {
        this._queue = value;
    }
}