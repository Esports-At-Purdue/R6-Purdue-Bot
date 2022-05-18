import { CanvasRenderingContext2D, Image } from "canvas";

export default class ImageUtils {
    public static printText
    (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, font: string, alignment: CanvasTextAlign) {
        ctx.fillStyle = color;
        ctx.textAlign = alignment;
        ctx.font = font;
        ctx.fillText(text, x, y);
    }

    private static roundedImage
    (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
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

    public static printImage
    (ctx: CanvasRenderingContext2D, image: Image, x: number, y: number, width: number, height: number, radius: number) {
        ImageUtils.roundedImage(ctx, x, y, width, height, radius);
        ctx.clip();
        ctx.drawImage(image, x, y, width, height);
        ctx.restore();
        ctx.save();
    }

    public static printAvatar(ctx: CanvasRenderingContext2D, avatar: Image, x, y, d) {
        ctx.beginPath();
        ctx.arc(x + d / 2, y + d / 2, d / 2, 0, Math.PI * 2, true);
        ctx.fillStyle = "#ffffff";
        ctx.clip();
        ctx.fill();
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + d / 2, y + d / 2, d / 2.1, 0, Math.PI * 2, true);
        ctx.fillStyle = "#000000";
        ctx.clip();
        ctx.fill();
        ctx.drawImage(avatar, x, y, d / 1, d / 1);
    }
}