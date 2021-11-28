import {collections} from "../../services/database.service";
import {Guild, GuildMember, MessageAttachment} from "discord.js";
import * as Canvas from "canvas";
import {bot} from "../../App";
import {guild_id} from "../../channels.json";

export default class Player {
    private _id: string;
    private _username: string;
    private _points: number;
    private _wins: number;
    private _losses: number;
    private _draws: number;

    constructor(id: string, username: string, points = 0, wins = 0, losses = 0, draws = 0) {
        this._id = id;
        this._username = username;
        this._points = points;
        this._wins = wins;
        this._losses = losses;
        this._draws = draws;
    }

    static fromObject(object) {
        return new Player(object._id, object._username, object._points, object._wins, object._losses, object._draws);
    }

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

    get points() {
        return this._points;
    }

    set points(value) {
        this._points = value;
    }

    get wins() {
        return this._wins;
    }

    set wins(value) {
        this._wins = value;
    }

    get losses() {
        return this._losses;
    }

    set losses(value) {
        this._losses = value;
    }

    get draws() {
        return this._draws;
    }

    set draws(value) {
        this._draws = value;
    }

    async buildProfileImage() {
        const index = Math.floor(this.points / 10) > 6 ? 6 : Math.floor(this.points / 10);
        const canvas = Canvas.createCanvas(700, 400);
        const ctx = canvas.getContext('2d');
        const guild = await bot.client.guilds.fetch(guild_id) as Guild;
        const user = await guild.members.fetch(this.id) as GuildMember;
        const background = await Canvas.loadImage("./media/background.png");
        const panel = await Canvas.loadImage("./media/panel.png");
        const gray = await Canvas.loadImage("./media/gray.png");
        const rank = await Canvas.loadImage(`./media/ranks/${index}.png`)
        const r6logo = await Canvas.loadImage("./media/r6logo4.png");
        const avatar = await Canvas.loadImage(user.displayAvatarURL({ format: 'jpg' }));

        ctx.save();
        printImage(ctx, background, 0, 0, canvas.width, canvas.height, 25);
        printImage(ctx, gray, 20, 150, canvas.width - 40, canvas.height - 170, 10)
        printImage(ctx, panel, 24, 154, canvas.width - 48, canvas.height - 178, 10);
        printImage(ctx, r6logo, 645, 12, 35, 35, 1);
        printImage(ctx, rank, 400, 175, 175, 175, 0);

        ctx.fillStyle = "#ffffff";
        ctx.font = '48px sans-serif';
        ctx.fillText(`${this.username}`, canvas.width/5, 65);
        ctx.font = '24px sans-serif';
        ctx.fillText('Purdue University Pro League', canvas.width/5, 115);
        ctx.font = '36px sans-serif';
        ctx.fillStyle = "#080808";
        ctx.fillText(`Points:`, 50, 200);
        ctx.fillText(`Wins:`, 53, 250);
        ctx.fillText(`Losses:`, 50, 300);
        ctx.fillText(`Draws:`, 50, 350);
        ctx.fillText(`${this.points}`, 250, 200);
        ctx.fillText(`${this.wins}`, 250, 250);
        ctx.fillText(`${this.losses}`, 250, 300);
        ctx.fillText(`${this.draws}`, 250, 350);

        ctx.beginPath();
        ctx.arc(74, 74, 54, 0, Math.PI * 2, true);
        ctx.fillStyle = "#ffffff";
        ctx.clip();
        ctx.fill();
        ctx.save();

        ctx.beginPath();
        ctx.arc(74, 74, 50, 0, Math.PI * 2, true);
        ctx.clip();
        ctx.drawImage(avatar, 24, 24, 100, 100);

        return new MessageAttachment(canvas.toBuffer(), 'profile-image.png');
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