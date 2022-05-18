import {GuildMember, MessageAttachment} from "discord.js";
import * as Canvas from "canvas";
import {collections} from "../../database/database.service";
import ImageUtils from "./ImageUtils";
import Player from "../Player";
import {bot} from "../../index";

export default class LeaderboardImage {
    public static async build(page: number): Promise<MessageAttachment> {
        let offset = (page - 1) * 10;

        // const canvas = Canvas.createCanvas(1600, 2112);
        const canvas = Canvas.createCanvas(1912, 2112);
        const ctx = canvas.getContext('2d');
        const background = await Canvas.loadImage("./media/background.png");
        const panel = await Canvas.loadImage("./media/panel.png");
        const gray = await Canvas.loadImage("./media/gray.png");
        const r6logo = await Canvas.loadImage("./media/r6logo4.png");
        const purdueLogo = await Canvas.loadImage("./media/r6purduelogo.png");
        const players = (await collections.players.find().sort({_rank: 1}).skip(offset).limit(10).toArray());

        ImageUtils.printImage(ctx, background, 0, 0, canvas.width, canvas.height, 50);
        // ImageUtils.printImage(ctx, r6logo, 1472, 32, 80, 80, 1);
        ImageUtils.printImage(ctx, r6logo, 1652, 32, 200, 200, 1);
        ImageUtils.printImage(ctx, purdueLogo, 60, 40, 160, 180, 1);
        ImageUtils.printImage(ctx, gray, 48, 300, canvas.width - 96, canvas.height - 348, 20)
        ImageUtils.printImage(ctx, panel, 64, 316, canvas.width - 128, canvas.height - 380, 20);
        ImageUtils.printText(ctx, "Leaderboard", canvas.width / 2, 128, "#ffffff", "116px sans-serif", "center");
        ImageUtils.printText(ctx, "Purdue University Pro League", canvas.width / 2, 240, "#ffffff", "64px sans-serif", "center");
        ImageUtils.printText(ctx, `Ranks ${offset + 1}-${offset + 10}`, 350, 436, "#080808", "104px sans-serif", "center");
        ImageUtils.printText(ctx, `Points`, 1300, 436, "#080808", "104px sans-serif", "center");
        ImageUtils.printText(ctx, `Rank`, 1680, 436, "#080808", "104px sans-serif", "center");

        for (let i = 0; i < players.length; i++) {
            try {
                let player = Player.fromObject(players[i]);
                let index = Math.floor(player.points / 10) > 6 ? 6 : Math.floor(player.points / 10);
                let user = await bot.guild.members.fetch(player.id) as GuildMember;
                ImageUtils.printText(ctx, player.username, 250, 588 + (i * 156), "#080808", "90px sans-serif","left");
                ImageUtils.printText(ctx, `${player.points}`, 1300, 588 + (i * 156), "#080808", "90px sans-serif","center");
                const avatar = await Canvas.loadImage(user.displayAvatarURL({format: 'jpg'}));
                const rank = await Canvas.loadImage(`./media/ranks/${index}.png`);
                ImageUtils.printImage(ctx, rank, 1620, (484 + (i * 156)),125, 125, 0);
                ctx.fillStyle = "#000000";
                ctx.beginPath();
                ctx.arc(156, (556 + (i * 156)), 64, 0, Math.PI * 2, true);
                ctx.fillStyle = "#ffffff";
                ctx.clip();
                ctx.fill();
                ctx.beginPath();
                ctx.arc(156, (556 + (i * 156)), 60, 0, Math.PI * 2, true);
                ctx.clip();
                ctx.drawImage(avatar, 96, (496 + (i * 156)), 120, 120);
                ctx.restore();
                ctx.save();
            } catch (error) {
                console.log(error);
            }
        }
        return new MessageAttachment(canvas.toBuffer(), 'leaderboard.png');
    }
}