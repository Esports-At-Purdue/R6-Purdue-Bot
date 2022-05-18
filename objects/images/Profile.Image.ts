import * as Canvas from "canvas";
import {bot} from "../../index";
import {GuildMember, MessageAttachment} from "discord.js";
import ImageUtils from "./ImageUtils";
import Player from "../Player";

export default class ProfileImage {
    public static async build(player: Player): Promise<MessageAttachment> {
        const canvas = Canvas.createCanvas(1000, 600);
        const ctx = canvas.getContext('2d');
        const user = await bot.guild.members.fetch(player.id) as GuildMember;
        const avatar = await Canvas.loadImage(user.displayAvatarURL({ format: 'jpg' }));
        const index = Math.floor(player.points / 10) > 6 ? 6 : Math.floor(player.points / 10);
        const background = await Canvas.loadImage("./media/background.png");
        const panel = await Canvas.loadImage("./media/panel.png");
        const gray = await Canvas.loadImage("./media/gray.png");
        const rank = await Canvas.loadImage(`./media/ranks/${index}.png`);
        const r6logo = await Canvas.loadImage("./media/r6logo4.png");

        ImageUtils.printImage(ctx, background, 0, 0, canvas.width, canvas.height, 25);
        ImageUtils.printImage(ctx, gray, 18, 160, canvas.width - 36, canvas.height - 178, 20);
        ImageUtils.printImage(ctx, panel, 24, 166, canvas.width - 48, canvas.height - 190, 20);
        ImageUtils.printImage(ctx, r6logo, canvas.width - 108, 18, 90, 90, 1);
        ImageUtils.printImage(ctx, rank, 600, 250, 175, 175, 0);

        ImageUtils.printText(ctx, `${player.username}`, canvas.width / 5, 80, "#ffffff", "72px sans-serif", "left");
        ImageUtils.printText(ctx, `Purdue University Pro League`, canvas.width / 5, 130, "#ffffff", "36px sans-serif", "left");
        ctx.font = '72px sans-serif';
        ctx.fillStyle = "#080808";
        ctx.fillText(`Rank:`, 50,270);
        ctx.fillText(`Points:`, 50, 355);
        ctx.fillText(`Wins:`, 50, 440);
        ctx.fillText(`Losses:`, 50, 525);
        ctx.textAlign = "center";
        ctx.fillText(`${player.rank}`, 400, 270);
        ctx.fillText(`${player.points}`, 400, 355);
        ctx.fillText(`${player.wins}`, 400, 440);
        ctx.fillText(`${player.losses}`, 400, 525);
        ImageUtils.printAvatar(ctx, avatar, 24, 16, 125)

        return new MessageAttachment( canvas.toBuffer(),`${player.username}-profile.png`);
    }
}