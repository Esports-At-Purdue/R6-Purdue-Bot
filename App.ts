import Bot from "./objects/Bot";
import * as config from "./config.json";
import {
    ButtonInteraction,
    CommandInteraction,
    GuildMember, MessageEmbed,
    Role,
    SelectMenuInteraction,
    TextChannel
} from "discord.js";
import {collections, updateRankings} from "./database/database.service";
import Player from "./objects/Player";
import * as blacklist from "./blacklist.json";

export const bot = new Bot();

bot.login(config.token).then();

bot.on('ready', async () => {
    await bot.init();
    await updateRankings();
});

bot.on('interactionCreate', async (interaction) => {
    if (interaction.isApplicationCommand()) return handleCommand(interaction as CommandInteraction);
    else if (interaction.isButton()) return handleButton(interaction as ButtonInteraction);
    else if (interaction.isSelectMenu()) return handleSelectMenu(interaction as SelectMenuInteraction);
});

bot.on('messageCreate', async (message) => {

});

bot.on('guildMemberAdd', async guildMember => {
    let channel = await bot.guild.channels.fetch(config.channels.join) as TextChannel;
    let embed = new MessageEmbed().setColor("GOLD");
    switch (Math.floor(Math.random() * 11)) {
        case 0: embed.setDescription(`Welcome, ${guildMember.user}. We were expecting you ( ͡° ͜ʖ ͡°)`); break;
        case 1: embed.setDescription(`Swoooosh. ${guildMember.user} just landed.`); break;
        case 2: embed.setDescription(`${guildMember.user} just showed up. Hold my beer.`); break;
        case 3: embed.setDescription(`Challenger approaching - ${guildMember.user} has appeared!`); break;
        case 4: embed.setDescription(`Never gonna give ${guildMember.user} up. Never gonna let ${guildMember.user} down.`); break;
        case 5: embed.setDescription(`We've been expecting you ${guildMember.user}`); break;
        case 6: embed.setDescription(`${guildMember.user} has joined the server! It's super effective!`); break;
        case 7: embed.setDescription(`${guildMember.user} is here, as the prophecy foretold.`); break;
        case 8: embed.setDescription(`Ready player ${guildMember.user}`); break;
        case 9: embed.setDescription(`Roses are red, violets are blue, ${guildMember.user} joined this server to be with you`); break;
        case 10: embed.setDescription(`${guildMember.user} just arrived. Seems OP - please nerf.`); break;
    }
    await channel.send({embeds: [embed]});
});

bot.on('warn', async (warning) => {
    await bot.logger.warn(warning);
});

bot.on('error', async (error) => {
    await bot.logger.error("Error", error);
})

async function handleCommand(interaction: CommandInteraction) {
    try {
        const command = bot.commands.get(interaction.commandName);
        let channel = interaction.channel as TextChannel;
        if (channel.parentId === config.category || !config.pupl_commands.includes(interaction.commandName)) await command.execute(interaction);
        else await interaction.reply({content: "Unable to execute this command outside of PUPL channels.", ephemeral: true});
        await bot.logger.info(`${interaction.commandName} command issued by ${interaction.user.username}`);
    } catch (error) {
        await bot.logger.error(`${interaction.commandName} command issued by ${interaction.user.username} failed`, error);
        await interaction.reply({content: "There was an error running this command.", ephemeral: true});
    }
}

async function handleButton(button: ButtonInteraction) {
    try {
        let id = button.customId;
        switch (id) {
            case "join": case "leave": case "bump":
                await bot.commands.get("queue").execute(button);
                break;
            //case "register":
                //await bot.commands.get("register").execute(button);
                //break;
            default:
                let role = await button.guild.roles.fetch(id);
                let guildMember = button.member as GuildMember;
                let response = await requestRole(role, guildMember, button);
                response ? await button.reply({content: response, ephemeral: true}) : 0;
        }
        await bot.logger.info(`${button.component.label} button used by ${button.user.username}`);
    } catch (error) {
        await bot.logger.error(`${button.component.label} button used by ${button.user.username} failed`, error);
        await button.reply({content: "There was an error running this handling this button.", ephemeral: true});
    }
}

async function handleSelectMenu(selectMenu: SelectMenuInteraction) {
    try {
        await bot.commands.get("pick").execute(selectMenu);
        await bot.logger.info(`Select Menu option ${selectMenu.values[0]} selected by ${selectMenu.user.username}`);
    } catch (error) {
        await bot.logger.error(`Select Menu option ${selectMenu.values[0]} selected by ${selectMenu.user.username} failed`, error);
        await selectMenu.reply({content: "There was an error handling this menu.", ephemeral: true});
    }
}

/**
 * Executes logic for managing role requests
 * @param role the requested role
 * @param guildMember the requester
 * @param interaction the interaction
 */
async function requestRole(role: Role, guildMember: GuildMember, interaction: ButtonInteraction) {
    let hasRole = await checkIfMemberHasRole(role.id, guildMember);
    let hasPurdueRole = await checkIfMemberHasRole(config.roles.purdue, guildMember);

    switch (role.name) {

        case 'Purdue':
            if (hasRole) return "You already have this role.";
            else return `Use \`/verify start\` to receive your Purdue role.`;


        case 'Other':
            if (hasRole) {
                await removeRoleFromMember(role.id, guildMember);
                return `You successfully removed the role **<@&${role.id}>** from yourself.`;
            } else {
                if (hasPurdueRole) return "You cannot receive this role because you already have the role 'Purdue'.";
                else {
                    await addRoleToMember(role.id, guildMember);
                    return `You successfully applied the role **<@&${role.id}>** to yourself.`;
                }
            }

        case 'Game Night':
            if (!hasRole) {
                await addRoleToMember(role.id, guildMember);
                return `You successfully applied the role **<@&${role.id}>** to yourself.`;
            } else {
                await removeRoleFromMember(role.id, guildMember);
                return`You successfully removed the role **<@&${role.id}>** from yourself.`;
            }

        case 'PUPL Registered':
            const command = bot.commands.get("register");
            await command.execute(interaction);
            return null;
    }
}

/**
 * Adds a Role to a GuildMember
 * @param snowflake the role ID
 * @param guildMember the member to receive the role
 */
async function addRoleToMember(roleID: string, guildMember: GuildMember) {
    await guildMember.roles.add(roleID);
}

/**
 * Removes a Role from a GuildMember
 * @param snowflake
 * @param guildMember
 */
async function removeRoleFromMember(snowflake: string, guildMember: GuildMember) {
    await guildMember.roles.remove(snowflake);
}

/**
 * Determines whether a GuildMember has a certain Role
 * @param snowflake
 * @param guildMember
 */
async function checkIfMemberHasRole(snowflake: string, guildMember: GuildMember): Promise<boolean> {
    let result = false;
    let roles = guildMember.roles.cache;

    roles.forEach(role => {
        if (role.id === snowflake) result = true;
    })
    return result;
}

/**
 * Sets game status for Bot Client
 */
async function setRichPresence() {
    let user;
    let activity;

    user = bot.user;
    activity = {
        name: 'Learning to Love™',
        type: 'PLAYING'
    }

    user.setActivity(activity);
}