import {DataTypes, Model} from "sequelize";
import {sequelize} from "./Database";
import {app, sendLogToDiscord} from "../../index";
import {Team} from "./Team";
import {MessageEmbed, Snowflake, TextChannel} from "discord.js";
import {R6Map} from "../data_types/R6Map";
import * as maps from '../../maps.json';
import {Log, LogType} from "../data_types/Log";
import {User} from "./User";

class Game extends Model {
    private id: string;
    private channel: string;
    private teams: string;
    private members: string;
    private freeMembers: number;
    private map: string;
    public winner: string;
    private index: number;
    private status: number;

    getId() {
        return this.id;
    }

    setId(snowflake: Snowflake) {
        this.id = snowflake;
    }

    getMap() {
        return this.map;
    }

    setMap(map: R6Map) {
        this.map = map.name;
    }

    getIndex() {
        return this.index;
    }

    setIndex(index: number) {
        this.index = index;
    }

    getStatus() {
        return this.status;
    }

    setStatus(status: number) {
        this.status = status;
    }

    async getWinner() {
        return await Team.findByPk(this.winner);
    }

    setWinner(team: Team) {
        this.winner = team.getId();
    }

    getFreeMembers() {
        return this.freeMembers;
    }

    setFreeMembers(members: number) {
        this.freeMembers = members;
    }

    async getChannel() {
        return await app.guild.channels.fetch(this.channel);
    }

    setChannel(channel: TextChannel) {
        this.channel = channel.id;
    }

    async getMembers() {
        let members = new Array<User>();
        for (const snowflake of this.members.split(',')) {
            let member = await User.findByPk(snowflake);
            members.push(member);
        }
        return members;
    }

    setMembers(members: Array<User>) {
        let ids = new Array<string>();
        members.forEach(member => {
            ids.push(member.getId());
        })
        this.members = ids.toString();
    }

    async getTeams() {
        let teams = new Array<Team>();
        for (const snowflake of this.teams.split(',')) {
            let team = await Team.findByPk(snowflake);
            teams.push(team);
        }
        return teams;
    }

    setTeams(teams: Array<Team>) {
        let ids = [];
        teams.forEach(team => {
            ids.push(team.getId());
        })
        this.teams = ids.toString();
    }

    async createEmbed() {
        let embed = new MessageEmbed().setTitle(`Game ${this.index} - Purdue University Pro League`).setColor("GOLD").setTimestamp(new Date());

        let winner = this.winner;
        let teams = await this.getTeams();
        let members = await this.getMembers();
        let freeMembers = this.getFreeMembers();

        for (const team of teams) {
            let fieldTitle = `Team ${team.getIndex()}`;
            fieldTitle = winner === team.getId() ? `WINNER - Team ${team.getIndex()}` : `Team ${team.getIndex()}`;
            let captain = await team.getCaptain();
            let fieldDescription = String(`Captain: ${await app.guild.members.fetch(captain.getId())}`);
            let teamMembers = await team.getMembers();
            for (const teamMember of teamMembers) {
                if (teamMember.getId() !== captain.getId()) {
                    members = members.filter(member => member.getId() !== teamMember.getId());
                    fieldDescription = fieldDescription.concat(`\nPlayer: ${await app.guild.members.fetch(teamMember.getId())}`);
                }
            }
            members.splice(0, 1);
            embed.addField(fieldTitle, fieldDescription, true);
        }
        if (freeMembers > 0) {
            let fieldDescription = String("");
            for (const member of members) {
                fieldDescription = fieldDescription.concat(`${await app.guild.members.fetch(member.getId())}\n`);
            }

            embed.addField("**Remaining Players**", fieldDescription, false);
        } else {
            embed.setColor("GREEN");
            embed.addField("**Map**", this.map, false);
            embed.setImage(maps[`${this.map.replace(/ /g,"_").toLowerCase()}`]);
        }

        return embed;
    }
}

Game.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    status: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    members: DataTypes.STRING,
    channel: DataTypes.STRING,
    index: DataTypes.INTEGER,
    freeMembers: DataTypes.INTEGER,
    teams: DataTypes.STRING,
    map: DataTypes.STRING,
    winner: DataTypes.STRING
}, {
    sequelize,
    modelName: 'game'
})

Game.addHook('beforeCreate', async (game: Game) => {
    await sendLogToDiscord(new Log(LogType.DATABASE_UPDATE, `New Game Created:\nIndex: **${game.getIndex()}**\nId: ${game.getId()}`))
})

Game.addHook('beforeUpdate', async (game: Game) => {
    let freeMembers = game.getFreeMembers();
    if (freeMembers === 0) {
        try {
            let teams = await game.getTeams();
            await app.teamManager.setChannelPermissions(await teams[0].getChannel(), await teams[0].getMembers());
            await app.teamManager.setChannelPermissions(await teams[1].getChannel(), await teams[1].getMembers());
        } catch (error) {}
    }
});

export {
    Game
}
