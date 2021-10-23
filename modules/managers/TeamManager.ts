import {CategoryChannel, Collection, Guild, TextChannel, VoiceChannel} from "discord.js";
import {Team} from "../db_types/Team";
import {game_category_id} from "../../config.json";
import {User} from "../db_types/User";
import {v4} from "uuid";
import {app} from "../../index";

class TeamManager {
    private cache: Collection<string, Team>;
    private guild: Guild;

    constructor(guild: Guild) {
        this.guild = guild;
    }
    async synchronize() {
        let cache = new Collection<string, Team>();
        let games = await Team.findAll();
        games.forEach(team => {
            cache.set(team.getId(), team);
        })
        this.cache = cache;
    }

    async create(captains: Array<User>, index: number) {
        await this.synchronize();

        let teams = new Array<Team>();
        let teamA = await TeamManager.createTeamA(captains[0]);
        let teamB = await TeamManager.createTeamB(captains[1]);
        let teamChannelA = await TeamManager.createChannel(index, 1);
        let teamChannelB = await TeamManager.createChannel(index, 2);

        teamA.setChannel(teamChannelA);
        teamB.setChannel(teamChannelB);
        teams.push(teamA, teamB);

        await teamA.save();
        await teamB.save();
        return teams;
    }

    private static async createTeamA(captain: User) {
        let id = v4();
        let team = await Team.create({id: id, index: 1});

        team.setCaptain(captain);
        team.setMembers([captain]);
        await team.save();

        return team;
    }

    private static async createTeamB(captain: User) {
        let id = v4();
        let team = await Team.create({id: id, index: 2});

        team.setCaptain(captain);
        team.setMembers([captain]);
        await team.save();

        return team;
    }

    private static async createChannel(index: number, qualifier: number) {
        let category = await app.guild.channels.fetch(game_category_id) as CategoryChannel;
        return await category.createChannel(`Game ${index} - Team ${qualifier}`, {
            type: "GUILD_VOICE",
            permissionOverwrites: [
                {
                    id: app.guild.id,
                    deny: ["CONNECT"],
                    allow: ["VIEW_CHANNEL"]
                },
            ]
        });
    }

    async setChannelPermissions(channel: VoiceChannel, members: Array<User>) {
        for (const member of members) {
            await channel.permissionOverwrites.create(member.getId(), {
                CONNECT: true
            })
        }
    }
}

export {
    TeamManager
}