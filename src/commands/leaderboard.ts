import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, Guild, GuildMember, MessageAttachment, Snowflake} from "discord.js";
import {server_roles} from "../roles.json";
import Player from "../data/db/Player";
import {collections} from "../services/database.service";
import * as Canvas from "canvas";
import {bot} from "../App";
import {guild_id} from "../channels.json";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Command to display the PUPL Leaderboard')
        .setDefaultPermission(false)
        .addIntegerOption((option) => option
            .setName('page')
            .setDescription('The page of the leaderboard')
            .setRequired(false)
        )
    ,

    async execute(interaction: CommandInteraction) {
        await interaction.deferReply();
        let page = interaction.options.getInteger('page');
        page = page ? page : 1;

        let offset = (page - 1) * 10;

        const canvas = Canvas.createCanvas(1600, 2112);
        const ctx = canvas.getContext('2d');
        const guild = await bot.client.guilds.fetch(guild_id) as Guild;
        const background = await Canvas.loadImage("./media/background.png");
        const panel = await Canvas.loadImage("./media/panel.png");
        const gray = await Canvas.loadImage("./media/gray.png");
        const r6logo = await Canvas.loadImage("./media/r6logo4.png");
        const purduelogo = await Canvas.loadImage("./media/r6purduelogo.png");
        const players = (await collections.players.find().sort({_points: -1, _wins: -1, _id: 1}).skip(offset).limit(10).toArray());

        printImage(ctx, background, 0, 0, canvas.width, canvas.height, 50);
        printImage(ctx, r6logo, 1472, 32, 80, 80, 1);
        printImage(ctx, purduelogo, 100, 40, 200, 220, 1);
        printImage(ctx, gray, 48, 300, canvas.width - 96, canvas.height - 348, 20)
        printImage(ctx, panel, 64, 316, canvas.width - 128, canvas.height - 380, 20);
        ctx.fillStyle = "#ffffff";
        ctx.font = '116px sans-serif';
        ctx.fillText(`Leaderboard`, 340, 128);
        ctx.font = '64px sans-serif';
        ctx.fillText(`Purdue University Pro League`, 340, 240);
        ctx.fillStyle = "#080808";
        ctx.font = '104px sans-serif';
        ctx.fillText(`Ranks ${offset + 1}-${offset + 10}`, 96, 436);
        ctx.fillText(`Points`, 850, 436);
        ctx.fillText(`Rank`, 1250, 436);

        for (let i = 0; i < players.length; i++) {

            try {
                let player = Player.fromObject(players[i]);
                let index = Math.floor(player.points / 10) > 6 ? 6 : Math.floor(player.points / 10);
                let user = await guild.members.fetch(player.id) as GuildMember;
                ctx.fillStyle = "#080808";
                ctx.font = '90px sans-serif';
                ctx.fillText(`${player.username}`, 250, (588 + (i * 156)));
                ctx.textAlign = 'center';
                ctx.fillText(`${player.points}`, 1000, (588 + (i * 156)));
                const avatar = await Canvas.loadImage(user.displayAvatarURL({format: 'jpg'}));

                const rank = await Canvas.loadImage(`./media/ranks/${index}.png`);
                printImage(ctx, rank, 1320, (478 + (i * 156)),125, 125, 0);

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
        await interaction.editReply({files: [attachment]});
    },

    async setPermissions(commandId: Snowflake, guild: Guild) {
        let commandPermissionsManager = guild.commands.permissions;

        await commandPermissionsManager.set({
            command: commandId,
            permissions: [
                {
                    id: server_roles["verified"]["id"],
                    type: 'ROLE',
                    permission: true
                },
            ]
        })
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