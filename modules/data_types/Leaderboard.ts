import {MessageEmbed} from "discord.js";
import {User} from "../db_types/User";
import * as sequelize from 'sequelize';

class Leaderboard extends MessageEmbed{
    constructor() {
        super();
    }

    async init(page: number) {

        page = page ? page : 1;
        let offset = (page - 1) * 10;
        let fieldTitle = `Ranks ${offset + 1} - ${offset + 10}`
        let pointsTitle = `P/W/L`;
        let fieldDescription = String(``);
        let pointsDescription = String(``);

        const players = await User.findAll({
            order: [['points', 'DESC'],['wins', 'DESC']],
            offset: offset,
            limit: 10
        });

        for (const player of players) {
            let username = player.getUsername();
            let points = player.getPoints();
            let wins = player.getWins();
            let losses = player.getLosses()

            fieldDescription = fieldDescription.concat(`\n**${offset + players.indexOf(player) + 1}**. ${username}`);
            pointsDescription = pointsDescription.concat(`\n${points}/${wins}/${losses}`);
        }

        super.setTitle(`PUPL Leaderboard - Page ${page}`)
        super.addField(fieldTitle, fieldDescription, true);
        super.addField(pointsTitle, pointsDescription, true);
    }
}

export {
    Leaderboard
}