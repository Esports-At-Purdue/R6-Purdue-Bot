import * as express from "express";
import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { collections } from "./database.service";
// @ts-ignore
import Team from "../objects/db/Team";

export const teamsRouter = express.Router();

teamsRouter.use(express.json());

teamsRouter.get("/", async (_req: Request, res: Response) => {
    try {
        const teams = (await collections.teams.find({}).toArray()) as Team[];

        res.status(200).send(teams);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

teamsRouter.get("/:id", async (req: Request, res: Response) => {
    const id = req?.params?.id;

    try {

        const query = { _id: new ObjectId(id) };
        const team = (await collections.teams.findOne(query)) as Team;

        if (team) {
            res.status(200).send(team);
        }
    } catch (error) {
        res.status(404).send(`Unable to find matching document with id: ${req.params.id}`);
    }
});

teamsRouter.post("/", async (req: Request, res: Response) => {
    try {
        const newTeam = req.body as Team;
        // @ts-ignore
        const result = await collections.teams.insertOne(newTeam);

        result
            ? res.status(201).send(`Successfully created a new team with id ${result.insertedId}`)
            : res.status(500).send("Failed to create a new team.");
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message);
    }
});

teamsRouter.put("/:id", async (req: Request, res: Response) => {
    const id = req?.params?.id;

    try {
        const updatedTeam: Team = req.body as Team;
        const query = { _id: new ObjectId(id) };

        const result = await collections.teams.updateOne(query, { $set: updatedTeam });

        result
            ? res.status(200).send(`Successfully updated team with id ${id}`)
            : res.status(304).send(`team with id: ${id} not updated`);
    } catch (error) {
        console.error(error.message);
        res.status(400).send(error.message);
    }
});

teamsRouter.delete("/:id", async (req: Request, res: Response) => {
    const id = req?.params?.id;

    try {
        const query = { _id: new ObjectId(id) };
        const result = await collections.teams.deleteOne(query);

        if (result && result.deletedCount) {
            res.status(202).send(`Successfully removed team with id ${id}`);
        } else if (!result) {
            res.status(400).send(`Failed to remove team with id ${id}`);
        } else if (!result.deletedCount) {
            res.status(404).send(`team with id ${id} does not exist`);
        }
    } catch (error) {
        console.error(error.message);
        res.status(400).send(error.message);
    }
});