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
import {updateRankings} from "./database/database.service";
import Student from "./objects/Student";

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

bot.on('messageCreate', async message => {
    if (message.channelId == config.channels.roles) {
        if (message.author.id != bot.user.id) {
            let embed = new MessageEmbed()
                .setDescription("Only slash commands are permitted in this channel.\n" +
                    "Please refer to [Discord - Slash Commands FAQ](https://support.discord.com/hc/en-us/articles/1500000368501-Slash-Commands-FAQ)" +
                    " if further instruction is needed."
                )
                .setColor("#f1c40f")
            let response = await message.reply({embeds: [embed]});
            setTimeout(async () => {
                try {
                    await response.delete();
                    await message.delete();
                } catch (e) {}
            }, 5000);
        }
    }
});

bot.on('guildMemberAdd', async guildMember => {
    let channel = await bot.guild.channels.fetch(config.channels.join) as TextChannel;
    let embed = new MessageEmbed().setColor("#2f3136");
    switch (Math.floor(Math.random() * 11)) {
        case 0: embed.setDescription(`Welcome, **${guildMember.user.username}**. We were expecting you ( ͡° ͜ʖ ͡°)`); break;
        case 1: embed.setDescription(`Swoooosh. **${guildMember.user.username}** just landed.`); break;
        case 2: embed.setDescription(`**${guildMember.user.username}** just showed up. Hold my beer.`); break;
        case 3: embed.setDescription(`Challenger approaching - **${guildMember.user.username}** has appeared!`); break;
        case 4: embed.setDescription(`Never gonna give **${guildMember.user.username}** up. Never gonna let **${guildMember.user.username}** down.`); break;
        case 5: embed.setDescription(`We've been expecting you **${guildMember.user.username}**`); break;
        case 6: embed.setDescription(`**${guildMember.user.username}** has joined the server! It's super effective!`); break;
        case 7: embed.setDescription(`**${guildMember.user.username}** is here, as the prophecy foretold.`); break;
        case 8: embed.setDescription(`Ready player **${guildMember.user.username}**`); break;
        case 9: embed.setDescription(`Roses are red, violets are blue, **${guildMember.user.username}** joined this server to be with you`); break;
        case 10: embed.setDescription(`**${guildMember.user.username}** just arrived. Seems OP - please nerf.`); break;
    }
    await channel.send({content: `${guildMember.user}`, embeds: [embed]});
});

bot.on('warn', async (warning) => {
    await bot.logger.warn(warning);
});

bot.on('error', async (error) => {
    await bot.logger.error("Error", error);
})

async function handleCommand(interaction: CommandInteraction) {
    try {
        await interaction.deferReply();
        const command = bot.commands.get(interaction.commandName);
        let response = await command.execute(interaction);
        if (response) {
            if (response.ephemeral) {
                await interaction.deleteReply();
                await interaction.followUp(response);
            } else {
                await interaction.deleteReply();
                await interaction.channel.send(response);
            }
        }
        await bot.logger.info(`${interaction.commandName} command issued by ${interaction.user.username}`);
    } catch (error) {
        await bot.logger.error(`${interaction.commandName} command issued by ${interaction.user.username} failed`, error);
        try {
            await interaction.deleteReply();
            await interaction.followUp({content: "There was an error running this command.", ephemeral: true});
        } catch (e) {}
    }
}

async function handleButton(interaction: ButtonInteraction) {
    try {
        let response;
        let id = interaction.customId;
        switch (id) {
            case "join": case "leave": case "bump":
                response = await bot.commands.get("queue").execute(interaction);
                break;
            default:
                let role = await interaction.guild.roles.fetch(id);
                let guildMember = interaction.member as GuildMember;
                response = await requestRole(role, guildMember, interaction);
        }
        if (response != undefined && response.content != undefined) {
            await interaction.reply(response);
        }
        await bot.logger.info(`${interaction.component.label} button used by ${interaction.user.username}`);
    } catch (error) {
        await bot.logger.error(`${interaction.component.label} button used by ${interaction.user.username} failed`, error);
        await interaction.reply({content: "There was an error running this handling this button.", ephemeral: true});
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
    let response;
    let hasRole = await checkIfMemberHasRole(role.id, guildMember);
    let student = await Student.get(guildMember.id);

    switch (role.id) {

        case config.roles.purdue:
            if (student) {
                response = {content: "You are verified!", ephemeral: true}
                await addRole(config.roles.purdue, guildMember);
                await removeRole(config.roles.other, guildMember);
            } else response = {content: "Please follow these instructions to verify yourself:\n +" +
                    "1. Use `/verify start` to have a one-time code sent to your email.\n" +
                    "2. Use `/verify complete` with your one-time code.", ephemeral: true}
            break;

        case config.roles.other:
            if (hasRole) {
                response = {content: "You have removed the role **Other** from yourself.", ephemeral: true}
                await removeRole(config.roles.other, guildMember);
            } else {
                if (student) {
                    response = {content: "Purdue students cannot apply the Non-Purdue role.", ephemeral: true}
                } else {
                    response = {content: "You have applied the role **Other** to yourself.", ephemeral: true}
                    await addRole(config.roles.other, guildMember);
                }
            }
            break;

        case config.roles.registered:
            const command = bot.commands.get("register");
            response = await command.execute(interaction);
            break;

        case config.roles.ranks.champion:
            if (hasRole) {
                await removeRole(role.id, guildMember);
                response = {content: "I didn't believe you either\nYou removed the role **Champion** from yourself", ephemeral: true}
            } else {
                response = {content: "Nice try, bozo", ephemeral: true}
            }
            break;

        case config.roles.ranks.diamond:
            if (hasRole) {
                await removeRole(role.id, guildMember);
                response = {content: "Nothing lasts forever!\nYou removed the role **Diamond** from yourself", ephemeral: true}
            } else {
                response = {content: "Are you sure about that?", ephemeral: true}
            }
            break;

        case config.roles.ranks.platinum:
            if (hasRole) {
                await removeRole(role.id, guildMember);
                response = {content: "Back to the trenches.\nYou removed the role **Platinum** from yourself", ephemeral: true}
            } else {
                await addRole(role.id, guildMember);
                response = {content: "I knew you could do it!\nYou have applied the role **Platinum** to yourself", ephemeral: true}
            }
            break;

        case config.roles.ranks.gold:
            if (hasRole) {
                await removeRole(role.id, guildMember);
                response = {content: "Ranking up I hope?\nYou removed the role **Gold** from yourself", ephemeral: true}
            } else {
                response = {content: "This makes sense!\nYou applied the role **Gold** to yourself.", ephemeral: true}
                await addRole(role.id, guildMember);
            }
            break;

        case config.roles.ranks.silver:
            if (hasRole) {
                await removeRole(role.id, guildMember);
                response = {content: "Don't take anything for granted.\nYou removed the role **Silver** from yourself", ephemeral: true}
            } else {
                response = {content: "Not having much fun are we?\nYou applied the role **Silver** to yourself.", ephemeral: true}
                await addRole(role.id, guildMember);
            }
            break;

        case config.roles.ranks.bronze:
            if (hasRole) {
                response = {content: "Good or bad luck? You tell me.\nYou removed the role **Bronze** from yourself", ephemeral: true}
                await removeRole(role.id, guildMember);
            } else {
                response = {content: "Maybe something isn't working...\nYou applied the role **Bronze** to yourself.", ephemeral: true}
                await addRole(role.id, guildMember);
            }
            break;

        case config.roles.ranks.copper:
            if (hasRole) {
                response = {content: "Hope is on the horizon! (not)\nYou removed the role **Copper** from yourself", ephemeral: true}
                await removeRole(role.id, guildMember);
            } else {
                response = {content: "Achievement Got! How did we get here? But seriously.. how are you this lost?" +
                        "\nYou applied the role **Copper** to yourself.", ephemeral: true}
                await addRole(role.id, guildMember);
            }
            break;

        case config.roles.r6:
            if (hasRole) {
                response = {content: "You already have access!", ephemeral: true};
            } else {
                await addRole(role.id, guildMember);
                response = {content: "Welcome to the Club!", ephemeral: true}
            }
            break;

        default:
            if (!hasRole) {
                await addRole(role.id, guildMember);
                response = {content: `You applied the role **${role.name}** to yourself.`, ephemeral: true}
            } else {
                await removeRole(role.id, guildMember);
                response = {content: `You have removed the role **${role.name}** from yourself.`, ephemeral: true}
            }
            break;
    }

    return response;
}

/**
 * Adds a Role to a GuildMember
 * @param id
 * @param guildMember
 */
async function addRole(id: string, guildMember: GuildMember) {
    await guildMember.roles.add(id);
}

/**
 * Removes a Role from a GuildMember
 * @param id
 * @param guildMember
 */
async function removeRole(id: string, guildMember: GuildMember) {
    await guildMember.roles.remove(id);
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