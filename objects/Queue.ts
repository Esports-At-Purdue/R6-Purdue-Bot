import {MessageActionRow, MessageButton, MessageEmbed, TextChannel} from "discord.js";
import {bot} from "../App";
import Player from "./Player";
import Game from "./Game";
import * as config from "../config.json";
import BasePlayer from "./BasePlayer";
import * as process from "process";

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

    public async join(player: BasePlayer): Promise<string> {
        if (this.has(player.id)) return ("You are already in the queue.");
        else if (this.size == 10) return ("The queue is already full.");
        else {
            const timeout = global.setTimeout(Queue.timeout, this.time, this, player);
            this.set(player.id, timeout)
            if (this.size == 10) {
                await this.update("Queue is full. A new game is starting...", 0);
                bot.queue = new Queue(bot.lobbyChannel);
                await Game.create(this)
            } else this.update(`${player.username} has joined the queue.`, 1).then();
            return ("You have joined the queue.");
        }
    }

    public remove(player: BasePlayer): string {
        if (this.size == 10) return ("Queue has filled. You cannot leave at this time.");
        else if (this.has(player.id)) {
            clearTimeout(this.get(player.id));
            this.delete(player.id);
            this.update(`${player.username} has left the queue.`, 2).then(() => {
                return ("You have left the queue.")
            });
        } else return ("You are not in the queue.");
    }

    public async update(update: string, code: number, message = null) {
        let messages = (await this.channel.messages.fetch({limit: 6}))
            .filter(message => message.author == bot.user);

        for (const [, message] of messages) {
            if (message.embeds[0] != undefined && message.embeds[0] != null) {
                if (message.embeds[0].title.toLowerCase().includes("queue")) await message.delete();
            }
        }
        let options;
        let embed = new MessageEmbed().setTitle(update).setDescription("");
        const row = new MessageActionRow().addComponents(
            new MessageButton().setLabel("Join").setCustomId("join").setStyle("SUCCESS"),
            new MessageButton().setLabel("Leave").setCustomId("leave").setStyle("DANGER"),
            new MessageButton().setLabel("View").setCustomId("view").setStyle("SECONDARY"));
        let keys = this.keys();
        for (let i = 0; i < this.size; i++) {
            let player = await Player.get(keys.next().value);
            embed.setDescription(embed.description.concat(`**${i + 1}.** ${player.username}\n`));
        }
        switch (code) {
            case 0: embed.setColor("BLUE"); break;
            case 1: embed.setColor("GREEN"); break;
            case 2: embed.setColor("ORANGE"); break;
        }
        if (message != null) options = {content: message, embeds: [embed], components: [row]}
        else options = {embeds: [embed], components: [row]}
        this.channel.send(options).then();

    }

    static async timeout(queue: Queue, player: BasePlayer) {
        queue.delete(player.id);
        await queue.update(`${player.username} has been timed out from the queue`, 2, `<@!${player.id}>`);
    }
}