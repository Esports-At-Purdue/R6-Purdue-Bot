import {Client, ClientOptions, Guild, Intents} from "discord.js";
import {Queue} from "./data_types/Queue";
import {GameManager} from "./managers/GameMananger";
import {TeamManager} from "./managers/TeamManager";
import {UserManager} from "./managers/UserManager";
import * as config from "../config.json";

class Bot {
    private options: ClientOptions;
    private intents: Array<number>;
    private client: Client;
    private commands: Array<any>;
    public guild: Guild;
    public queue: Queue;
    public gameManager: GameManager;
    public teamManager: TeamManager;
    public userManager: UserManager;

    constructor() {

        this.intents = [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS,
            Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_MESSAGES,
            Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES,
            Intents.FLAGS.DIRECT_MESSAGE_REACTIONS]

        this.options = {
            intents: this.intents
        }

        this.client = new Client(this.options);
        this.queue = new Queue();
    }

    async init() {
        this.guild = await this.client.guilds.fetch(config["guild_id"]);
        this.gameManager = new GameManager(this.guild);
        this.teamManager = new TeamManager(this.guild);
        this.userManager = new UserManager(this.guild);

        await this.gameManager.synchronize();
        await this.teamManager.synchronize();
        await this.userManager.synchronize();
    }

    getOptions() {
        return this.options;
    }

    setOptions(options: ClientOptions) {
        this.options = options;
    }

    getIntents() {
        return this.intents;
    }

    setIntents(intents: Array<number>) {
        this.intents = intents;
    }

    getClient() {
        return this.client;
    }

    setClient(client: Client) {
        this.client = client;
    }

    getCommands() {
        return this.commands;
    }

    setCommands(commands: Array<any>) {
        this.commands = commands;
    }
}

export {
    Bot
}