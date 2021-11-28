import * as mongoDB from "mongodb";
import * as dotenv from "dotenv";

export const collections: { games?: mongoDB.Collection, teams?: mongoDB.Collection, players?: mongoDB.Collection } = {}

export async function connectToDatabase () {
    dotenv.config();

    const client: mongoDB.MongoClient = new mongoDB.MongoClient("mongodb://localhost:27017");

    await client.connect();

    const db: mongoDB.Db = client.db("R6@Purdue");

    const teamsCollection: mongoDB.Collection = db.collection("teams");
    const gamesCollection: mongoDB.Collection = db.collection("games");
    const playersCollection: mongoDB.Collection = db.collection("players");

    collections.games = gamesCollection;
    collections.teams = teamsCollection;
    collections.players = playersCollection;

    console.log(`Successfully connected to database: ${db.databaseName} and collections: ${gamesCollection.collectionName}, ${teamsCollection.collectionName}, ${playersCollection.collectionName}`);
}