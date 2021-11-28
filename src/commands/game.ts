import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, Guild, GuildMember, Snowflake, TextChannel} from "discord.js";
import {score_report} from "../channels.json";
import {server_roles} from "../roles.json";
import Game from "../data/db/Game";
import Player from "../data/db/Player";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('game')
        .setDescription('General-use command for viewing and managing games')
        .setDefaultPermission(false)

        // manage - subcommand group
        .addSubcommandGroup((group) => group
            .setName('manage')
            .setDescription('General-use command for managing games')

            // winner - subcommand
            .addSubcommand((command) => command
                .setName('winner')
                .setDescription('Command to set the winner of a game')
                .addIntegerOption((option) => option
                    .setName('game_number')
                    .setDescription('The game number')
                    .setRequired(true))
                .addIntegerOption((option) => option
                    .setName('winner')
                    .setDescription('The number of the winning team')
                    .setRequired(true)
                    .addChoices([['Team 1', 1], ['Team 2', 2]])
                )
            )

            // draw - subcommand
            .addSubcommand((command) => command
                .setName('draw')
                .setDescription('Command to call a draw for a game')
                .addIntegerOption((option) => option
                    .setName('game_number')
                    .setDescription('The game number')
                    .setRequired(true)
                )
            )

            // sub - subcommand
            .addSubcommand((command) => command
                .setName('sub')
                .setDescription('Command to substitute a player into a game')
                .addIntegerOption((option) => option
                    .setName('game_number')
                    .setDescription('The game number')
                    .setRequired(true))
                .addMentionableOption((option) => option
                    .setName('sub')
                    .setDescription('The player to add to the game')
                    .setRequired(true))
                .addMentionableOption((option) => option
                    .setName('target')
                    .setDescription('The player to remove from the game')
                    .setRequired(true)
                )
            )

            // map - subcommand
            .addSubcommand((command) => command
                .setName('map')
                .setDescription('Command to set the map for a game')
                .addIntegerOption((option) => option
                    .setName('game_number')
                    .setDescription('The game number')
                    .setRequired(true))
                .addStringOption((option) => option
                    .setName('map')
                    .setDescription('The new map')
                    .setRequired(true)
                    .addChoices([
                            ['Bank', 'Bank'], ['Chalet', 'Chalet'], ['Clubhouse', 'Clubhouse'],
                            ['Coastline', 'Coastline'],['Kafe Dostoyevsky', 'Kafe Dostoyevsky'],
                            ['Oregon', 'Oregon'], ['Villa', 'Villa']
                        ]
                        //"Bank", "Chalet", "Clubhouse", "Coastline", "Kafe Dostoyevsky", "Oregon", "Villa"
                    )
                )
            )
        )

        // info - subcommand
        .addSubcommand((command) => command
                .setName('info')
                .setDescription('Command to view the details of a game')
                .addIntegerOption((option) => option
                    .setName('game_number')
                    .setDescription('The game number')
                    .setRequired(true))
        )
    ,

    async execute(interaction: CommandInteraction) {
        const command = interaction.options.getSubcommand();
        const gameNumber = interaction.options.getInteger('game_number');
        const game = await Game.get(gameNumber.toString());

        if (game) {
            switch (command) {
                case 'winner':
                    await executeWinner(interaction, game);
                    break;
                case 'draw':
                    await executeDraw(interaction, game);
                    break;
                case 'sub':
                    await executeSub(interaction, game);
                    break;
                case 'map':
                    await executeMap(interaction, game);
                    break;
                case 'info':
                    await executeInfo(interaction, game);
                    break;
            }
        } else {
            await interaction.reply({content: "This game does not exist.", ephemeral: true});
        }

    },

    async setPermissions(commandId: Snowflake, guild: Guild) {
        let commandPermissionsManager = guild.commands.permissions;

        await commandPermissionsManager.set({
            command: commandId,
            permissions: [
                {
                    id: server_roles["verified"]["id"],
                    type: 'ROLE',
                    permission: true
                },
            ]
        })
    }
}

async function executeWinner(interaction: CommandInteraction, game: Game) {
    if (isModerator(interaction.member as GuildMember)) {
        const winner = interaction.options.getInteger('winner');
        if (game.phase == 0) {
            await game.setDraw();
            await game.setWinner(winner);
        } else {
            await game.setWinner(winner);
            await game.deleteChannels();
            const embed = (await game.buildEmbed()).setColor("GREEN");
            const scoreReport = await interaction.guild.channels.fetch(score_report) as TextChannel;
            await scoreReport.send({content: `Team ${winner} has won Game ${game.id}!`, embeds: [embed]});
        }
        await interaction.reply({content: `Game ${game.id} has had winner set as Team ${winner}.`, ephemeral: true});
    } else {
        await interaction.reply({content: "You don't have permission to do this.", ephemeral: true});
    }
}

async function executeDraw(interaction: CommandInteraction, game: Game) {
    if (isModerator(interaction.member as GuildMember)) {
        await game.setDraw();
        await interaction.reply({content: `Game ${game.id} has been set as a draw.`, ephemeral: true});
    } else {
        await interaction.reply({content: "You don't have permission to do this.", ephemeral: true});
    }
}

async function executeSub(interaction: CommandInteraction, game: Game) {
    if (isModerator(interaction.member as GuildMember)) {
        const phase = game.phase;
        const subMember = interaction.options.getMentionable('sub') as GuildMember;
        const targetMember = (interaction.options.getMentionable('target') as GuildMember)

        const sub = await Player.get(subMember.id);
        const target = await Player.get(targetMember.id);

        if (phase < 1) {
            if (sub) {
                if (target) {
                    if (await game.contains(target)) {
                        await game.subPlayer(sub, target);
                        await interaction.reply({content: `${subMember} has been subbed in for ${targetMember}.`});
                        await game.setChannelPerms();
                    } else await interaction.reply({content: `${targetMember} is not in this game.`, ephemeral: true});
                } else await interaction.reply({content: `${targetMember} is not a registered player.`, ephemeral: true});
            } else await interaction.reply({content: `${subMember} is not a registered player.`, ephemeral: true});
        } else await interaction.reply({content: "Subbing is not available until after the pick phase.", ephemeral: true});
    } else await interaction.reply({content: "You don't have permission to do this.", ephemeral: true});
}

async function executeMap(interaction: CommandInteraction, game: Game) {
    if (isModerator(interaction.member as GuildMember)) {
        const map = interaction.options.getString('map');
        game.map = interaction.options.getString('map');
        await Game.put(game);
        await interaction.reply({content: `Game 1 Map Override: \`${map}\``});
    } else {
        await interaction.reply({content: "You don't have permission to do this.", ephemeral: true});
    }
}

async function executeInfo(interaction: CommandInteraction, game: Game) {
    const embed = await game.buildEmbed();
    await interaction.reply({embeds: [embed]});
    //await interaction.reply({content: "This command is not implemented.", ephemeral: true});
}

function isModerator(guildMember: GuildMember) {
    let roles = guildMember.roles.cache;
    for (const [, role] of roles) {
        if (role.id == server_roles["moderator"]["id"] || role.id == server_roles["administrator"]["id"]) return true;
    }
}