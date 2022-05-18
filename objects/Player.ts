import {collections} from "../database/database.service";
import {GuildMember, MessageAttachment} from "discord.js";
import * as Canvas from "canvas";
import {bot} from "../index";

export default class Player {
    private _id: string;
    private _username: string;
    private _points: number;
    private _wins: number;
    private _losses: number;
    private _draws: number;
    private _rank: number;
    private _banTime: number;

    constructor(id: string, username: string, points = 0, wins = 0, losses = 0, draws = 0, rank = null, banTime = 0) {
        this._id = id;
        this._username = username;
        this._points = points;
        this._wins = wins;
        this._losses = losses;
        this._draws = draws;
        this._rank = rank;
        this._banTime = banTime;
    } // Player

    static fromString(string: string): Player{
        const model = JSON.parse(string.slice(string.search("({)")));
        return Player.fromObject(model);
    } // fromString

    static fromObject(object): Player {
        if (object == null) return null;
        return new Player(object._id, object._username, object._points, object._wins, object._losses, object._draws, object._rank, object._banTime);
    } // Player.fromObject

    get id(): string {
        return this._id;
    }

    set id(value: string) {
        this._id = value;
    }

    get username(): string {
        return this._username;
    }

    set username(value: string) {
        this._username = value;
    }

    get points(): number {
        return this._points;
    }

    set points(value: number) {
        this._points = value;
    }

    get wins(): number {
        return this._wins;
    }

    set wins(value: number) {
        this._wins = value;
    }

    get losses(): number {
        return this._losses;
    }

    set losses(value: number) {
        this._losses = value;
    }

    get draws(): number {
        return this._draws;
    }

    set draws(value: number) {
        this._draws = value;
    }

    get rank(): number {
        return this._rank;
    }

    set rank(value: number) {
        this._rank = value;
    }

    get banTime(): number {
        return this._banTime;
    }

    set banTime(value: number) {
        this._banTime = value;
    }

    async save() {
        await Player.put(this);
    }

    static async get(id: string) {
        try {
            const query = { _id: id };
            const player = Player.fromObject(await collections.players.findOne(query));

            if (player) {
                return player;
            }
        } catch (error) {
            return undefined;
        }
    }

    static async post(player: Player) {
        try {
            const newPlayer = (player);
            // @ts-ignore
            return await collections.players.insertOne(newPlayer);


        } catch (error) {
            console.error(error);
            return undefined;
        }
    }

    static async put(player: Player) {
        await collections.players.updateOne({ _id: (player.id) }, { $set: player });
    }

    static async delete(player: Player) {
        await collections.players.deleteOne({ _id: (player.id) });
    }
}
