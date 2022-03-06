import {collections} from "../database/database.service";
import {GuildMember, MessageAttachment} from "discord.js";
import * as Canvas from "canvas";
import {bot} from "../App";
import BasePlayer from "./BasePlayer";

export default class Player extends BasePlayer {
    private _points: number;
    private _wins: number;
    private _losses: number;
    private _draws: number;
    private _rank: number;
    private _banTime: number;

    constructor(id: string, username: string, points = 0, wins = 0, losses = 0, draws = 0, rank = null, banTime = 0) {
        super(id, username);
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
        return new Player(object._id, object._username, object._points, object._wins, object._losses, object._draws, object._rank, object._banTime);
    } // Player.fromObject

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

    getBasePlayer() {
        return BasePlayer.fromObject(this);
    }

    toString(): string {
        return `Player{"id":"${this.id}","username":"${this.username}",
        "points":${this._points},"wins":${this._wins},
        "losses":${this._losses},"draws":${this._draws},
        "rank":${this._rank}`;
    }

    async toImage(): Promise<MessageAttachment> {
        const canvas = Canvas.createCanvas(1000, 600);
        const ctx = canvas.getContext('2d');
        const user = await bot.guild.members.fetch(this.id) as GuildMember;
        const avatar = await Canvas.loadImage(user.displayAvatarURL({ format: 'jpg' }));
        const index = Math.floor(this.points / 10) > 6 ? 6 : Math.floor(this.points / 10);
        const background = await Canvas.loadImage("./media/background.png");
        const panel = await Canvas.loadImage("./media/panel.png");
        const gray = await Canvas.loadImage("./media/gray.png");
        const rank = await Canvas.loadImage(`./media/ranks/${index}.png`);
        const r6logo = await Canvas.loadImage("./media/r6logo4.png");

        printImage(ctx, background, 0, 0, canvas.width, canvas.height, 25);
        printImage(ctx, gray, 18, 160, canvas.width - 36, canvas.height - 178, 20);
        printImage(ctx, panel, 24, 166, canvas.width - 48, canvas.height - 190, 20);
        printImage(ctx, r6logo, canvas.width - 108, 18, 90, 90, 1);
        printImage(ctx, rank, 600, 250, 175, 175, 0);

        printText(ctx, `${this.username}`, canvas.width / 5, 80, "#ffffff", "72px sans-serif", "left");
        printText(ctx, `Purdue University Pro League`, canvas.width / 5, 130, "#ffffff", "36px sans-serif", "left");
        ctx.font = '72px sans-serif';
        ctx.fillStyle = "#080808";
        ctx.fillText(`Rank:`, 50,270);
        ctx.fillText(`Points:`, 50, 355);
        ctx.fillText(`Wins:`, 50, 440);
        ctx.fillText(`Losses:`, 50, 525);
        ctx.textAlign = "center";
        ctx.fillText(`${this._rank}`, 400, 270);
        ctx.fillText(`${this._points}`, 400, 355);
        ctx.fillText(`${this._wins}`, 400, 440);
        ctx.fillText(`${this._losses}`, 400, 525);
        printAvatar(ctx, avatar);

        return new MessageAttachment( canvas.toBuffer(),`${this.username}-profile.png`);
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

function printText(ctx, text, x, y, color, font, alignment) {
    ctx.fillStyle = color;
    ctx.textAlign = alignment;
    ctx.font = font;
    ctx.fillText(text, x, y);
}

function roundedImage(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function printImage(ctx, image, x, y, width, height, radius) {
    roundedImage(ctx, x, y, width, height, radius);
    ctx.clip();
    ctx.drawImage(image, x, y, width, height);
    ctx.restore();
    ctx.save();
}

function printAvatar(ctx, avatar) {
    ctx.beginPath();
    ctx.arc(86.5, 78.5, 65, 0, Math.PI * 2, true);
    ctx.fillStyle = "#ffffff";
    ctx.clip();
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(86.5, 78.5, 62.5, 0, Math.PI * 2, true);
    ctx.clip();
    ctx.drawImage(avatar, 24, 16, 125, 125);
}