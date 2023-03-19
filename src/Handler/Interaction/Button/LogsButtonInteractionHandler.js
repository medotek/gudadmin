import {LogsCreateActionBuilderStep1} from "../../../Builder/Action/CommandActionBuilder.js";
import {Logs} from "../../../Components/logs.js";

export async function LogsButtonInteractionHandler(interaction) {
    if (interaction.message.interaction.commandName !== 'logs'
        || typeof interaction.customId === 'undefined')
        return

    console.log(interaction.customId)
    switch (interaction.customId) {
        // LOGS INIT ACTIONS
        case 'logs-create':
            let newInteraction = await LogsCreateActionBuilderStep1(interaction)
            await interaction.update(newInteraction)
        case 'logs-modify':
            break;
        case 'logs-delete':
            break;
        // STEP 4 - NOTIFICATION
        case 'logs-notification-action-true':
            let result1 = await logNotificationDTO(interaction, true)
            if (result1 && typeof result1 === 'string')
                await interaction.update({content: result1})
            break;
        case 'logs-notification-action-false':
            let result2 = await logNotificationDTO(interaction, false)
            if (result2 && typeof result2 === 'string')
                await interaction.update({content: result2})
            break;
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
