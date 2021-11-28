import {channelMention, roleMention, userMention} from "@discordjs/builders";
import {REST} from "@discordjs/rest";
import Log, {LogType} from "./data/Log";
import Bot from "./data/Bot";
import {token} from "./config.json";
import {game_category, guild_id, lobby} from "./channels.json";
import {prefix_list} from "./blacklist.json";
import {server_roles} from "./roles.json";
import {
    ApplicationCommand, ButtonInteraction,
    Client, Collection, CommandInteraction,
    Guild, GuildMember, Message, MessageActionRow, MessageButton,
    MessageEmbed, Role, SelectMenuInteraction,
    Snowflake, TextChannel
} from "discord.js";
import * as fs from "fs";
import {Routes} from "discord-api-types/v9";
import {collections, connectToDatabase} from "./services/database.service";
import {playersRouter} from "./services/players.router";
import {teamsRouter} from "./services/teams.router";
import {gamesRouter} from "./services/games.router";
import * as express from "express";
import Game from "./data/db/Game";

export const bot = new Bot();
const app = express();
const client = bot.client;
const rest = new REST({ version: '9' }).setToken(token);
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
client["commands"] = new Collection();

client.login(token).then(async () => {
    let commands = [];

    //Connect to Database
    await connectToDatabase().then(() => {
        app.use("/players", playersRouter);
        app.use("/teams", teamsRouter);
        app.use("/games", gamesRouter);
      app.listen(28017, () => {
          console.log(`Server started at http://localhost:${28017}`);
      });
    }).catch((error: Error) => {
        console.error("Database connection failed", error);
        process.exit();
    });

    //Collect and Register Commands
    await collectAndSetCommandFiles(commands, commandFiles);
    await registerClientCommands(commands);
});

client.on('ready', async () => {
    const embed = new MessageEmbed().setTitle("Bot Restart - Queue has been emptied.").setColor("WHITE");
    const row = new MessageActionRow().addComponents(
        new MessageButton().setLabel("Join").setCustomId("join").setStyle("SUCCESS"),
        new MessageButton().setLabel("Leave").setCustomId("leave").setStyle("DANGER"),
        new MessageButton().setLabel("View").setCustomId("view").setStyle("SECONDARY"));
    const guild = await client.guilds.fetch(guild_id);
    const channel = await guild.channels.fetch(lobby) as TextChannel;
    await setRichPresence(client);
    await new Log(LogType.RESTART, 'Bot has been Restarted!').send();
    await channel.send({embeds: [embed], components: [row]});
});

client.on('interactionCreate', async interaction => {
    try {
        //Sort Interactions
        if (interaction.isButton()) await receiveButton(interaction);
        if (interaction.isSelectMenu()) await receiveSelectMenu(interaction);
        if (interaction.isCommand()) await receiveCommand(interaction);
        await new Log(LogType.INTERACTION, `Successful ${toProperCase(interaction.type)}`).send();
    } catch(error) {
        await new Log(LogType.ERROR, `${interaction.type}: ${error}\n
        Channel: ${channelMention(interaction.channelId)}\n
        User: ${userMention(interaction.user.id)}`).send();
    }
});

client.on('messageCreate', async message => {
    let parentId = (message.channel as TextChannel).parentId;

    if (parentId == game_category) {
        await receiveMessage(message);
    }
});

/**
 * Takes data from commands files (./commands/**) and set's them as client's commands
 * @param commands
 * @param commandFiles
 */
async function collectAndSetCommandFiles(commands, commandFiles) {
    for (let commandFile of commandFiles) {
        let command = require(`./commands/${commandFile}`);
        commands.push(command.data.toJSON());
        await client["commands"].set(command.data.name, command);
    }
}

/**
 * Takes commands and registers them with Discord Restful API, then sets their permissions
 * @param commands
 */
async function registerClientCommands(commands) {
    let id = client.application.id as Snowflake;
    let guild = client.guilds.cache.first() as Guild;
    console.log('Started refreshing application (/) commands.');

    try {
        await rest.put(
            Routes.applicationGuildCommands(id, guild.id),
            {body: commands},
        );

        let guildCommands = await rest.get(Routes.applicationGuildCommands(id, guild.id)) as Array <ApplicationCommand>;

        for (let guildCommand of guildCommands) {
            let command = client["commands"].get(guildCommand.name);
            await command.setPermissions(guildCommand.id, guild);
        }
    } catch (error) {
        console.error(error);
    }

    console.log('Successfully reloaded application (/) commands.');
}

/**
 * Executes logic on a Command Interaction
 * @param interaction
 */
async function receiveCommand(interaction: CommandInteraction) {
    const command = client["commands"].get(interaction.commandName);
    if (!command) return;

    let channel = interaction.channel as TextChannel;
    let parentId = await channel.parentId;
    if (parentId === game_category || interaction.commandName == "setup") {
        await command.execute(interaction);
    } else {
        await interaction.reply({content: "Unable to execute commands outside of PUPL channels.", ephemeral: true});
    }
}

/**
 * Executes logic on a Select Menu Interaction
 * @param interaction
 */
async function receiveSelectMenu(interaction: SelectMenuInteraction) {
    const playerId = interaction.values[0] as Snowflake;
    const guildMemberId = interaction.user.id as Snowflake;
    const channelId = interaction.channel.id;
    const game = await Game.fromObject(await collections.games.findOne({ _channel: channelId }));
    await game.pick(interaction, guildMemberId, playerId);
}

/**
 * Executes logic on a Button Interaction
 * @param interaction
 */
async function receiveButton(interaction: ButtonInteraction) {
    try {
        let id = interaction.customId;

        switch (id) {
            case "join": case "leave": case "view":
                await client["commands"].get("queue").execute(interaction, id);
                break;
            default:
                let role = await interaction.guild.roles.fetch(id);
                let guildMember = interaction.member as GuildMember;
                let response = await requestRole(role, guildMember, interaction);
                response ? await interaction.reply({content: response, ephemeral: true}) : 0;
        }

    } catch (e) {
       await new Log(LogType.ERROR, e).send();
    }
}

/**
 * Executes logic on a Message
 * @param message
 */
async function receiveMessage(message: Message) {
    for (const prefix of prefix_list) {
        if (message.content.startsWith(prefix)) {
            await message.reply({
                content: "These command types are no longer supported.",
                embeds: [new MessageEmbed().setDescription("[Discord FAQ - How to use Slash Commands](https://support.discord.com/hc/en-us/articles/1500000368501-Slash-Commands-FAQ)")]
            }).then(reply => {
                global.setTimeout(() => {
                    message.delete();
                    reply.delete();
                }, 5000);
            });
            await new Log(LogType.INTERACTION, `Successful ${toProperCase(message.type)}`).send();
        }
    }
}

/**
 * Executes logic for managing various roles from a ButtonInteraction
 * @param role
 * @param guildMember
 * @param interaction
 */
async function requestRole(role: Role, guildMember: GuildMember, interaction: ButtonInteraction) {
    let hasRole = await checkIfMemberHasRole(role.id, guildMember);
    let hasPurdueRole = await checkIfMemberHasRole(server_roles["purdue"]["id"], guildMember);

    switch (role.name) {

        case 'Purdue':
            if (hasRole) return "You already have this role.";
            else return `Use the command **/verify** in any channel to verify your purdue email and receive the Purdue role.`;

        case 'Other':
            if (hasRole) {
                await removeRoleFromMember(role.id, guildMember);
                return `You successfully removed the role **${roleMention(role.id)}** from yourself.`;
            } else {
                if (hasPurdueRole) return "You cannot receive this role because you already have the role 'Purdue'.";
                else {
                    await addRoleToMember(role.id, guildMember);
                    return `You successfully applied the role **${roleMention(role.id)}** to yourself.`;
                }
            }

        case 'Game Night':
            if (!hasRole) {
                await addRoleToMember(role.id, guildMember);
                return `You successfully applied the role **${roleMention(role.id)}** to yourself.`;
            } else {
                await removeRoleFromMember(role.id, guildMember);
                return`You successfully removed the role **${roleMention(role.id)}** from yourself.`;
            }

        case 'PUPL Registered':
            const command = client["commands"].get("register");
            await command.execute(interaction);
            return null;
    }
}

/**
 * Adds a Role to a GuildMember
 * @param snowflake
 * @param guildMember
 */
async function addRoleToMember(snowflake: Snowflake, guildMember: GuildMember) {
    await guildMember.roles.add(snowflake);
}

/**
 * Removes a Role from a GuildMember
 * @param snowflake
 * @param guildMember
 */
async function removeRoleFromMember(snowflake: Snowflake, guildMember: GuildMember) {
    await guildMember.roles.remove(snowflake);
}

/**
 * Determines whether a GuildMember has a certain Role
 * @param snowflake
 * @param guildMember
 */
async function checkIfMemberHasRole(snowflake: Snowflake, guildMember: GuildMember) {
    let result = false;
    let roles = guildMember.roles.cache;

    roles.forEach(role => {
        if (role.id === snowflake) result = true;
    })
    return result;
}

/**
 * Sets game status for Bot Client
 * @param client
 */
async function setRichPresence(client: Client) {
    let user;
    let activity;

    user = client.user;
    activity = {
        name: 'Learning to Love™',
        type: 'PLAYING'
    }

    user.setActivity(activity);
}

/**
 * Converts a string to Title Case
 * @param text
 */
function toProperCase(text: string) {
    return text.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}