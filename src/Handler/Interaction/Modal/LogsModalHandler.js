import {fetchResponse} from "../../../Request/Command/Logs.js";
import {Logs} from "../../../Components/logs.js";
import {ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder} from "discord.js";

export async function LogsSubmitModalHandler(interaction) {
    if (interaction.customId !== 'logs-create-modal') return false;

    // TODO : Logs create - next step (4) -> notify -> (5) -> create log from post request
    let title = interaction.fields.getTextInputValue('logs-create-modal-title')
    let description = interaction.fields.getTextInputValue('logs-create-modal-description')
    let link = interaction.fields.getTextInputValue('logs-create-modal-link')

    /**
     * Get cached log
     * @type {*|null}
     */
    let logObj = await Logs.getCachedLog(interaction, 'create')
    if (!logObj) return false;

    let interactionUpdate = {
        content: 'error',
        embeds: [],
        components: []
    }

    if (await Logs.create(3, interaction.user.id, interaction.message.id, {
        title: title, description: description, link: link
    })) {
        let embed = new EmbedBuilder();
        embed.setDescription(interaction.message.embeds[0].description)
            .addFields({name: 'Action courante', value: 'Souhaites-tu que cela soit notifié sur discord ?'},)

        let buttonsMenuBuilderRow = new ActionRowBuilder().addComponents(new ButtonBuilder()
            .setCustomId('logs-return-action')
            .setLabel('Retour')
            .setStyle(ButtonStyle.Secondary))

        let notificationButtons = new ActionRowBuilder().addComponents(new ButtonBuilder()
                .setCustomId('logs-notification-action-true')
                .setLabel('Oui')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('logs-notification-action-false')
                .setLabel('Non')
                .setStyle(ButtonStyle.Danger))

        // STEP 4 - NOTIFICATION
        interactionUpdate = {
            embeds: [embed],
            components: [buttonsMenuBuilderRow, notificationButtons]
        }
    }

    return await interaction.update(interactionUpdate)
}
