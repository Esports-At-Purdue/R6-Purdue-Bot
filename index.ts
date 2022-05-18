import Bot from "./objects/Bot";
import * as config from "./config.json";
import * as nodemailer from "nodemailer";
import {
    ButtonInteraction,
    CommandInteraction,
    GuildMember, InteractionReplyOptions, MessageActionRow, MessageEmbed, Modal, ModalSubmitInteraction,
    Role,
    SelectMenuInteraction,
    TextChannel, TextInputComponent
} from "discord.js";
import {collections} from "./database/database.service";
import Student from "./objects/Student";
import Registrant from "./objects/Registrant";
import {google} from "googleapis";
import * as fs from "fs";
import SoloRegistrationModal from "./objects/modals/Solo.Registration.Modal";
import DuoRegistrationModal from "./objects/modals/Duo.Registration.Modal";

export const bot = new Bot();
export let registrants: number = 0;
const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets"
});

bot.login(config.token).then();

bot.on('ready', async () => {
    await bot.init();
    readSpreadsheet().then(() => updateRegistrations().then());
});

bot.on('interactionCreate', async (interaction) => {
    if (interaction.isApplicationCommand()) return handleCommand(interaction as CommandInteraction);
    else if (interaction.isButton()) return handleButton(interaction as ButtonInteraction);
    else if (interaction.isSelectMenu()) return handleSelectMenu(interaction as SelectMenuInteraction);
    else if (interaction.isModalSubmit()) return handleModal(interaction as ModalSubmitInteraction);
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
    await guildMember.roles.add(config.roles.other);
});

bot.on('warn', async (warning) => {
    await bot.logger.warn(warning);
});

/**
 * Executes logic on a Command Interaction
 * @param interaction
 */
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

/**
 * Executes logic on a Button Interaction
 * @param interaction
 */
async function handleButton(interaction: ButtonInteraction) {
    try {
        let response, modal;
        let id = interaction.customId;
        switch (id) {
            case "join": case "leave": case "bump":
                response = await bot.commands.get("queue").execute(interaction);
                break;

            case "solo":
                modal = new SoloRegistrationModal();
                await interaction.showModal(modal);

                break;

            case "duo":
                modal = new DuoRegistrationModal();
                await interaction.showModal(modal);

                break;

            default:
                let role = await interaction.guild.roles.fetch(id);
                let guildMember = interaction.member as GuildMember;
                response = await requestRole(role, guildMember, interaction);
        }
        if (response && response.content != null) {
            await interaction.reply(response);
        }
        await bot.logger.info(`${interaction.component.label} button used by ${interaction.user.username}`);
    } catch (error) {
        await bot.logger.error(`${interaction.component.label} button used by ${interaction.user.username} failed`, error);
        try {
            await interaction.reply({content: "There was an error handling this button.", ephemeral: true});
        } catch (ignored) {}
    }
}

/**
 * Executes logic on a SelectMenu Interaction
 * @param selectMenu
 */
async function handleSelectMenu(selectMenu: SelectMenuInteraction) {
    let response;
    try {
        response = await bot.commands.get("pick").execute(selectMenu);
        await bot.logger.info(`Select Menu option ${selectMenu.values[0]} selected by ${selectMenu.user.username}`);

        if (response != null && !selectMenu.replied) {
            await selectMenu.reply(response);
        }
    } catch (error) {
        await bot.logger.error(`Select Menu option ${selectMenu.values[0]} selected by ${selectMenu.user.username} failed`, error);
        await selectMenu.reply({content: "There was an error handling this menu.", ephemeral: true});
    }
}

/**
 * Executes logic on a ModalSubmit Interaction
 * @param interaction
 */
async function handleModal(interaction: ModalSubmitInteraction) {
    let response = {content: null, ephemeral: true};
    let student: Student;
    let discord, uplay, purdue, captain, registrant, payment, json;
    switch (interaction.customId) {
        case "verify-start":
            let email = interaction.fields.getTextInputValue("email");
            student = Student.fromObject(await collections.students.findOne({_email: email}));
            if (student != null) {
                if (student.status) {
                    response.content = "This email is already in use.";
                } else {
                    await Student.delete(student);
                    let code = Math.floor(100000 + Math.random() * 900000);
                    let username = interaction.user.username;
                    await sendEmail(email, code);
                    await bot.logger.info(`New Student Registered - Username: ${username}`)
                    await Student.post(new Student(interaction.user.id, username, email, code, false));
                    response.content = `An email containing your one-time code was sent to \`${email}\`. Click the **Purdue Button** to submit your code!`;
                }
            } else {
                if (isValidEmail(email)) {
                    let code = Math.floor(100000 + Math.random() * 900000);
                    let username = interaction.user.username;
                    await sendEmail(email, code);
                    await bot.logger.info(`New Student Registered - Username: ${username}`)
                    await Student.post(new Student(interaction.user.id, username, email, code, false));
                    response.content = `An email containing your one-time code was sent to \`${email}\`. Click the **Purdue Button** to submit your code!`;
                } else {
                    response.content = `The email you provided, \`${email}\`, is invalid. Please provide a valid Purdue email.`;
                }
            }
            break;

        case "verify-complete":
            student = await Student.get(interaction.user.id);
            if (student) {
                let code = Number.parseInt(interaction.fields.getTextInputValue("code"));
                if (student.status) {
                    response = {content: "You are verified.", ephemeral: true};
                    await (interaction.member as GuildMember).roles.add(config.roles.purdue);
                    await (interaction.member as GuildMember).roles.remove(config.roles.other);
                } else if (code == student.code) {
                    student.code = 0;
                    student.status = true;
                    Student.put(student).then(() => {
                        (interaction.member as GuildMember).roles.add(config.roles.purdue);
                        (interaction.member as GuildMember).roles.remove(config.roles.other);
                        bot.logger.info(`Student Verified - Username: ${student.username}`);
                    }).catch();
                    response = {content: "You have successfully been authenticated!", ephemeral: true};
                } else response = {content: "Sorry, this code is incorrect.", ephemeral: true};
            }
            break;

        case "duo":
            if (fs.existsSync("./registrants.json")) {
                json = JSON.parse(fs.readFileSync("./registrants.json").toString());
            } else {
                json = {}
            }
            let partnerUplay = interaction.fields.getTextInputValue("partner-uplay");
            discord = interaction.user.tag;
            uplay = interaction.fields.getTextInputValue("uplay");
            purdue = (interaction.fields.getTextInputValue("purdue").toLowerCase() === "yes");
            payment = interaction.fields.getTextInputValue("payment");
            captain = (interaction.fields.getTextInputValue("captain").toLowerCase() === "yes");
            if (uplay.length < 1) response.content = "Invalid Uplay username, please try again";
            else {
                if (payment.length < 1) response.content = "Invalid payment information, please try again";
                else {
                    if (partnerUplay.length < 1) response.content = "Invalid Partner Uplay username, please try again";
                    else {
                        registrant = new Registrant(uplay, discord, purdue, payment, true, false, captain, partnerUplay);
                        json[registrant.discord] = registrant;
                        fs.writeFileSync("./registrants.json", JSON.stringify(json, null, 2));
                        response.content = `Your registration has been submitted.`;
                    }
                }
            }

            break;

        case "solo":
            if (fs.existsSync("./registrants.json")) {
                json = JSON.parse(fs.readFileSync("./registrants.json").toString());
            } else {
                json = {}
            }
            discord = interaction.user.tag;
            uplay = interaction.fields.getTextInputValue("uplay");
            purdue = (interaction.fields.getTextInputValue("purdue").toLowerCase() === "yes");
            payment = interaction.fields.getTextInputValue("payment");
            captain = (interaction.fields.getTextInputValue("captain").toLowerCase() === "yes");

            if (uplay.length < 1) response.content = "Invalid Uplay username, please try again";
            else {
                if (payment.length < 1) response.content = "Invalid payment information, please try again";
                else {
                    registrant = new Registrant(uplay, discord, purdue, payment, true, false, captain, null);
                    json[registrant.discord] = registrant;
                    fs.writeFileSync("./registrants.json", JSON.stringify(json, null, 2));
                    response.content = `Your registration has been submitted.`;
                }
            }

            break;
    }

    if (response.content != null) {
        await interaction.reply(response);
    }
}

/**
 * Executes logic for managing role requests
 * @param role the requested role
 * @param guildMember the requester
 * @param interaction the interaction
 */
async function requestRole(role: Role, guildMember: GuildMember, interaction: ButtonInteraction) {
    let response: InteractionReplyOptions = {content: null, ephemeral: true};
    let hasRole = await checkIfMemberHasRole(role.id, guildMember);
    let student = await Student.get(guildMember.id);

    switch (role.id) {

        case config.roles.purdue:
            if (student) {
                if (student.status) {
                    response.content = "You are verified!";
                    await addRole(config.roles.purdue, guildMember);
                    await removeRole(config.roles.other, guildMember);
                } else {
                    let modal = new Modal().setCustomId("verify-complete").setTitle("Purdue Verification");
                    let codeInput = new TextInputComponent().setCustomId("code").setLabel("Enter your one-time code.").setStyle("SHORT");
                    // @ts-ignore
                    let row = new MessageActionRow().addComponents(codeInput);
                    // @ts-ignore
                    modal.addComponents(row);
                    await interaction.showModal(modal);
                }
            } else {
                let modal = new Modal().setCustomId("verify-start").setTitle("Purdue Verification");
                let emailInput = new TextInputComponent().setCustomId("email").setLabel("What is your Purdue email address?").setStyle("SHORT");
                let row = new MessageActionRow().addComponents(emailInput);
                // @ts-ignore
                modal.addComponents(row);
                await interaction.showModal(modal);
            }
            break;

        case config.roles.other:
            if (hasRole) {
                response.content = "You have removed the role **Other** from yourself.";
                await removeRole(config.roles.other, guildMember);
            } else {
                if (student) {
                    response.content = "Purdue students cannot apply the Non-Purdue role.";
                } else {
                    response.content = "You have applied the role **Other** to yourself.";
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
                response.content = "I didn't believe you either\nYou removed the role **Champion** from yourself";
            } else {
                await addRole(role.id, guildMember);
                response.content = "Haha, sure buddy.\nYou have applied the role **Champion** to yourself";
            }
            break;

        case config.roles.ranks.diamond:
            if (hasRole) {
                await removeRole(role.id, guildMember);
                response.content = "Nothing lasts forever!\nYou removed the role **Diamond** from yourself";
            } else {
                await addRole(role.id, guildMember);
                response.content = "Are you sure about that?\n You have applied the role **Diamond** to yourself";
            }
            break;

        case config.roles.ranks.platinum:
            if (hasRole) {
                await removeRole(role.id, guildMember);
                response.content = "Back to the trenches.\nYou removed the role **Platinum** from yourself";
            } else {
                await addRole(role.id, guildMember);
                response.content = "I knew you could do it!\nYou have applied the role **Platinum** to yourself";
            }
            break;

        case config.roles.ranks.gold:
            if (hasRole) {
                await removeRole(role.id, guildMember);
                response.content = "Ranking up I hope?\nYou removed the role **Gold** from yourself";
            } else {
                response.content = "This makes sense!\nYou applied the role **Gold** to yourself.";
                await addRole(role.id, guildMember);
            }
            break;

        case config.roles.ranks.silver:
            if (hasRole) {
                await removeRole(role.id, guildMember);
                response.content = "Don't take anything for granted.\nYou removed the role **Silver** from yourself";
            } else {
                response.content = "Not having much fun are we?\nYou applied the role **Silver** to yourself.";
                await addRole(role.id, guildMember);
            }
            break;

        case config.roles.ranks.bronze:
            if (hasRole) {
                response.content = "Good or bad luck? You tell me.\nYou removed the role **Bronze** from yourself";
                await removeRole(role.id, guildMember);
            } else {
                response.content = "Maybe something isn't working...\nYou applied the role **Bronze** to yourself.";
                await addRole(role.id, guildMember);
            }
            break;

        case config.roles.ranks.copper:
            if (hasRole) {
                response.content = "Hope is on the horizon! (not)\nYou removed the role **Copper** from yourself";
                await removeRole(role.id, guildMember);
            } else {
                response.content = "Achievement Got! How did we get here? But seriously.. how are you this lost?" +
                    "\nYou applied the role **Copper** to yourself.";
                await addRole(role.id, guildMember);
            }
            break;

        case config.roles.r6:
            if (hasRole) {
                response.content = "You already have access!";
            } else {
                await addRole(role.id, guildMember);
                response.content = "Welcome to the Club!";
            }
            break;

        default:
            if (!hasRole) {
                await addRole(role.id, guildMember);
                response.content = `You applied the role **${role.name}** to yourself.`;
            } else {
                await removeRole(role.id, guildMember);
                response.content = `You have removed the role **${role.name}** from yourself.`;
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
 * Reads values from the Google Spreadsheet
 */
async function readSpreadsheet() {
    let json;
    const googleSheets = google.sheets({version: "v4", auth: await auth.getClient()});

    // Get metadata about spreadsheet
    const metaData = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId: config.spreadsheet,
        range: "Responses!B:I"
    });

    if (fs.existsSync("./registrants.json")) {
        json = JSON.parse(fs.readFileSync("./registrants.json").toString());
    } else {
        json = {}
    }

    const data = metaData.data.values;

    for (let i = 0; i < data.length; i++) {
        let values = data[i];
        let uplay = values[0];
        let discord = values[1];
        let purdue = values[2] === "true";
        let payment = values[3];
        let captain = values[7] === "Yes";

        if (values[4] == "Solo") {
            json[discord] = new Registrant(uplay, discord, purdue, payment, true, false, captain,null)
        } else if (values[4] == "Sub") {
            json[discord] = new Registrant(uplay, discord, purdue, payment, false, true, captain,null)
        } else if (values[4] == "Duo") {
            let partnerUplay = values[6];
            let duo = false;
            for (const name in json) {
                let registrant = json[name];
                if (registrant.uplay === partnerUplay) {
                    json[name].partner = uplay;
                    duo = true;
                }
            }
            if (!duo) {
                json[discord] = (new Registrant(uplay, discord, purdue, payment,false, false, captain,null));
            }
        }
    }

    fs.writeFileSync("./registrants.json", JSON.stringify(json, null, 2));
    setTimeout(readSpreadsheet, 60000);
}

/**
 * Updates the registrants list and notifies Discord of changes
 */
async function updateRegistrations() {
    let json;
    if (fs.existsSync("./registrants.json")) {
        json = JSON.parse(fs.readFileSync("./registrants.json").toString());
    } else {
        json = {}
    }

    let previousTotal = registrants;
    registrants = 0;
    let embed = new MessageEmbed().setColor("#8bc34a");
    let soloField = {name: "Solos", value: "", inline: true};
    let duoField = {name: "Duos", value: "", inline: true};
    let subField = {name: "Subs", value: "", inline: true}

    for (const name in json) {
        let registrant = Registrant.fromObject(json[name]);
        if (registrant.solo) {
            soloField.value += `${registrant.uplay}\n`;
            registrants += 1;
        } else if (registrant.sub) {
            subField.value += `${registrant.uplay}\n`
        } else {
            if (registrant.partner != null) {
                registrants += 2;
                duoField.value += `${registrant.uplay} + ${registrant.partner}\n`;
            } else {
                registrants += 1;
                duoField.value += `${registrant.uplay} + **Unconfirmed**\n`;
            }
        }
    }

    embed.addField(soloField.name, soloField.value, soloField.inline);
    embed.addField(duoField.name, duoField.value, duoField.inline);
    embed.addField(subField.name, subField.value, subField.inline);
    embed.setTitle(`Spots Remaining: ${50 - registrants}`);

    let webhook = await bot.fetchWebhook(config.webhooks.registration.id, config.webhooks.registration.token);
    let channel = await bot.guild.channels.fetch(config.channels.registrations) as TextChannel;

    if (previousTotal !== registrants) {
        try {
            await channel.messages.fetch({limit: 1}).then(messages => {
                messages.first().delete();
            })
        } catch {}
        await webhook.send({embeds: [embed]});
    }

    setTimeout(updateRegistrations, 60000);
}

/**
 * Parses the provided email address and confirms that is valid
 * @param email the provided email address
 */
function isValidEmail(email): boolean {
    let emailRegEx = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/m);
    let matches = email.toLowerCase().match(emailRegEx);
    if (matches != null) {
        return matches[0].endsWith('@purdue.edu') || matches[0].endsWith('@alumni.purdue.edu') || matches[0].endsWith("@student.purdueglobal.edu");
    }
    return false;
}

/**
 * Sends an authentication code to a provided email address
 * @param email
 * @param code
 */
async function sendEmail(email, code) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: config.email.username,
            pass: config.email.password
        }
    });
    let mailOptions = {
        from: config.email.username,
        to: email,
        subject: 'PUGG Discord Account Verification',
        text: `Use this one-time code to verify your account!\n
               Code: ${code}\n
               Use the \'Purdue Button\' in #verify!`
    };

    await transporter.sendMail(mailOptions, async function (error, info) {
        if (error) await bot.logger.error(`An error occurred sending an email to ${email}`, error);
        else await bot.logger.info("Verification email sent");
    });
}
