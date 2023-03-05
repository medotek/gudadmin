import {PermissionsBitField} from "discord.js";
import {LogsEmbed} from "../../../Builder/EmbedBuilder.js";
import {LogsActionsManagementBuilder} from "../../../Builder/Action/CommandActionBuilder.js";
import {config} from "dotenv";
config()

export async function LogsInteractionHandler(commandName, interaction) {
    /**
     * LOGS MANAGEMENT COMMAND
     */
    if (commandName === 'logs') {
        /******************************************/
        /************ SHOW LOGS OPTIONS ***********/
        /******************************************/

        let hasPermissions = false;
        // Show the modal to a specific role
        if (interaction.member.permissions.has(PermissionsBitField.StageModerator)) {
            hasPermissions = true;
        } else {
            await interaction.guild.roles.fetch(process.env.GUDA_LOG_ALLOWED_ROLE).then(res => {
                hasPermissions = true;
            }).catch(err => {
                console.log(err)
            })
        }

        let replyObj = {
            content: "Vous n'avez pas les permissions nécessaires pour utiliser cette commande",
            ephemeral: true
        };

        if (hasPermissions) {
            delete replyObj.content
            replyObj.embeds = [LogsEmbed()]
            replyObj.components = LogsActionsManagementBuilder()
        }

        return interaction.reply(replyObj)
    }
}
