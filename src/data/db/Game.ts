import {collections} from "../../services/database.service";
import Queue from "../Queue";
import {bot} from "../../App";
import {
    CategoryChannel, MessageActionRow,
    MessageEmbed, MessageSelectMenu,
    SelectMenuInteraction, TextChannel
} from "discord.js";
import {guild_id, game_category} from "../../channels.json";
import * as maps from '../../maps.json';
import Team from "./Team";
import {userMention} from "@discordjs/builders";
import Player from "./Player";

export default class Game {
    private _id: string;
    private _phase: number;
    private _players: Array<string>;
    private _teams: Array<string>;
    private _winner: number;
    private _channel: string;
    private _map: string;

    constructor(id: string, phase: number = 1, players = [], teams: [] = [], winner = null, channel = "", map = "") {
        this._id = id;
        this._phase = phase;
        this._players = players;
        this._teams = teams;
        this._winner = winner;
        this._channel = channel;
        this._map = map;
    }

    static fromObject(object) {
        return new Game(object._id, object._phase, object._players, object._teams, object.winner, object._channel, object._map);
    }

    get id(): string {
        return this._id;
    }

    set id(value:string) {
        this._id = value;
    }

    get phase(): number {
        return this._phase;
    }

    set phase(value: number) {
        this._phase = value;
    }

    get players(): Array<string> {
        return this._players;
    }

    set players(value: Array<string>) {
        this._players = value;
    }

    get teams(): Array<string> {
        return this._teams;
    }

    set teams(value: Array<string>) {
        this._teams = value;
    }

    get winner(): number {
        return this._winner;
    }

    set winner(value: number) {
        this._winner = value;
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

    async begin() {
        let message = "";
        this.map = this.pickMap();
        const embed = await this.buildEmbed(true);
        const guild = await bot.client.guilds.fetch(guild_id);
        const channel = await guild.channels.fetch(this.channel) as TextChannel;
        this.players.forEach(player => { message = message.concat(`${userMention(player)} `) });
        for (let i = 0; i < 2; i++) {
            const team = await Team.get(this.teams[i]);
            await team.setChannelPerms();
        }
        await channel.send({content: message, embeds: [embed]});
    }

    async setDraw() {
        if (this.phase == 0) {
            for (let i = 0; i < 2; i++) {
                const team = await Team.get(this.teams[i]);
                if (team.index == this.winner) {
                    for (const playerId of team.players) {
                        const player = await Player.get(playerId);
                        player.points -= 10;
                        player.wins -= 1;
                        player.draws += 1;
                        await Player.put(player);
                    }
                } else {
                    for (const playerId of team.players) {
                        const player = await Player.get(playerId);
                        player.points += 7;
                        player.losses -= 1;
                        player.draws += 1;
                        await Player.put(player);
                    }
                }
            }
        } else {
            this.phase = 0;
            for (const playerId of this.players) {
                const player = await Player.get(playerId);
                player.draws += 1;
                await Player.put(player);
            }
        }
    }

    async setWinner(index: number) {
        this.winner = index;
        this.phase = 0;
        await Game.put(this);

        for (let i = 0; i < 2; i++) {
            const team = await Team.get(this.teams[i]);
            if (team.index == index) {
                for (const playerId of team.players) {
                    const player = await Player.get(playerId);
                    player.points += 10;
                    player.wins += 1;
                    await Player.put(player);
                }
            } else {
                for (const playerId of team.players) {
                    const player = await Player.get(playerId);
                    player.points -= player.points > 7 ? 7 : player.points;
                    player.losses += 1;
                    await Player.put(player);
                }
            }
        }
    }

    pickMap() {
        const maps = ["Bank", "Chalet", "Clubhouse", "Coastline", "Kafe Dostoyevsky", "Oregon", "Villa"];
        let random = Math.floor(Math.random() * maps.length);
        return maps[random];
    }

    async createChannel() {
        let message = "";
        const guild = await bot.client.guilds.fetch(guild_id);
        const category = await guild.channels.fetch(game_category) as CategoryChannel;
        const channel = await category.createChannel(`Game ${this.id}`, {type: "GUILD_TEXT", permissionOverwrites: [{id: guild.id, deny: ["VIEW_CHANNEL"]}]});
        this.channel = channel.id;
        this.players.forEach(player => { message = message.concat(`${userMention(player)} `) });
        await this.setChannelPerms();
        await channel.send({content: message, embeds: [await this.buildEmbed()]});
        await channel.send({content: `${userMention(this.players[0])} please pick first!`, components: [await this.buildSelectMenu()]});
    }

    async setChannelPerms() {
        const guild = await bot.client.guilds.fetch(guild_id);
        const channel = await guild.channels.fetch(this.channel) as TextChannel;
        await channel.permissionOverwrites.set([{id: guild.id, deny: ["VIEW_CHANNEL"]}]);
        for (const id of this.players) {
            const member = await guild.members.fetch(id);
            await channel.permissionOverwrites.create(member, {
                VIEW_CHANNEL: true, SEND_MESSAGES: true, READ_MESSAGE_HISTORY: true, USE_APPLICATION_COMMANDS: true
            });
        }
        for (let i = 0; i < 2; i++) {
            const team = await Team.get(this.teams[i]);
            await team.setChannelPerms();
        }
    }

    async deleteChannels() {
        const guild = await bot.client.guilds.fetch(guild_id);
        const channel = await guild.channels.fetch(this.channel);
        await channel.delete();

        for (let i = 0; i < 2; i++) {
            const team = await Team.get(this.teams[i]);
            await team.deleteChannel();
        }
    }

    async createTeams() {
        const captainOne = this.players[0];
        const captainTwo = this.players[1];
        const teamOne = await Team.create(captainOne, 1) as Team;
        const teamTwo = await Team.create(captainTwo, 2) as Team;
        this.teams.push(teamOne.id, teamTwo.id);
    }

    async buildEmbed(final = false) {
        const embed = new MessageEmbed().setTitle(`Game ${this.id} - Purdue University Pro League`).setColor("GOLD").setTimestamp(new Date());

        for (let i = 0; i < 2; i++) {
            const team = await Team.get(this.teams[i]);
            const title = team.index == this.winner ? `WINNER - Team ${team.index}` : `Team ${team.index}`;
            let description = `Captain: ${userMention(team.captain)}`;
            for (const player of team.players) {
                description = player == team.captain ? description : description.concat(`\nPlayer: ${userMention(player)}`);
            }
            embed.addField(title, description, true);
        }

        if (final) {
            embed.setColor("GREEN");
            embed.addField("Map", this.map, true);
            embed.setImage(maps[`${this.map.replace(/ /g,"_").toLowerCase()}`]);
        }

        return embed;
    }

    async subPlayer(sub: Player, target: Player) {
        for (let i = 0; i < 2; i++) {
            const team = await Team.get(this.teams[i]);
            for (let j = 0; j < 5; j++) {
                let playerId = team.players[j];
                if (team.captain == target.id) team.captain = sub.id;
                if (target.id == playerId) {
                    team.players.splice(j, 1);
                    team.players.push(sub.id);
                    await Team.put(team);
                }
            }
        }

        for (let i = 0; i < 10; i ++) {
            let playerId = this.players[i];
            if (playerId == target.id) {
                this.players.splice(i, 1);
                this.players.push(sub.id);
            }
        }

        await Game.put(this);
    }

    async contains(player: Player) {
        for (let i = 0; i < 2; i++) {
            const team = await Team.get(this.teams[i]);
            for (const playerId of team.players) {
                if (player.id == playerId) return true;
            }
        }
        return false;
    }

    async pick(interaction: SelectMenuInteraction, captainId: string, playerId: string) {
        const phase = this.phase;
        const player = await Player.get(playerId);
        const captain = await Player.get(captainId);
        let isCaptain = false;
        let teamOne = await Team.get(this.teams[0]);
        let teamTwo = await Team.get(this.teams[1]);
        let team;

        for (let i = 0; i < 2; i++) {
            team = await Team.get(this.teams[i]) as Team;
            if (captain.id == team.captain) {
                isCaptain = true;
                break;
            }
        }

        try {
            if (isCaptain) {
                switch (phase) {
                    case 1:
                        if (team.index == 1) {
                            team.players.push(player.id);
                            this.phase = 2;
                            await Game.put(this);
                            await Team.put(team);
                            await interaction.channel.send({
                                content: `**${captain.username}** has picked **${player.username}**. ${userMention(teamTwo.captain)} please pick 2 players.`,
                                components: [await this.buildSelectMenu()]
                            })
                            await interaction.update({components: []});
                        } else {
                            await interaction.reply({content: "It is not your turn to pick", ephemeral: true});
                        }
                        break;

                    case 2:
                        if (team.index == 2) {
                            team.players.push(player.id);
                            this.phase = team.players.length > 2 ? 3 : 2;
                            await Game.put(this);
                            await Team.put(team);
                            const menu = await this.buildSelectMenu();
                            await interaction.update({components: []});
                            if (this.phase > 2) {
                                await interaction.channel.send({
                                    content: `**${captain.username}** has picked **${player.username}**. ${userMention(teamOne.captain)} please pick 2 players.`,
                                    components: [menu]
                                });
                            } else {
                                await interaction.channel.send({content: `**${captain.username}** has picked **${player.username}**. They have 1 pick remaining.`,
                                    components: [menu]
                                });
                            }

                        } else {
                            await interaction.reply({content: "It is not your turn to pick.", ephemeral: true});
                        }
                        break;

                    case 3:
                        if (team.index == 1) {
                            team.players.push(player.id);
                            this.phase = team.players.length > 3 ? 4 : 3;
                            await Game.put(this);
                            await Team.put(team);
                            const menu = await this.buildSelectMenu();
                            await interaction.update({components: []});
                            if (this.phase > 3) {
                                await interaction.channel.send({
                                    content: `**${captain.username}** has picked **${player.username}**. ${userMention(teamTwo.captain)} please pick 1 player.`,
                                    components: [menu]
                                });
                            } else {
                                await interaction.channel.send({content: `**${captain.username}** has picked **${player.username}**. They have 1 pick remaining.`,
                                    components: [menu]
                                });
                            }
                        } else {
                            await interaction.reply({content: "It is not your turn to pick", ephemeral: true});
                        }
                        break;

                    case 4:
                        if (team.index == 2) {
                            team.players.push(player.id);
                            this.phase = 5;
                            await Game.put(this);
                            await Team.put(team);
                            const menu = await this.buildSelectMenu();
                            await interaction.update({components: []});
                            await interaction.channel.send({
                                content: `**${captain.username}** has picked **${player.username}**. ${userMention(teamOne.captain)} please pick 1 player.`,
                                components: [menu]
                            })
                        } else {
                            await interaction.reply({content: "It is not your turn to pick.", ephemeral: true});
                        }
                        break;

                    case 5:
                        if (team.index == 1) {
                            team.players.push(player.id);
                            this.phase = -1;
                            await Game.put(this);
                            await Team.put(team);
                            const lastPlayer = await  Player.get ((await this.getAvailablePlayers())[0]);
                            teamTwo.players.push(lastPlayer.id);
                            await Team.put(teamTwo);
                            await interaction.update({components: []});
                            await interaction.channel.send({
                                content: `**${captain.username}** has picked **${player.username}**. ${userMention(teamTwo.captain)} has received **${lastPlayer.username}**.`
                            })
                            await this.begin();
                        } else {
                            await interaction.reply({content: "It is not your turn to pick.", ephemeral: true});
                        }
                        break;

                    default:
                        await interaction.reply({content: "The pick phase has ended.", ephemeral: true});
                }

            } else {
                await interaction.reply({content: "You must be a captain to use this.", ephemeral: true});
            }
        } catch (error) {
            console.log(error);
        }
    }

    async buildSelectMenu() {
        let actionRow = new MessageActionRow();
        let selectMenu = new MessageSelectMenu().setCustomId(`select_teams`).setPlaceholder('Select a player!');
        const players = await this.getAvailablePlayers();
        for (const playerId of players) {
            const player = await Player.get(playerId);
            selectMenu.addOptions([
                {
                    label: player.username,
                    value: player.id
                }
            ])
        }
        actionRow.addComponents(selectMenu);
        return actionRow;
    }

    async getAvailablePlayers() {
        const allPlayers = [];
        this.players.forEach(player => {allPlayers.push(player)});
        for (let i = 0; i < 2; i++) {
            const team = await Team.get(this.teams[i]);
            team.players.forEach(player => {
                for (let j = 0; j < allPlayers.length; j++) {
                    player == allPlayers[j] ? allPlayers.splice(j, 1) : 0;
                }
            })
        }
        return allPlayers;
    }

    static async start(queue: Queue) {
        const id = await collections.games.countDocuments() + 1;
        const players = [];
        await queue.sort(function(playerOne,playerTwo) {
            if (playerOne.points < playerTwo.points) return 1;
            if (playerTwo.points < playerOne.points) return -1;
            return 0;
        });
        queue.forEach(player => {
            players.push(player.id);
        })

        const game = new Game(id.toString(), 1, players);
        await game.createTeams();
        await game.createChannel();
        await Game.post(game);
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