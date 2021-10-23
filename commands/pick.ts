import {SlashCommandBuilder} from "@discordjs/builders";
import {Client, CommandInteraction, Snowflake} from "discord.js";
import {guild_id} from "../config.json";
import {server_roles} from "../roles.json";
import {User} from "../modules/db_types/User";
import {Game} from "../modules/db_types/Game";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pick')
        .setDescription('Pick a player for your team')
        .setDefaultPermission(false)
        .addUserOption(option => option
            .setName('player')
            .setDescription('Target player')
            .setRequired(true)),

    async execute(interaction: CommandInteraction) {
        let channel;
        let guildMember;
        let captain;
        let player;
        let embed;
        let game;

        channel = interaction.channel;
        captain = interaction.member;
        guildMember = interaction.options.getUser('player');
        player = await User.findByPk(guildMember.id);
        game = await Game.findOne({ where: {channel: channel.id}});

        if (game) {
            let teams = await game.getTeams();
            let teamOne = teams[0];
            let teamTwo = teams[1];
            let teamOneMembers = await teamOne.getMembers();
            let teamTwoMembers = await teamTwo.getMembers();

            for (const team of teams) {
                let teamCaptain = await team.getCaptain();
                let teamMembers = await team.getMembers();
                let freeMembers = game.getFreeMembers();
                let index = Math.abs(team.getIndex() - 2);
                if (teamCaptain.id === captain.id) {
                    if (freeMembers > 0) {
                        if (freeMembers % 2 === index) {
                            let members = await game.getMembers();
                            for (const member of members) {
                                if (player && member.getId() === player.id) {
                                    for (const teamMember of teamOneMembers) {
                                        if (teamMember.getId() === player.id) {
                                            return interaction.reply({content: "This player is already on a team", ephemeral: true});
                                        }
                                    }
                                    for (const teamMember of teamTwoMembers) {
                                        if (teamMember.getId() === player.id) {
                                            return interaction.reply({content: "This player is already on a team", ephemeral: true});
                                        }
                                    }
                                    teamMembers.push(player);
                                    team.setMembers(teamMembers);
                                    await team.save();
                                    game.setFreeMembers(freeMembers - 1);
                                    await game.save()
                                    embed = await game.createEmbed();
                                    return interaction.reply({embeds: [embed]});
                                }
                            }
                            return interaction.reply({content: "This player cannot be picked.", ephemeral: true});
                        } else {
                            return interaction.reply({content: "You must wait your turn to pick.", ephemeral: true});
                        }
                    } else {
                        return interaction.reply({content: "All players have been picked!", ephemeral: true});
                    }
                }
            }
            await interaction.reply({content: "You must be the captain to use this command.", ephemeral: true});
        } else {
            await interaction.reply({content: "You must use this command inside a game channel.", ephemeral: true});
        }
    },
    async setPermissions(client: Client, commandId: Snowflake) {
        let guild = await client.guilds.fetch(guild_id);
        let verifiedId = server_roles["verified"]["id"]
        let commandPermissionsManager = guild.commands.permissions;

        await commandPermissionsManager.add({
            command: commandId, permissions: [
                {
                    id: verifiedId,
                    type: 'ROLE',
                    permission: true
                },
            ]
        });
    }
}