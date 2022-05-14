import Team from "./Team";
import * as config from "../config.json";
import Queue from "./Queue";
import {bot} from "../App";
import {
    CategoryChannel,
    MessageActionRow,
    MessageAttachment,
    MessageEmbed,
    MessageSelectMenu,
    TextChannel
} from "discord.js";
import {collections, updateRankings} from "../database/database.service";
import * as Canvas from "canvas";
import Player from "./Player";
import {DatabaseObject} from "./Interface";

export default class Game implements DatabaseObject {
    private _id: string;
    private _phase: number;
    private _players: Array<object>;
    private _teams: Array<object>;
    private _winner: object;
    private _loser: object;
    private _channel: string;
    private _map: string;

    constructor(id: string, phase: number = 1, players: Array<object> = [], teams: Array<object> = [], winner: object = null, loser: object = null, channel: string = "", map = null) {
        this._id = id;
        this._phase = phase;
        this._players = players;
        this._teams = teams;
        this._winner = winner;
        this._loser = loser;
        this._channel = channel;
        this._map = map ?? config.maps[Math.floor(Math.random() * config.maps.length)];
    }

    static fromObject(object) {
        return new Game(object._id, object._phase, object._players, object._teams, object._winner, object._loser, object._channel, object._map);
    }

    static async create(queue: Queue) {
        let players = [];
        let id = await collections.games.countDocuments() + 1;
        let channel = await Game.createChannel(id);
        await channel.permissionOverwrites.create("637134609053646879", {"VIEW_CHANNEL": false});
        let mentions = ""
        for (let [key] of queue) {
            players.push(await Player.get(key));
            queue.delete(key);
        }
        players = mergeSort(players) as Array<Player>;
        players.forEach(player => {
            console.log(player.username + ": " + player.rank);
            mentions = mentions.concat(`<@!${player.id}> `);
            channel.permissionOverwrites.create(
                player.id, {"SEND_MESSAGES": true}
            )
        });
        let teamOne = await Team.create(players[0], 1);
        let teamTwo = await Team.create(players[1], 2);
        let game = new Game(id.toString(), 1, players.slice(2), [teamOne, teamTwo], null, null, "", null);
        game.channel = channel.id;
        await channel.send({content: `${mentions}`, embeds: [game.toEmbed()]}).then(message => {
            //message.edit({content: "@everyone"})
            channel.send({content: `\n\n<@!${game.teams[0]["players"][0]["_id"]}> please pick the first player!`, components: [game.buildSelectMenu()]});
        });
        await Game.post(game);
    }

    get id(): string {
        return this._id;
    }

    set id(value: string) {
        this._id = value;
    }

    get phase(): number {
        return this._phase;
    }

    set phase(value: number) {
        this._phase = value;
    }

    get players(): Array<object> {
        return this._players;
    }

    set players(value: Array<object>) {
        this._players = value;
    }

    get teams(): Array<object> {
        return this._teams;
    }

    set teams(value: Array<object>) {
        this._teams = value;
    }

    get winner(): object {
        return this._winner;
    }

    set winner(value: object) {
        this._winner = value;
    }

    get loser(): object {
        return this._loser;
    }

    set loser(value: object) {
        this._loser = value;
    }

    get channel(): string {
        return this._channel;
    }

    set channel(value: string) {
        this._channel = value;
    }

    get map(): string {
        return this._map;
    }

    set map(value: string) {
        this._map = value;
    }

    getMapAttachment(): MessageAttachment {
        let mapFileName = this.map.replace(/ /g,"_").toLowerCase();
        return new MessageAttachment(`./maps/${mapFileName}.jpg`);
    }

    public async pick(target: Player, index: number) {
        let response;
        let channel = await bot.guild.channels.fetch(this.channel) as TextChannel;
        let teamOne = Team.fromObject(this.teams[index]);
        let teamTwo = Team.fromObject(this.teams[Math.abs(index - 1)])
        let captainOne = Player.fromObject(teamOne.players[0]);
        let captainTwo = Player.fromObject(teamTwo.players[0]);
        this.players = this.players.filter((object) => object["_id"] != target.id);
        switch (this.players.length + 1) {
            case 8: case 6:
                response ={
                    content: `**${captainOne.username}** has picked **${target.username}**. <@!${captainTwo.id}> please pick two players.`,
                    components: [this.buildSelectMenu()]
                };
                break;
            case 7: case 5:
               response = {
                   content: `**${captainOne.username}** has picked **${target.username}**. <@!${captainOne.id}> please pick another player.`,
                   components: [this.buildSelectMenu()]};
                break;
            case 4: case 3:
                response = {
                    content: `**${captainOne.username}** has picked **${target.username}**. <@!${captainTwo.id}> please pick another player.`,
                    components: [this.buildSelectMenu()]};
                break;
            case 2:
                response = { content: `**${captainOne.username}** has picked **${target.username}**.`};
                break;
            case 1:
                response = {content: `**${captainOne.username}** has received **${target.username}**.`};
                this.phase = 2;
                break;
        }
        teamOne.players.push(target);
        this.teams[index] = teamOne;
        await Team.put(teamOne);
        await Game.put(this);
        await channel.send(response);
    }

    public buildSelectMenu() {
        let actionRow = new MessageActionRow();
        let selectMenu = new MessageSelectMenu().setCustomId(`select_teams`).setPlaceholder('Select a player!');
        let players = this.players;
        for (const object of players) {
            let player = Player.fromObject(object);
            selectMenu.addOptions([
                {
                    label: player.username,
                    value: player.id,
                    emoji: config.emotes.pupl
                }
            ])
        }
        actionRow.addComponents(selectMenu);
        return actionRow;
    }

    static async createChannel(id) {
        const category = await bot.guild.channels.fetch(config.channels.categories.general) as CategoryChannel;
        return await category.createChannel(`game ${id}`);
    }

    async deleteChannel() {
        if (this.channel != null) {
            let channel = await bot.guild.channels.fetch(this.channel);
            await channel.delete();
            this.channel = null;
        }
    }

    async start() {
        this.phase = 2;
        let channel = await bot.guild.channels.fetch(this.channel) as TextChannel;
        let mentions = "";
        let embed = this.toEmbed();
        let attachment = this.getMapAttachment();
        for (let i = 0; i < 2; i ++) {
            let team = Team.fromObject(this.teams[i]);
            await team.createChannel();
            for (let j = 0; j < team.players.length; j++) {
                let player = Player.fromObject(team.players[j]);
                mentions = mentions = mentions.concat(`<@!${player.id}> `);
            }
        }
        await channel.send({content: `${mentions}`, embeds: [embed], files: [attachment]});
    }

    async sub(sub: Player, target: Player): Promise<boolean> {
        let response = false;
        for (let i = 0; i < this.players.length; i++) {
            let player = Player.fromObject(this._players[i]);
            if (target.id == player.id) {
                this._players.splice(i, 1);
                this._players.push(sub)
                await Game.put(this);
                return true;
            }
        }
        response = await Team.fromObject(this.teams[0]).sub(sub, target) ? true : response;
        response = await Team.fromObject(this.teams[0]).sub(sub, target) ? true : response;
        return response;
    }

    async end(code: number) {
        let channel = await bot.guild.channels.fetch(config.channels["10mans"]) as TextChannel;
        this.phase = 0;
        await (await Team.get(this.teams[0]["_id"])).deleteChannel();
        await (await Team.get(this.teams[1]["_id"])).deleteChannel();
        switch (code) {
            case 0: case 1:
                let winner = Team.fromObject(this.teams[code]);
                let loser = Team.fromObject(this.teams[Math.abs(code - 1)]);
                this.winner = winner;
                this.loser = loser;
                await winner.setWinner();
                await loser.setLoser();
                await channel.send({content: `Team ${code + 1} has won Game ${this.id}.`, embeds: [this.toEmbed()]});
                break;
            case 2:
                await channel.send({content: `Game ${this.id} has been called a draw.`, embeds: [this.toEmbed()]});
        }
        await this.deleteChannel();
        await updateRankings();
        await Game.put(this);
    }

    toEmbed(): MessageEmbed {
        let embed = new MessageEmbed()
            .setTitle(`Game ${this.id} - Purdue University Pro League`)

        for (let i = 0; i < 2; i++) {
            const team = Team.fromObject(this.teams[i]);
            let  title = `Team ${team.index}`;
            if (this.winner != null) title = team.id == Team.fromObject(this.winner).id ? `WINNER - Team ${team.index}` : title;
            let description = `Captain: <@!${Player.fromObject(team.players[0]).id}>`;
            for (let j = 1; j < 5; j++) {
               if (team.players[j]) description = description.concat(`\nPlayer: <@!${Player.fromObject(team.players[j]).id}>`);
            }
            embed.addField(title, description, true);
        }

        switch(this.phase) {
            case 0: embed.setColor("GREEN");
                break
            case 1: embed.setColor("RED");
                break;
            case 2:
                let mapFileName = this.map.replace(/ /g,"_").toLowerCase();
                embed.setColor("ORANGE");
                embed.setImage(`attachment://${mapFileName}.jpg`);
                break;
        }
        return embed;
    }

    public async toImage(): Promise<MessageAttachment> {
        let font = "px sans-serif";
        const canvas = Canvas.createCanvas(500, 554);
        const ctx = canvas.getContext('2d');
        const background = await Canvas.loadImage("./media/background.png");
        const panel = await Canvas.loadImage("./media/panel.png");
        const gray = await Canvas.loadImage("./media/gray.png");
        const r6logo = await Canvas.loadImage("./media/r6logo4.png");
        const purdueLogo = await Canvas.loadImage("./media/r6purduelogo.png");
        const map = await Canvas.loadImage(`./maps/${this.map.replace(/ /g,"_").toLowerCase()}.jpg`);

        printImage(ctx, background, 0, 0, canvas.width, canvas.height, 10);
        printImage(ctx, gray, 10, 75, canvas.width - 20, canvas.height - 85, 10);
        printImage(ctx, panel, 13, 78, canvas.width - 26, canvas.height - 360, 10);
        printImage(ctx, purdueLogo, 15, 10, 50, 54, 0);
        printImage(ctx, r6logo, canvas.width - 70, 8, 60, 60, 0);
        printImage(ctx, map, 13, 275, 474, 266, 10);
        printText(ctx, `Game ${this.id}`, canvas.width / 2, 40, "#ffffff", `32${font}`, "center");
        printText(ctx, `Purdue University Pro League`, canvas.width / 2, 64, "#ffffff", `20${font}`, "center");

        if (this.phase == 0) {
            if (this.winner && this.loser) {
                let winner = Team.fromObject(this.winner);
                let loser = Team.fromObject(this.loser);
                for (let i = 0; i < 5; i++) {
                    let winnerPlayer = Player.fromObject(winner.players[i]);
                    let loserPlayer = Player.fromObject(loser.players[i]);
                    console.log(winnerPlayer.username);
                    console.log(loserPlayer.username)
                    let winnerAvatar = await Canvas.loadImage((await bot.guild.members.fetch(winnerPlayer.id)).user.displayAvatarURL({ format: 'jpg' }));
                    let loserAvatar = await Canvas.loadImage((await bot.guild.members.fetch(loserPlayer.id)).user.displayAvatarURL({ format: 'jpg' }));
                    printAvatar(ctx, winnerAvatar, canvas.width / 5, 135 + i * 30);
                    printAvatar(ctx, loserAvatar, canvas.width - canvas.width / 5, 135 + i * 25);
                }
            } else {
                for (let i = 0; i < 2; i++) {
                    let team = Team.fromObject(this.teams[i]);
                    printText(ctx, `Draw`, canvas.width / 4 + i * (canvas.width / 2), 110, "#000000", `28${font}`, "center");
                    for (let j = 0; j < 5; j++) {
                        let player = Player.fromObject(team.players[j]);
                        let avatar = await Canvas.loadImage((await bot.guild.members.fetch(player.id)).user.avatarURL({format: "jpg"}));
                        printAvatar(ctx, avatar, i, j);
                        printText(ctx, player.username, canvas.width / 4 + i * (canvas.width / 2), 135 + j * 25, "#000000", `24${font}`, "center");
                    }
                }
            }
        } else {

        }



        return (new MessageAttachment(canvas.toBuffer(), `game-${this._id}.png`));
    }

    async save(): Promise<boolean> {
        await Game.put(this);
        return true;
    }

    async delete(): Promise<boolean> {
        await Game.delete(this);
        return true;
    }

    static async get(id: string) {
        try {
            const query = { _id: id };
            const game = Game.fromObject(await collections.games.findOne(query));

            if (game) {
                return game;
            }
        } catch (error) {
            return undefined;
        }
    }

    static async post(game: Game) {
        try {
            const newGame = (game);
            // @ts-ignore
            return await collections.games.insertOne(newGame);

        } catch (error) {
            console.error(error);
            return undefined;
        }
    }

    static async put(game: Game) {
        await collections.games.updateOne({ _id: (game.id) }, { $set: game });
    }

    static async delete(game: Game) {
        await collections.games.deleteOne({ _id: (game.id) });
    }
}

function mergeSort(players: Array<Player>) {
    const half = players.length / 2

    if (players.length < 2){
        return players
    }

    const left = players.splice(0, half)
    return merge(mergeSort(left),mergeSort(players))
}

function merge(left: Array<Player>, right: Array<Player>) {
    let arr = []
    let list = config.players;
    while (left.length && right.length) {
        let leftIndex = list.indexOf(left[0].id);
        let rightIndex = list.indexOf(right[0].id);
        if (leftIndex > rightIndex) {
            arr.push(left.shift())
        } else if (rightIndex > leftIndex) {
            arr.push(right.shift())
        } else {
            if (left[0].rank < right[0].rank) {
                arr.push(left.shift())
            } else {
                arr.push(right.shift())
            }
        }
    }
    return [ ...arr, ...left, ...right ]
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

function printAvatar(ctx, avatar, row, column) {
    ctx.beginPath();
    ctx.arc(row + 12.5, column + 12.5, 13, 0, Math.PI * 2, true);
    ctx.fillStyle = "#ffffff";
    ctx.clip();
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(row + 12.5, column + 12.5, 12.5, 0, Math.PI * 2, true);
    ctx.fillStyle = "#000000";
    ctx.clip();
    ctx.fill();
    ctx.save();
    ctx.drawImage(avatar, row, column, 25, 25);
}