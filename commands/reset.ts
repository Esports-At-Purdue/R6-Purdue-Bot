import {SlashCommandBuilder} from "@discordjs/builders";
import {Client, CommandInteraction, Snowflake} from "discord.js";
import {guild_id} from "../config.json";
import {User} from "../modules/db_types/User";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reset')
        .setDescription('Resets the User DB')
        .setDefaultPermission(false),
    async execute(interaction: CommandInteraction) {
        let guild = interaction.guild;
        let members = guild.members.cache;

        await User.drop();
        await interaction.reply({content: "Database has been wiped!"});
    },
    async setPermissions(client: Client, commandId: Snowflake) {
        let guild = await client.guilds.fetch(guild_id);
        let commandPermissionsManager = guild.commands.permissions;

        await commandPermissionsManager.add({
            command: commandId, permissions: [
                {
                    id: '751910711218667562',
                    type: 'USER',
                    permission: true
                },
            ]
        })
    }
}

