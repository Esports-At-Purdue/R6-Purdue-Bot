import * as express from "express";
import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { collections } from "./database.service";
// @ts-ignore
import Player from "../objects/db/Player";

export const playersRouter = express.Router();

playersRouter.use(express.json());

playersRouter.get("/", async (_req: Request, res: Response) => {
    try {
        const players = (await collections.players.find({}).toArray()) as Player[];

        res.status(200).send(players);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

playersRouter.get("/:id", async (req: Request, res: Response) => {
    const id = req?.params?.id;

    try {

        const query = { _id: new ObjectId(id) };
        const player = (await collections.players.findOne(query)) as Player;

        if (player) {
            res.status(200).send(player);
        }
    } catch (error) {
        res.status(404).send(`Unable to find matching document with id: ${req.params.id}`);
    }
});

playersRouter.post("/", async (req: Request, res: Response) => {
    try {
        const newPlayer = req.body as Player;
        // @ts-ignore
        const result = await collections.players.insertOne(newPlayer);

        result
            ? res.status(201).send(`Successfully created a new player with id ${result.insertedId}`)
            : res.status(500).send("Failed to create a new player.");
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message);
    }
});

playersRouter.put("/:id", async (req: Request, res: Response) => {
    const id = req?.params?.id;

    try {
        const updatedPlayer: Player = req.body as Player;
        const query = { _id: new ObjectId(id) };

        const result = await collections.players.updateOne(query, { $set: updatedPlayer });

        result
            ? res.status(200).send(`Successfully updated player with id ${id}`)
            : res.status(304).send(`player with id: ${id} not updated`);
    } catch (error) {
        console.error(error.message);
        res.status(400).send(error.message);
    }
});

playersRouter.delete("/:id", async (req: Request, res: Response) => {
    const id = req?.params?.id;

    try {
        const query = { _id: new ObjectId(id) };
        const result = await collections.players.deleteOne(query);

        if (result && result.deletedCount) {
            res.status(202).send(`Successfully removed player with id ${id}`);
        } else if (!result) {
            res.status(400).send(`Failed to remove player with id ${id}`);
        } else if (!result.deletedCount) {
            res.status(404).send(`player with id ${id} does not exist`);
        }
    } catch (error) {
        console.error(error.message);
        res.status(400).send(error.message);
    }
});