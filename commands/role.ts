import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("role")
        .setDescription("role management cmd")
        .setDefaultPermission(false)

        // add - subcommand
        .addSubcommand((command) => command
            .setName('add')
            .setDescription('Adds and removes roles')
            .addRoleOption((role) => role
                .setName("role")
                .setDescription("role to add")
                .setRequired(true)
            )
            .addUserOption((user) => user
                .setName("target")
                .setDescription("user to modify")
                .setRequired(true)
            )
        )

        // remove - subcommand
        .addSubcommand((command) => command
            .setName('remove')
            .setDescription('Command to remove role')
            .addRoleOption((role) => role
                .setName("role")
                .setDescription("role to remove")
                .setRequired(true)
            )
            .addUserOption((user) => user
                .setName("target")
                .setDescription("user to modify")
                .setRequired(true)
            )
        ),

    permissions: [
        {
            id: "751910711218667562",
            type: 'USER',
            permission: true
        }
    ],

    async execute(interaction: CommandInteraction) {
        let guild = interaction.guild;
        let subCommand = interaction.options.getSubcommand();
        let guildRole = interaction.options.getRole("role");
        let user = interaction.options.getUser("target");
        let guildMember = await guild.members.fetch(user);

        try {
            switch(subCommand) {
                case "add":
                    await guildMember.roles.add(guildRole.id);
                    break;
                case "remove":
                    await guildMember.roles.remove(guildRole.id);
            }
        } catch(e) {}

        await interaction.reply({content: "success", ephemeral: true});
    }
}