import {collections} from "../database/database.service";
import * as config from "../config.json";
import {bot} from "../App";
import {CategoryChannel, VoiceChannel} from "discord.js";
import Player from "./Player";
import BasePlayer from "./BasePlayer";

export default class Team {
    private _id: string;
    private _index: number;
    private _channel: string;
    private _players: Array<Object>;

    constructor(id: string, index: number, channel: string = "", players: Array<Object> = []) {
        this._id = id;
        this._index = index;
        this._channel = channel;
        this._players = players;
    }

    static fromObject(object) {
        return new Team(object._id, object._index,  object._channel, object._players);
    }

    static async create(captain: Player, index: number) {
        const id = await collections.teams.countDocuments() + 1;
        const team = new Team(id.toString(), index, "", [captain]);
        await Team.post(team);
        return team;
    }

    get id(): string {
        return this._id;
    }

    set id(value: string) {
        this._id = value;
    }

    get index(): number {
        return this._index;
    }

    set index(value: number) {
        this._index = value;
    }

    get channel(): string {
        return this._channel;
    }

    set channel(value: string) {
        this._channel = value;
    }

    get players(): Array<Object> {
        return this._players;
    }

    set players(value: Array<Object>) {
        this._players = value;
    }

    async sub(sub: BasePlayer, target: BasePlayer): Promise<boolean> {
        for (let i = 0; i < 5; i++) {
            let player = BasePlayer.fromObject(this._players[i]);
            if (target.id == player.id) {
                this._players.splice(i, 1);
                this._players.push(sub)
                await Team.put(this);
                return true;
            }
        }
        return false;
    }

    async setWinner() {
        await this.players.forEach(object => {
            Player.get(object["_id"]).then(player => {
                    player.points += 10;
                    player.wins += 1;
                    Player.put(player);
            });
        });
    }

    async setLoser() {
        await this.players.forEach(object => {
            Player.get(object["_id"]).then(player => {
                player.points -= player.points > 7 ? 7 : player.points;
                player.losses += 1;
                Player.put(player);
            });
        });
    }

    async createChannel() {
        const category = await bot.guild.channels.fetch(config.category) as CategoryChannel;
        const channel = await category.createChannel(`Team ${this.index} Voice`,
            {type: "GUILD_VOICE", permissionOverwrites: [
                    {
                        id: config.guild,
                        deny: ["SPEAK"],
                        allow: ["VIEW_CHANNEL", "CONNECT"]
                    },
                    {
                        id: config.roles.admin,
                        allow: ["MOVE_MEMBERS", "CONNECT", "SPEAK"]
                    }
                ]
            }
        )
        for (const object of this._players) {
            let player = BasePlayer.fromObject(object);
            await channel.permissionOverwrites.create(
               await bot.guild.members.fetch(player.id),
                {SPEAK: true}
            )
            try {
                let member = await bot.guild.members.fetch(player.id);
                await member.voice.setChannel(channel);
            } catch (error) { }
        }
        this.channel = channel.id;
        await Team.put(this);
    }

    async deleteChannel() {
        if (this.channel != null) {
            const channel = await bot.guild.channels.fetch(this.channel);
            channel.members.each((member) => {
                member.voice.setChannel(config.channels.voice);
            })
            await channel.delete();
            this.channel = null;
            await Team.put(this);
        }
    }

    async save() {
        await Team.put(this);
    }

    static async get(id: string) {
        try {
            const query = { _id: id };
            const team = Team.fromObject(await collections.teams.findOne(query));

            if (team) {
                return team;
            }
        } catch (error) {
            return undefined;
        }
    }

    static async post(team: Team) {
        try {
            const newTeam = (team);
            // @ts-ignore
            return await collections.teams.insertOne(newTeam);

        } catch (error) {
            console.error(error);
            return undefined;
        }
    }

    static async put(team: Team) {
        await collections.teams.updateOne({ _id: (team.id) }, { $set: team });
    }

    static async delete(team: Team) {
        await collections.teams.deleteOne({ _id: (team.id) });
    }
}