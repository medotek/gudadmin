import {LogsCreateActionBuilderStep1} from "../../../Builder/Action/CommandActionBuilder.js";

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
            break;
        case 'logs-notification-action-false':
            break;
    }
}
