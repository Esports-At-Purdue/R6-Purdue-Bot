import {ColorResolvable, Guild, MessageEmbed, TextChannel} from "discord.js";
import {log_channel, guild_id} from "../channels.json";
import {bot} from "../App";

export default class Log {
    type: LogType;
    message: string;
    color: ColorResolvable;
    time: Date;

    constructor(type: LogType, message: string) {
        this.type = type;
        this.message = message;
        this.time = new Date();

        if (type == LogType.ERROR) this.color = "RED";
        else if (type == LogType.RESTART) this.color = "GREEN";
        else if (type == LogType.INTERACTION) this.color = "YELLOW";
        else this.color = "BLUE"
    }

    async send() {
        let guild = await bot.client.guilds.fetch(guild_id) as Guild;
        let channel = await guild.channels.fetch(log_channel) as TextChannel;

        let embed = new MessageEmbed()
            .setTitle(this.type)
            .setDescription(this.message)
            .setTimestamp(this.time)
            .setColor(this.color);

        await channel.send({embeds: [embed]});
    }
}

export enum LogType {
    ERROR = "Error",
    RESTART = "Restart",
    INTERACTION = "Interaction",
    DATABASE_UPDATE = "Database Update"
}