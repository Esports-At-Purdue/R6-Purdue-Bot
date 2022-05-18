import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, InteractionReplyOptions, MessageAttachment} from "discord.js";
import * as Canvas from "canvas";
import * as fs from "fs";
import PictureImage from "../objects/images/Picture.Image";

module.exports = {

    data: new SlashCommandBuilder()
        .setName("pfp")
        .setDescription("Creates a custom R6@Purdue pfp")
        .setDefaultPermission(false)

        .addStringOption((string) => string
            .setName("hex")
            .setDescription("A hexadecimal option to set your profile color to")
            .setRequired(false)
        )
    ,

    async execute(interaction: CommandInteraction): Promise<InteractionReplyOptions> {
        let json;
        let color: string;
        let response: InteractionReplyOptions = {content: `<@${interaction.user.id}>`, ephemeral: true};
        let hex = interaction.options.getString("hex");
        if (fs.existsSync("./colors.json")) {
            json = JSON.parse(fs.readFileSync("./colors.json").toString());
        } else {
            json = {}
        }
        if (hex) {
            if (validHex(hex)) {
                color = hex.replace("#", "");
                for (const value in json) {
                    if (getSimilarity(json[value], color) < 10) {
                        if (value != interaction.user.id) response.content = `Sorry, this color is too similar to <@!${value}>'s color`;
                    }
                }
                json[interaction.user.id] =  color;
                fs.writeFileSync("./colors.json", JSON.stringify(json, null, 2));
            } else {
                response.content = `Sorry, the hex code your provided, \`${hex}\`, is invalid.`;
            }
        }
        else if (json[interaction.user.id] != null) {
            color = json[interaction.user.id];
            response.files = [await PictureImage.build(color, interaction.user.username)];
        } else {
            let invalid = true;
            color = Math.floor(Math.random()*16777215).toString(16);
            while (invalid) {
                invalid = false;
                for (const value in json) {
                    if (getSimilarity(json[value], color) < 10) {
                        invalid = true;
                        color = Math.floor(Math.random()*16777215).toString(16);
                        break;
                    }
                }
            }
            json[interaction.user.id] =  color;
            response.files = [await PictureImage.build(color, interaction.user.username)];
            fs.writeFileSync("./colors.json", JSON.stringify(json, null, 2));
        }
        return response;
    }
}

function validHex(hex) {
    let pattern = new RegExp("^#([a-fA-F0-9]){3}$|[a-fA-F0-9]{6}$");
    return pattern.test(hex);
}

function getSimilarity(one, two) {
    let result;
    let r1, r2, g1, g2, b1, b2;
    try {
        result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(one);
        r1 = parseInt(result[1], 16);
        g1 = parseInt(result[2], 16);
        b1 = parseInt(result[3], 16);
        result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(two);
        r2 = parseInt(result[1], 16);
        g2 = parseInt(result[2], 16);
        b2 = parseInt(result[3], 16);

        let mean = ( r1 + r2 ) / 2;
        let r = r1 - r2;
        let g = g1 - g2;
        let b = b1 - b2;

        return Math.pow((((512 + mean) * r * r) >> 8) + 4 * g * g + (((767 - mean) * b * b) >> 8), 0.5);
    } catch (e) {
        return 0;
    }
}