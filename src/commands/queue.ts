import {SlashCommandBuilder} from "@discordjs/builders";
import {
    ButtonInteraction, CommandInteraction,
    Guild, MessageEmbed, Snowflake, TextChannel
} from "discord.js";
import {server_roles} from "../roles.json";
import {bot} from "../App";
import Player from "../data/db/Player";
import Game from "../data/db/Game";
import Queue from "../data/Queue";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('General-use queue command')
        .setDefaultPermission(false)

        // view - subcommand
        .addSubcommand((command) => command
            .setName('view')
            .setDescription('Command to view the queue')
        )

        // join - subcommand
        .addSubcommand((command) => command
            .setName('join')
            .setDescription('Command to join the queue')
        )

        // leave - subcommand
        .addSubcommand((command) => command
            .setName('leave')
            .setDescription('Command to leave the queue')
        ),

    async execute(interaction: CommandInteraction | ButtonInteraction, command: string = null) {
        const subcommand = interaction instanceof CommandInteraction ? interaction.options.getSubcommand() : command;

        switch (subcommand) {
            case 'view': case 'v':
                await view(interaction);
                break;

            case 'join': case 'j':
                await join(interaction);
                break;

            case 'leave': case 'l':
                await leave(interaction);
                break;
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

async function view(interaction: CommandInteraction | ButtonInteraction) {
    const queue = bot.queue;
    const embed = queue.buildEmbed();
    await interaction.reply({embeds: [embed], ephemeral: true});
}

async function join(interaction: CommandInteraction | ButtonInteraction) {
    const player = await Player.get(interaction.user.id);
    const queue = bot.queue;
    let embed;

    if (!queue.contains(player)) {
        if (queue.length >= queue.maxSize)
            await interaction.reply({content: "This queue is full, please try again momentarily", ephemeral: true});

        else if (queue.length == queue.maxSize - 1) {
            queue.push(player);
            embed = queue.buildEmbed().setTitle("Queue is full. A new game is starting...").setColor("BLUE").setTimestamp(new Date());
            await interaction.reply({embeds: [embed]});
            delete bot.queue;
            bot.queue = new Queue();
            await Game.start(queue);
        } else {
            queue.push(player);
            embed = queue.buildEmbed().setTitle(`${player.username} has joined the queue. [${queue.length}/10]`);
            await updateChannel(interaction, embed, false);

            let timeoutId = (global.setTimeout(async function() {
                await timeout(interaction, player);
            }, queue.timeout))

            queue.timeouts.push(timeoutId);
        }
    } else await interaction.reply({content: "You are already in the queue!", ephemeral: true});
}

async function leave(interaction: CommandInteraction | ButtonInteraction) {
    const player = await Player.get(interaction.user.id);
    const queue = bot.queue;
    let embed;

    if (queue.contains(player)) {
        queue.remove(player);
        embed = queue.buildEmbed().setTitle(`${player.username} has left the queue. [${queue.length}/10]`);
        await updateChannel(interaction, embed, false);

    } else await interaction.reply({content: "You are not in the queue!", ephemeral: true});
}

async function updateChannel(interaction: CommandInteraction | ButtonInteraction, embed: MessageEmbed, timeout: boolean) {
    const queue = bot.queue;
    const row = queue.buildRow();
    const messageOptions = {embeds: [embed], components: [row]};
    await queue.updateLastMessage(interaction.channel as TextChannel);

    timeout ? messageOptions["content"] = `${interaction.user}` : 0;

    if (interaction instanceof CommandInteraction) {
        await interaction.reply(messageOptions);
        queue.lastMessage = (await interaction.fetchReply()).id;
    } else {
        try { await interaction.update({components: []})} catch(e) { }
        queue.lastMessage = (await interaction.channel.send(messageOptions)).id;
    }
}

async function timeout(interaction: CommandInteraction | ButtonInteraction, player: Player) {
    const queue = bot.queue;
    let embed;

    if (queue.contains(player) && player.id !== "751910711218667562") {
        await queue.remove(player);
        embed = queue.buildEmbed().setTitle(`${player.username} has been timed-out. [${queue.length}/10]`);
        await updateChannel(interaction, embed, true);
    }
}