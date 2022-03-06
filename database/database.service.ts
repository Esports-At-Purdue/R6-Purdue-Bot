import * as mongoDB from "mongodb";
import * as dotenv from "dotenv";
import {bot} from "../App";
import Player from "../objects/Player";

export const collections: { games?: mongoDB.Collection, teams?: mongoDB.Collection, players?: mongoDB.Collection, students?: mongoDB.Collection } = {}

export async function connectToDatabase () {
    dotenv.config();
    const client: mongoDB.MongoClient = new mongoDB.MongoClient("mongodb://localhost:27017");
    await client.connect();

    const db: mongoDB.Db = client.db("R6@Purdue");
    const puggDb: mongoDB.Db = client.db("PUGG");

    const teamsCollection: mongoDB.Collection = db.collection("teams");
    const gamesCollection: mongoDB.Collection = db.collection("games");
    const playersCollection: mongoDB.Collection = db.collection("players");
    const studentsCollection: mongoDB.Collection = puggDb.collection("students");

    collections.games = gamesCollection;
    collections.teams = teamsCollection;
    collections.players = playersCollection;
    collections.students = studentsCollection;

    await bot.logger.info(`Connected to ${db.databaseName} Database & ${puggDb.databaseName} Database`);
}

export async function updateRankings() {
    const players = (await collections.players.find().sort({_points: -1, _wins: -1, _draws: -1, _losses: 1, _username: 1}).toArray());
    for (let i = 0; i < players.length; i++) {
        let player = Player.fromObject(players[i]);
        bot.guild.members.fetch(player.id).catch(async () => {
            // await Player.delete(player);
        })
        player.rank = i + 1;
        await Player.put(player);
    }
}