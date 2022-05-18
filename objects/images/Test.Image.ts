import {GuildMember, MessageAttachment} from "discord.js";
import * as Canvas from "canvas";
import {bot} from "../../index";
import ImageUtils from "./ImageUtils";

export default class TestImage {
    public static async build(id): Promise<MessageAttachment> {
        const canvas = Canvas.createCanvas(1000, 1000);
        const ctx = canvas.getContext('2d');
        const user = await bot.guild.members.fetch(id) as GuildMember;
        const avatar = await Canvas.loadImage(user.displayAvatarURL({ format: 'jpg' }));
        const background = await Canvas.loadImage("./media/background.png");

        ImageUtils.printImage(ctx, background, 0, 0, canvas.width, canvas.height, 25);

        ImageUtils.printAvatar(ctx, avatar, 235, 566, 400);

        return new MessageAttachment(canvas.toBuffer(),`test.png`);
    }
}