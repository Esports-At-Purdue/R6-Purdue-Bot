import {DataTypes, Model} from "sequelize";
import {sequelize} from "./Database";
import {GuildMember} from "discord.js";
import {sendLogToDiscord} from "../../index";
import {Log, LogType} from "../data_types/Log";
import {userMention} from "@discordjs/builders";
import {User} from "./User";

class Student extends Model {
    private id: string;
    private email: string;
    private username: string;
    private status: boolean;
    private code: number;

    getId() {
        return this.id;
    }

    setId(id: string) {
        this.id = id;
    }

    getEmail() {
        return this.email;
    }

    setEmail(email: string) {
        this.email = email;
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

    getCode() {
        return this.code;
    }

    setCode(code: number) {
        this.code = code;
    }
}

Student.init({
    id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    code : {
        type: DataTypes.INTEGER,
    }
}, {
    sequelize, // Connection Instance
    modelName: 'student' // Model Name
});

Student.addHook('beforeCreate', async (student: Student) => {
    await sendLogToDiscord(new Log(LogType.DATABASE_UPDATE, `New Student Created:\nMember: ${userMention(student.getId())}\nId: ${student.getId()}`))
})

export {
    Student
}