import {CategoryChannel, Collection, Guild, MessageEmbed, TextChannel} from "discord.js";
import {game_category_id, queue_size} from '../../config.json';
import {Game} from "../db_types/Game";
import {User} from "../db_types/User";
import {v4} from "uuid";
import {R6Map} from "../data_types/R6Map";
import {app} from "../../index";
import {Team} from "../db_types/Team";

class GameManager {
    public cache: Collection<string, Game>;
    private guild: Guild;

    constructor(guild: Guild) {
        this.guild = guild;
    }

    async synchronize() {
        let cache = new Collection<string, Game>();
        let games = await Game.findAll();
        games.forEach(game => {
            cache.set(game.getId(), game);
        })
        this.cache = cache;
    }

    async fetch(game: string | Game) {
        if (game instanceof String) {

        } else {

        }
    }

    async createList(index: number) {
        await app.gameManager.synchronize();

        index = index ? index : 1;
        let offset = (index - 1) * 10;
        let embed = new MessageEmbed().setTitle(`Games List - Page ${index}`);

        const games = await Game.findAll({
            offset: offset,
            limit: 10
        });

        games.reverse();
        for (const game of games) {
            let status = game.getStatus() === 1 ? `Active` : `Finished`;
            let map = game.getMap();
            let winner = `Pending`;

            if (game.winner) {
                let gameIndex =  (await game.getWinner()).getIndex();
                winner = `Team ${gameIndex}`
            }

            let fieldTitle = `Game ${game.getIndex()}`
            let fieldDescription = `**Status**: ${status} \n**Winner**: \n**Map**: ${map}`;

            embed.addField(fieldTitle, fieldDescription, true);
        }

        return embed;
    }


    async create(members: Array<User>) {
        await this.synchronize();

        let id = v4();
        let map = new R6Map();
        let index = this.cache.size + 1;
        let game = await Game.create({id: id, index: index}) as Game;
        let captains = await GameManager.pickCaptains(members);
        let teams = await app.teamManager.create(captains, index);

        game.setMap(map);
        game.setMembers(members);
        game.setFreeMembers(queue_size - 2);
        game.setTeams(teams);

        let embed = await game.createEmbed();
        let channel = await GameManager.createChannel(this.guild, game.getIndex()) as TextChannel;

        game.setChannel(channel);
        await game.save();
        await GameManager.setChannelPermissions(channel, await game.getMembers());
        await channel.send({content: "@everyone", embeds: [embed]});
    }

    private static async pickCaptains(members: Array<User>) {
        let captains = new Array<User>();
        members = await app.userManager.sort(members);
        captains.push(members[0], members[1]);
        return captains;
    }

    private static async createChannel(guild: Guild, index: number) {
        let category = await guild.channels.fetch(game_category_id) as CategoryChannel;
        return await category.createChannel(`Game ${index}`, {
            type: "GUILD_TEXT",
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: ["VIEW_CHANNEL"]
                },
            ]
        });
    }

    private static async setChannelPermissions(channel: TextChannel, members: Array<User>) {
        for (const member of members) {
            await channel.permissionOverwrites.create(member.getId(), {
                VIEW_CHANNEL: true,
                SEND_MESSAGES: true,
                READ_MESSAGE_HISTORY: true,
                USE_APPLICATION_COMMANDS: true
            })
        }
    }
}

export {
    GameManager
}