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
import {bot} from "../App";

const options = {
    intents: [
        Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_PRESENCES
    ]
} as ClientOptions;

let registrants: Array<Registrant> = [];

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
        setInterval(async function() {
            await updateRegistrants();
            if (new Date().getMinutes() == 0 && new Date().getHours() % 6 == 0) {
                await updateRegistrations();
            }
        }, 60000)
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

async function updateRegistrants() {
    const CLIENT_KEY = config.google_key;
    const RANGES = "A2:I51";
    const ID = "1509hLAPyanr-sSytm5dSDAcIlBjPGZFVEwoY8LYSlwo";
    const URL = `https://sheets.googleapis.com/v4/spreadsheets/${ID}?key=${CLIENT_KEY}&ranges=${RANGES}&includeGridData=true`;

    request(URL, async function (error, response, body) {
        let json = JSON.parse(body)
        let rowData = json.sheets[0].data[0].rowData;
        let total = registrants.length;
        registrants = [];

        for (let i = 0; i < 50; i++) {
            let data = rowData[i].values;
            let uplay = data[1]["formattedValue"];
            let discord = data[2]["formattedValue"];
            let purdue = data[3]["formattedValue"];

            if (data[5]["formattedValue"] == "Solo") {
                registrants.push(new Registrant(uplay, discord, purdue === "true", true, false, null));
            } else if (data[5]["formattedValue"] == "Sub") {
                registrants.push(new Registrant(uplay, discord, purdue === "true", false, true, null));
            } else if (data[5]["formattedValue"] == "Duo") {
                let partnerDiscord = data[6]["formattedValue"];
                let duo = false;
                for (let i = 0; i < registrants.length; i++) {
                    let registrant = registrants[i];
                    if (registrant.discord === partnerDiscord) {
                        registrant = new Registrant(uplay, discord, purdue === "true", false, false, null);
                        registrants[i].partner = registrant;
                        duo = true;
                    }
                }
                if (!duo) {
                    registrants.push(new Registrant(uplay, discord, purdue === "true", false, false, null));
                }
            }
        }

        if (registrants.length != total) {
            await updateRegistrations();
        }
    });
}

async function updateRegistrations() {
    let total = registrants.length;
    let embed = new MessageEmbed().setColor("#8bc34a");
    let soloField = {name: "Solos", value: "", inline: true};
    let duoField = {name: "Duos", value: "", inline: true};
    let subField = {name: "Subs", value: "", inline: true}

    registrants.forEach(registrant => {
        if (registrant.solo) {
            soloField.value += `${registrant.uplay}\n`;
        } else if (registrant.sub) {
            total -= 1;
            subField.value += `${registrant.uplay}\n`
        } else {
            if (registrant.partner != null && registrant.partner.uplay != null) {
                total += 1;
                duoField.value += `${registrant.uplay} + ${registrant.partner.uplay}\n`;
            } else {
                duoField.value += `${registrant.uplay} + **Unconfirmed**\n`;
            }
        }
    })

    embed.addField(soloField.name, soloField.value, soloField.inline);
    embed.addField(duoField.name, duoField.value, duoField.inline);
    embed.addField(subField.name, subField.value, subField.inline);
    embed.setTitle(`Spots Remaining: ${50 - total}`);

    let webhook = await bot.fetchWebhook("974541067351380028", "ukYUtDeYFc6Q7F45ayUnjqORUBn82ocW7isB6bGlj4kMW7_AXRLGQgxED_hie_SZ2HzI");
    let channel = await bot.guild.channels.fetch(config.channels.registrations) as TextChannel;

    try {
        await channel.messages.fetch({limit: 1}).then(messages => {
            messages.first().delete();
        })
    } catch {}
    await webhook.send({embeds: [embed]});
}