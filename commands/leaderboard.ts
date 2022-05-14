import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, GuildMember, MessageAttachment} from "discord.js";
import * as Canvas from "canvas";
import {collections, updateRankings} from "../database/database.service";
import Player from "../objects/Player";
import {bot} from "../App";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Displays the PUPL Leaderboard')
        .setDefaultPermission(true)
        .addIntegerOption((option) => option
            .setName('page')
            .setDescription('The page of the leaderboard')
            .setRequired(false)
        ),

    async execute(interaction: CommandInteraction) {
        let page = interaction.options.getInteger('page');
        page = page ? page : 1;

        await updateRankings();
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

        printImage(ctx, background, 0, 0, canvas.width, canvas.height, 50);
        // printImage(ctx, r6logo, 1472, 32, 80, 80, 1);
        printImage(ctx, r6logo, 1652, 32, 200, 200, 1);
        printImage(ctx, purdueLogo, 60, 40, 160, 180, 1);
        printImage(ctx, gray, 48, 300, canvas.width - 96, canvas.height - 348, 20)
        printImage(ctx, panel, 64, 316, canvas.width - 128, canvas.height - 380, 20);
        printText(ctx, "Leaderboard", canvas.width / 2, 128, "#ffffff", "116px sans-serif", "center");
        printText(ctx, "Purdue University Pro League", canvas.width / 2, 240, "#ffffff", "64px sans-serif", "center");
        printText(ctx, `Ranks ${offset + 1}-${offset + 10}`, 350, 436, "#080808", "104px sans-serif", "center");
        printText(ctx, `Points`, 1300, 436, "#080808", "104px sans-serif", "center");
        printText(ctx, `Rank`, 1680, 436, "#080808", "104px sans-serif", "center");

        for (let i = 0; i < players.length; i++) {
            try {
                let player = Player.fromObject(players[i]);
                let index = Math.floor(player.points / 10) > 6 ? 6 : Math.floor(player.points / 10);
                let user = await bot.guild.members.fetch(player.id) as GuildMember;
                printText(ctx, player.username, 250, 588 + (i * 156), "#080808", "90px sans-serif","left");
                printText(ctx, `${player.points}`, 1300, 588 + (i * 156), "#080808", "90px sans-serif","center");
                const avatar = await Canvas.loadImage(user.displayAvatarURL({format: 'jpg'}));
                const rank = await Canvas.loadImage(`./media/ranks/${index}.png`);
                printImage(ctx, rank, 1620, (484 + (i * 156)),125, 125, 0);
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

        let attachment = new MessageAttachment(canvas.toBuffer(), 'leaderboard.png');
        return ({content: `<@${interaction.user.id}>`, files: [attachment]});
    },
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