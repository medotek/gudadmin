import {
    LogsCreateActionBuilderStep1,
    LogsSelectActionBuilder
} from "../../../Builder/Action/CommandActionBuilder.js";
import {Logs} from "../../../Components/logs.js";
import {Cache} from "../../../Module/Cache.js";
import {fetchResponse} from "../../../Request/Command/Logs.js";

export async function LogsButtonInteractionHandler(interaction) {
    if (interaction.message.interaction) {
        if (interaction.message.interaction.commandName !== 'logs'
            || typeof interaction.customId === 'undefined')
            return

        switch (interaction.customId) {
            // LOGS INIT ACTIONS
            case 'logs-create':
                let newInteraction = await LogsCreateActionBuilderStep1(interaction)
                await interaction.update(newInteraction)
                break;
            case 'logs-update':
                let updateInteraction = await LogsSelectActionBuilder(interaction, 'update')
                await interaction.update(updateInteraction)
                break;
            // STEP 4 - NOTIFICATION
            case 'logs-notification-action-true':
                // Final step - return content only
                await handleLogNotification(interaction, true)
                break;
            case 'logs-notification-action-false':
                await handleLogNotification(interaction, false)
                break;
            case 'logs-delete':
                let deleteInteraction = await LogsSelectActionBuilder(interaction, 'delete')
                await interaction.update(deleteInteraction)
                break;
            default:
                await interaction.reply({content: 'Error thrown', ephemeral: true})
        }
    } else {
        if (!interaction.customId) {
            return await interaction.reply({content: 'No custom id found', ephemeral: true})
        }

        let splitMessage = interaction.message.content.split('/')
        if (splitMessage.length === 1)
            splitMessage = interaction.message.content.split('#')
        if (!splitMessage) {
            return await interaction.reply({content: 'No message id found', ephemeral: true})
        }

        let logRef = null
        let messageId = null
        if (splitMessage.length === 2) {
            logRef = splitMessage[1]
        } else {
            messageId = splitMessage[splitMessage.length - 1]
        }

        if (interaction.customId === 'logs-delete-confirm') {
            let channel = interaction.guild.channels.cache.get(process.env.GUDA_LOG_NOTIFICATION_CHANNEL)
            let cacheId = 'log_delete_' + (logRef ? 'select_' : '') + interaction.user.id + (messageId ? `_${messageId}` : '')
            let logId = await Cache.retrieve(cacheId)

            if (!logId) return await interaction.reply({
                content: `La commande a expiré, veuillez recommencer`,
                ephemeral: true
            })

            const response = await fetchResponse(`logs/delete/${logId}`, false, '', 'DELETE')
            if (!channel || typeof response !== 'object' || !response.hasOwnProperty('success') || !response.success) return

            if (messageId) {
                let notifiedLog = await channel.messages.fetch(messageId)
                if (!notifiedLog) return await interaction.reply({
                    content: "Error thrown",
                    ephemeral: true
                })

                // Delete notified log
                await notifiedLog.delete();
            }

            // Reply to interaction
            await interaction.reply({
                content: "Log supprimé",
                ephemeral: true
            })

            // Clear cached log id
            Cache.clear(cacheId)
        }

        // In case the message has already been deleted by the setTimeout func
        try {
            // Delete confirm message
            await interaction.message.delete();
        } catch (e) {
            // Prevent from throwing errors
        }
    }
}

/**
 * STEP 4 - Notification DTO - at creation only
 * @param interaction
 * @param notification
 * @returns {Promise<boolean>}
 */
async function logNotificationDTO(interaction, notification = false) {
    let currentLog = await Logs.getCachedLog(interaction)
    if (!currentLog) return false;

    // STEP 4
    return await Logs.create(4, interaction.user.id, interaction.message.id, notification)
}

/**
 * @param interaction
 * @param bool
 * @returns {Promise<void>}
 */
async function handleLogNotification(interaction, bool) {
    let result = await logNotificationDTO(interaction, bool)
    if (result && typeof result === 'string')
        await interaction.update({content: result, embeds: [], components: []})
    else
        await interaction.update({content: "Une erreur est survenue lors de la création du log", embeds: [], components: []})
}
