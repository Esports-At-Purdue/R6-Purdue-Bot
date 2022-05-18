import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, SelectMenuInteraction, TextChannel} from "discord.js";
import Game from "../objects/Game";
import {collections} from "../database/database.service";
import Player from "../objects/Player";
import Team from "../objects/Team";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pick")
        .setDescription("Picks a player in a PUPL game")
        .setDefaultPermission(false)
        .addUserOption((user) => user
            .setName("target")
            .setDescription("The player you want to pick.")
            .setRequired(true))
    ,

    async execute(interaction: SelectMenuInteraction | CommandInteraction) {
        let response;
        if (interaction instanceof CommandInteraction) response = {content: "This command is disabled, please use the SelectMenu.", ephemeral: true};
        else {
            let target = (await Player.get(interaction.values[0]));
            let game = Game.fromObject(await collections.games.findOne({_channel: interaction.channel.id}));
            if (game) {
                let captain = await Player.get(interaction.user.id);
                let targetTwo = Player.fromObject(game.players.filter((player) => player["_id"] != target.id)[0]);
                for (let i = 0; i < 2; i++) {
                    let team = Team.fromObject(game.teams[i]);
                    let teamCaptain = Player.fromObject(team.players[0]);
                    if (teamCaptain.id == captain.id) {
                        if (game.players.some(player => Player.fromObject(player).id == target.id)) {
                            switch (game.players.length) {
                                case 8: case 5: case 4:
                                    if (i == 0) {
                                        await game.pick(target, i);
                                        await interaction.update({components: []});
                                        response = null;
                                    } else response = {content: "It is not your turn to pick", ephemeral: true};
                                    break;
                                case 7: case 6: case 3:
                                    if (i == 1) {
                                        await game.pick(target, i);
                                        await interaction.update({components: []});
                                        response = null;
                                    } else response = {content: "It is not your turn to pick", ephemeral: true};
                                    break;
                                case 2:
                                    if (i == 0) {
                                        await game.pick(target, i);
                                        await game.pick(targetTwo, Math.abs(i - 1));
                                        await interaction.update({components: []});
                                        setTimeout(async function() {await game.start()}, 3000);
                                        response = null;
                                    } else response = {content: "It is not your turn to pick", ephemeral: true};
                                    break;
                            }
                        } else {
                            response = {content: "This player is not available", ephemeral: true};
                            break;
                        }
                    } else response = {content: "You must be the captain to do this.", ephemeral: true};
                }
            } else response = {content: "You can't do this outside of a game channel.", ephemeral: true};
        }
        return response;
    }
}
