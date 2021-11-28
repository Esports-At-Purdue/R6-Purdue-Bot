import {MessageActionRow, MessageButton, MessageEmbed, TextChannel} from "discord.js";
import Player from "./db/Player";

export default class Queue extends Array<Player> {
    private readonly _timeout: number;
    private readonly _maxSize: number;
    private readonly _timeouts: Array<NodeJS.Timeout>;
    private _lastMessage: string;

    constructor() {
        super();
        this._timeout = 3600000;
        this._maxSize = 10;
        this._timeouts = [];
    }

    get timeout(): number {
        return this._timeout;
    }

    get maxSize(): number {
        return this._maxSize;
    }
c
    get timeouts(): Array<NodeJS.Timeout> {
        return this._timeouts;
    }

    get lastMessage(): string {
        return this._lastMessage;
    }

    set lastMessage(value: string) {
        this._lastMessage = value;
    }

    remove(player: Player) {
        this.forEach((queuePlayer, index) => {
            if (queuePlayer.id == player.id) {
                this.splice(index, 1);
                clearTimeout(this.timeouts[index]);
                this.timeouts.splice(index, 1);
            }
        });
    }

    contains(newPlayer: Player) {
        const containsPlayer = (player) => player.id == newPlayer.id;
        return this.some(containsPlayer);
    }

    buildEmbed() {
        let description = "";
        const embed = new MessageEmbed()
            .setTitle(`10-Mans Queue [${this.length}/10]`)
            .setColor("YELLOW");

        for (let i = 0; i < this.length; i++) {
            let player = this[i];
            description = description.concat(`**${i + 1}.** ${player.username}\n`);
        }

        this.length ? embed.setDescription(description)
                  : embed.setDescription("The queue is currently empty!");

        return embed;
    }

    buildRow() {
        return new MessageActionRow().addComponents(
            new MessageButton().setLabel("Join").setCustomId("join").setStyle("SUCCESS"),
            new MessageButton().setLabel("Leave").setCustomId("leave").setStyle("DANGER"),
            new MessageButton().setLabel("View").setCustomId("view").setStyle("SECONDARY"));
    }

    async updateLastMessage(channel: TextChannel) {
        try {
            const message = await channel.messages.fetch(this.lastMessage);
            await message.delete();
        } catch (e) { }
    }
}