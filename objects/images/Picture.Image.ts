import * as Canvas from "canvas";
import {MessageAttachment} from "discord.js";
import ImageUtils from "./ImageUtils";

export default class PictureImage {
    public static async build(color, username): Promise<MessageAttachment> {
        const canvas = Canvas.createCanvas(512, 512);
        const ctx = canvas.getContext('2d');
        const purdueLogo = await Canvas.loadImage("./media/r6purduelogo.png");

        ctx.beginPath();
        ctx.arc(256, 256, 256, 0, 2 * Math.PI, false);
        ctx.fillStyle = `#${color}`;
        ctx.fill();

        ImageUtils.printImage(ctx, purdueLogo, 142.5, 128, 227, 256, 0);

        return new MessageAttachment( canvas.toBuffer(),`${username}-profile.png`);
    }
}