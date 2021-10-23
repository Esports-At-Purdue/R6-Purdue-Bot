import {DataTypes, Model} from "sequelize";
import {sequelize} from "./Database";
import {sendLogToDiscord} from "../../index";
import {Log, LogType} from "../data_types/Log";
import {userMention} from "@discordjs/builders";

class User extends Model {
    private id: string;
    private username: string;
    private status: boolean;
    private points: number;
    private wins: number;
    private losses: number;
    private draws: number;

    getId() {
        return this.id;
    }

    setId(id: string) {
        this.id = id;
    }

    getUsername() {
        return this.username;
    }

    setUsername(username: string) {
        this.username = username;
    }

    getStatus() {
        return this.status;
    }

    setStatus(status: boolean) {
        this.status = status;
    }

    getPoints() {
        return this.points;
    }

    setPoints(points: number) {
        this.points = points;
    }

    getWins() {
        return this.wins;
    }

    setWins(wins: number) {
        this.wins = wins;
    }

    getLosses() {
        return this.losses;
    }

    setLosses(losses: number) {
        this.losses = losses;
    }

    getDraws() {
        return this.draws;
    }

    setDraws(draws: number) {
        this.draws = draws;
    }
}

User.init({
    id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    points: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    wins: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    losses: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    draws: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    sequelize, // Connection Instance
    modelName: 'user' // Model Name
});

User.addHook('beforeCreate', async (user: User) => {
    await sendLogToDiscord(new Log(LogType.DATABASE_UPDATE, `New User Created:\nMember: ${userMention(user.getId())}\nId: ${user.getId()}`))
})

export {
    User
}