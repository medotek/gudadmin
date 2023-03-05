import {LogsCreateActionBuilderStep1} from "../../../Builder/Action/CommandActionBuilder.js";
export async function LogsButtonInteractionHandler(interaction) {
    if (interaction.message.interaction.commandName !== 'logs'
        || typeof interaction.customId === 'undefined')
        return

    switch (interaction.customId) {
        case 'logs-create':
            await interaction.update(LogsCreateActionBuilderStep1(interaction))
        // await interaction.showModal(LogsCRUDModalBuilder(interaction))
        case 'logs-modify':
            break;
        case 'logs-delete':
            break;
    }
}
