import {DataTypes, Model} from "sequelize";
import {sequelize} from "./Database";
import {app, sendLogToDiscord} from "../../index";
import {User} from "./User";
import {VoiceChannel} from "discord.js";
import {Log, LogType} from "../data_types/Log";

class Team extends Model {
    private id: string;
    private channel: string;
    private members: string;
    private captain: string;
    private index: number;

    getId() {
        return this.id;
    }

    setId(id: string) {
        this.id = id;
    }

    getIndex() {
        return this.index;
    }

    setIndex(index: number) {
        this.index = index;
    }

    async getChannel() {
        return await app.guild.channels.fetch(this.channel) as VoiceChannel;
    }

    setChannel(channel: VoiceChannel) {
        this.channel = channel.id;
    }

    async getCaptain() {
        return await User.findByPk(this.captain);
    }

    setCaptain(captain: User) {
        this.captain = captain.getId();
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
}

Team.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    captain: DataTypes.STRING,
    channel: DataTypes.STRING,
    members: DataTypes.STRING,
    index: DataTypes.INTEGER
}, {
    sequelize,
    modelName: 'team'
})

Team.addHook('beforeCreate', async (team: Team) => {
    await sendLogToDiscord(new Log(LogType.DATABASE_UPDATE, `New Team Created:\nId: ${team.getId()}`))
})

export {
    Team
}
