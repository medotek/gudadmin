import {Logs} from "../../../Components/logs.js";
import {
    LogsCreateActionBuilderStep2,
    LogsCreateActionBuilderStep3, LogsCRUDModalBuilder
} from "../../../Builder/Action/CommandActionBuilder.js";

export async function LogsSelectInteractionHandler(interaction) {
    let value = interaction.values[0]
    switch (interaction.customId) {
        case 'create-log-version':

            if (await Logs.create(1, interaction.user.id, interaction.message.id, value)) {
                let newInteraction1 = await LogsCreateActionBuilderStep2(interaction)
                await interaction.update(newInteraction1)
            } else {
                await interaction.update({content: 'Error', components: [], embeds: []})
            }
            break

        case 'create-log-type':

            if (await Logs.create(2, interaction.user.id, interaction.message.id, value)) {
                let newInteraction2 = await LogsCreateActionBuilderStep3(interaction)
                await interaction.showModal(newInteraction2)
            } else {
                await interaction.update({content: 'Error', components: [], embeds: []})
            }
            break

        case 'update-log-select':
            // Update log from SELECT action
            let modal = await LogsCRUDModalBuilder(interaction, 'select', value)
            if (!modal) return await interaction.reply({content:'Error thrown', ephemeral:true})

            await interaction.showModal(modal)
        default:
    }
}
