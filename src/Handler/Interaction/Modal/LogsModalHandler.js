import {Logs} from "../../../Components/logs.js";
import {ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder} from "discord.js";
import {Cache} from "../../../Module/Cache.js";

/**
 * Handling log creation on modal submit
 * @param interaction
 * @returns {Promise<*|boolean>}
 */
export async function LogsCreation(interaction) {
    if (interaction.customId !== 'logs-create-modal') return false;

    /**
     * Get cached log
     * @type {*|null}
     */
    let logObj = await Logs.getCachedLog(interaction, 'create')
    if (!logObj) return false;

    // Accept submission from log creations only
    let title = interaction.fields.getTextInputValue('logs-create-modal-title')
    let description = logObj.isAnUpdate ? interaction.fields.getTextInputValue('logs-create-modal-description') : null
    let url = !logObj.isAnUpdate ? interaction.fields.getTextInputValue('logs-create-modal-link') : null
    let kind =  logObj.type === 'website' ? interaction.fields.getTextInputValue('logs-create-modal-kind') : null

    let interactionUpdate = {
        content: 'error',
        embeds: [],
        components: []
    }

    if (await Logs.create(4, interaction.user.id, interaction.message.id, {
        title: title, description: description, url: url, kind: kind
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

        // NEXT STEP : 4 - NOTIFICATION
        interactionUpdate = {
            embeds: [embed],
            components: [buttonsMenuBuilderRow, notificationButtons],
            ephemeral: true
        }
    }

    return await interaction.update(interactionUpdate)
}

/**
 * Handling log modification on modal submit
 * @param interaction
 * @returns {Promise<*|boolean>}
 */
export async function LogsUpdate(interaction) {
    if (interaction.customId !== 'logs-update-modal') return;
    let cachedLog = await Cache.retrieve(`log_update_${interaction.user.id}`)

    let obj = {}
    // Get fields values from the submitted modal
    if (cachedLog.isAnUpdate) {
        obj.description = interaction.fields.getTextInputValue('logs-update-description')
        if (cachedLog.type === 'website')
            obj.kind = interaction.fields.getTextInputValue('logs-update-kind')
    } else {
        obj.url = interaction.fields.getTextInputValue('logs-update-url')
    }

    if (!await Logs.update(interaction.user.id, obj, cachedLog)) {
        return await interaction.reply({content: 'Une erreur est survenue', ephemeral: true})
    }

    return await interaction.reply({content: 'Log modifié avec succès', ephemeral: true})
}
