import {collections} from "../../services/database.service";
import {bot} from "../../App";
import {guild_id, game_category} from "../../channels.json";
import {CategoryChannel, VoiceChannel} from "discord.js";

export default class Team {
    private _id: string;
    private _index: number;
    private _captain: string;
    private _channel: string;
    private _players: Array<string>;

    constructor(id: string, index: number, captain: string, channel = "", players = []) {
        this._id = id;
        this._index = index;
        this._captain = captain;
        this._channel = channel;
        this._players = players;
    }

    static fromObject(object) {
        return new Team(object._id, object._index, object._captain, object._channel, object._players);
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

    get captain(): string {
        return this._captain;
    }

    set captain(value: string) {
        this._captain = value;
    }

    get channel(): string {
        return this._channel;
    }

    set channel(value: string) {
        this._channel = value;
    }

    get players(): Array<string> {
        return this._players;
    }

    set players(value: Array<string>) {
        this._players = value;
    }

    async createChannel() {
        const guild = await bot.client.guilds.fetch(guild_id);
        const category = await guild.channels.fetch(game_category) as CategoryChannel;
        const channel = await category.createChannel(`Team ${this.index} Voice`, {type: "GUILD_VOICE", permissionOverwrites: [{id: guild.id, deny: ["CONNECT"], allow: ["VIEW_CHANNEL"]}]});
        this.channel = channel.id;
    }

    async deleteChannel() {
        const guild = await bot.client.guilds.fetch(guild_id);
        const channel = await guild.channels.fetch(this.channel);
        await channel.delete();
    }

    async setChannelPerms() {
        const guild = await bot.client.guilds.fetch(guild_id);
        const channel = await guild.channels.fetch(this.channel) as VoiceChannel;
        await channel.permissionOverwrites.set([{id: guild.id, allow: ["VIEW_CHANNEL"], deny: ["CONNECT"]}]);
        for (const id of this.players) {
            const member = await guild.members.fetch(id);
            await channel.permissionOverwrites.create(member, {CONNECT: true});
        }
    }

    static async create(captainId: string, index: number) {
        const id = await collections.teams.countDocuments() + 1;
        const team = new Team(id.toString(), index, captainId);
        team.players.push(captainId);
        await team.createChannel();
        await Team.post(team);
        return team;
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