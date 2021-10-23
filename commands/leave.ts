import {SlashCommandBuilder} from "@discordjs/builders";
import {Client, CommandInteraction, GuildMember, Snowflake, TextChannel} from "discord.js";
import {guild_id} from "../config.json";
import {server_roles} from "../roles.json";
import {User} from "../modules/db_types/User";
import {app} from "../index";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Leave the 10-mans queue.')
        .setDefaultPermission(false),
    async execute(interaction: CommandInteraction) {
        let guildMember;
        let channel;
        let members;
        let embed;
        let queue;
        let user;

        queue = app.queue;
        guildMember = interaction.member as GuildMember;
        channel = interaction.channel as TextChannel;
        user = await User.findByPk(guildMember.id.toString());

        if (!await queue.containsUser(user)) return  interaction.reply({content: "You are not currently in the queue.", ephemeral: true});

        members = await queue.remove(user);
        embed = await queue.buildEmbed(members);
        embed.setTitle(`**${user.username}** has left the queue. [${members.length}/10]`);
        await interaction.reply({embeds: [embed]});
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
        })
    }
}