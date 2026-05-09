import {MessageFlags, PermissionsBitField} from "discord.js";
import {LogsEmbed} from "../../../Builder/EmbedBuilder.js";
import {LogsActionsManagementBuilder} from "../../../Builder/Action/CommandActionBuilder.js";
import {config} from "dotenv";

config()

export async function LogsInteractionHandler(commandName, interaction) {
    /**
     * LOGS MANAGEMENT COMMAND
     */
    if (commandName === 'logs') {
        let replyObj = {
            embeds: [LogsEmbed()],
            components: LogsActionsManagementBuilder(),
            flags: MessageFlags.Ephemeral
        }

        return interaction.reply(replyObj)
    }
}
