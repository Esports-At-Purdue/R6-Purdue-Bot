import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, Guild, MessageActionRow, MessageButton, MessageEmbed, Snowflake} from "discord.js";
import {guild_id} from "../channels.json";
import {server_roles} from "../roles.json";
import {bot} from "../App";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('General-purpose command for menu setup')
        .setDefaultPermission(false)

        // Server-Roles-Menu
        .addSubcommand((command) => command
            .setName('roles')
            .setDescription('Reaction roles menu subcommand')
        )
    ,

    async execute(interaction: CommandInteraction) {
        const command = interaction.options.getSubcommand();

        switch (command) {
            case 'roles':
                try {
                    await interaction.reply({embeds: [roleMenuEmbed()], components: [await roleMenuRow()]});
                } catch (e) {
                    console.log(e);
                }
                break;
        }
    },

    async setPermissions(commandId: Snowflake, guild: Guild) {
        let commandPermissionsManager = guild.commands.permissions;

        await commandPermissionsManager.set({
            command: commandId,
            permissions: [
                {
                    id: server_roles["administrator"]["id"],
                    type: 'ROLE',
                    permission: true
                },
            ]
        })
    }
}

const roleMenuEmbed = () => {
    return new MessageEmbed()
        .setTitle("R6@Purdue Server Roles")
        .setDescription("" +
            "• Purdue - React if you are an alumnus, student, or incoming freshman.\n" +
            "• Other - React if you aren't affiliated with Purdue.\n" +
            "• Games - React to recieve access game night channels and notifications.\n" +
            "• PUPL - React to recieve access to ten-mans channels and notifications.");
}

const roleMenuRow = async () => {
    let guild = await bot.client.guilds.fetch(guild_id);
    return new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setLabel("Purdue")
                .setStyle('SECONDARY')
                .setEmoji("911713113521414204")
                .setCustomId(server_roles["purdue"]["id"]),
            new MessageButton()
                .setLabel("Other")
                .setStyle('SECONDARY')
                .setEmoji("🚫")
                .setCustomId("637144661106098228"),
            new MessageButton()
                .setLabel("Games")
                .setStyle('SECONDARY')
                .setEmoji("🎲")
                .setCustomId("909210348500955158"),
            new MessageButton()
                .setLabel("PUPL")
                .setStyle('SECONDARY')
                .setEmoji(await guild.emojis.fetch("656221304034295859"))
                .setCustomId(server_roles["verified"]["id"])
        )
}