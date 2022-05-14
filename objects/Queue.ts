import {MessageActionRow, MessageButton, MessageEmbed, TextChannel} from "discord.js";
import {bot} from "../App";
import Player from "./Player";
import Game from "./Game";
import * as config from "../config.json";

export default class Queue extends Map<string, NodeJS.Timeout>{
    private _time: number;
    private _channel: TextChannel;

    public constructor(channel: TextChannel) {
        super();
        this._time = 3600000;
        this._channel = channel;
    }

    public get time(): number {
        return this._time;
    }

    public set time(value: number) {
        this._time = value;
    }

    get channel(): TextChannel {
        return this._channel;
    }

    set channel(value: TextChannel) {
        this._channel = value;
    }

    public async join(player: Player): Promise<string> {
        if (this.has(player.id)) return ("You are already in the queue.");
        else if (this.size == 10) return ("The queue is already full.");
        else {
            const timeout = global.setTimeout(Queue.timeout, this.time, this, player);
            this.set(player.id, timeout)
            if (this.size == 10) {
                await this.update("A new game is starting...", 0);
                this.forEach((timeout) => {
                    clearTimeout(timeout);
                })
                bot.queue = new Queue(bot.lobbyChannel);
                await Game.create(this)
            } else this.update(`${player.username} has joined`, 1).then();
            return undefined;
        }
    }

    public remove(player: Player): string {
        if (this.size == 10) return ("Queue has filled. You cannot leave at this time.");
        else if (this.has(player.id)) {
            clearTimeout(this.get(player.id));
            this.delete(player.id);
            this.update(`${player.username} has left`, 2).then(() => {
            });
            return undefined;
        } else return ("You are not in the queue.");
    }

    public async update(update: string, code: number, message = null) {
        let messages = (await this.channel.messages.fetch({limit: 10}))
            .filter(message => message.author == bot.user);

        for (const [, message] of messages) {
            if (message.embeds[0] != undefined && message.embeds[0] != null) {
                if (message.embeds[0].title.toLowerCase().includes("10-mans")) await message.delete();
            }
        }
        let options;
        let embed = new MessageEmbed().setTitle("10-Mans: " + update.concat(` [${this.size}/10]`)).setDescription("");
        const row = new MessageActionRow().addComponents(
            new MessageButton().setLabel("Join").setCustomId("join").setStyle("SUCCESS"),
            new MessageButton().setLabel("Leave").setCustomId("leave").setStyle("DANGER"),
            new MessageButton().setLabel("Bump").setCustomId("bump").setStyle("SECONDARY"),
            new MessageButton().setLabel("Register").setCustomId(config.roles.registered).setStyle("PRIMARY"));
        let keys = this.keys();
        for (let i = 0; i < this.size; i++) {
            let player = await Player.get(keys.next().value);
            embed.setDescription(embed.description.concat(`**${i + 1}.** ${player.username}\n`));
        }
        switch (code) {
            case 0: embed.setColor("BLUE"); break;
            case 1: embed.setColor("GREEN"); break;
            case 2: embed.setColor("ORANGE"); break;
            case 3: embed.setColor("WHITE"); break;
        }
        if (message != null) options = {content: message, embeds: [embed], components: [row]}
        else options = {embeds: [embed], components: [row]}
        this.channel.send(options).then();
        return undefined;
    }

    static async timeout(queue: Queue, player: Player) {
        queue.delete(player.id);
        await queue.update(`${player.username} has been timed out`, 2, `<@!${player.id}>`);
    }
}