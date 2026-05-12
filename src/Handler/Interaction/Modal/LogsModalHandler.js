import {Logs} from "../../../Components/logs.js";
import {MessageFlags} from "discord.js";
import {Cache} from "../../../Module/Cache.js";
import {LogsCreateNotificationStepBuilder} from "../../../Builder/Action/CommandActionBuilder.js";

/**
 * Handling log creation on modal submit
 * @param interaction
 * @returns {Promise<*|boolean>}
 */
export async function LogsCreation(interaction) {
    if (interaction.customId !== 'logs-create-modal') return false;

    // Quick-create path: modal shown directly from /logs new (no prior wizard message)
    if (!interaction.message) {
        return handleQuickCreateModal(interaction)
    }

    // Normal wizard flow
    let logObj = await Logs.getCachedLog(interaction, 'create')
    if (!logObj) return false;

    let title = interaction.fields.getTextInputValue('logs-create-modal-title')
    let description = logObj.isAnUpdate || !logObj.isAnUpdate && logObj.type === 'discord' ? interaction.fields.getTextInputValue('logs-create-modal-description') : null
    let url = null;
    if (logObj.type !== 'discord')
        url = !logObj.isAnUpdate ? interaction.fields.getTextInputValue('logs-create-modal-link') : null
    let kind = logObj.type === 'website' ? interaction.fields.getTextInputValue('logs-create-modal-kind') : null

    let interactionUpdate = {content: 'error', embeds: [], components: []}

    if (url && !isValidUrl(url)) {
        interactionUpdate.content = 'Url non valide'
        interactionUpdate.flags = MessageFlags.Ephemeral
        return await interaction.reply(interactionUpdate)
    }

    if (await Logs.create(4, interaction.user.id, interaction.message.id, {
        title, description, url, kind
    })) {
        interactionUpdate = {
            ...LogsCreateNotificationStepBuilder(interaction),
            flags: MessageFlags.Ephemeral
        }
    }

    return await interaction.update(interactionUpdate)
}

async function handleQuickCreateModal(interaction) {
    const quickData = Cache.retrieve(`${interaction.user.id}_quick`)
    if (!quickData) {
        return interaction.reply({content: 'Session expirée, veuillez recommencer', flags: MessageFlags.Ephemeral})
    }

    const {type, version} = quickData
    const title = interaction.fields.getTextInputValue('logs-create-modal-title')
    const url = type !== 'discord' ? interaction.fields.getTextInputValue('logs-create-modal-link') : null
    const description = type === 'discord' ? interaction.fields.getTextInputValue('logs-create-modal-description') : null
    const kind = type === 'website' ? interaction.fields.getTextInputValue('logs-create-modal-kind') : null

    if (url && !isValidUrl(url)) {
        return interaction.reply({content: 'Url non valide', flags: MessageFlags.Ephemeral})
    }

    await interaction.reply({...LogsCreateNotificationStepBuilder(), flags: MessageFlags.Ephemeral})
    const msg = await interaction.fetchReply()

    Cache.set(`${interaction.user.id}_${msg.id}_create`, {
        currentStep: 4,
        version,
        user: interaction.user.id,
        title,
        description,
        url,
        kind,
        type,
        isAnUpdate: false,
        notification: false,
        notificationDescription: null
    })

    Cache.clear(`${interaction.user.id}_quick`)
}

/**
 * Handling log modification on modal submit
 * @param interaction
 * @returns {Promise<*|boolean>}
 */
export async function LogsUpdate(interaction) {
    if (interaction.customId !== 'logs-update-modal') return;
    let cachedLog = await Cache.retrieve(`log_update_${interaction.user.id}`)

    if (!cachedLog) {
        return await interaction.reply({content: 'La commande a expiré, veuillez recommencer', flags: MessageFlags.Ephemeral})
    }

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
        return await interaction.reply({content: 'Une erreur est survenue', flags: MessageFlags.Ephemeral})
    }

    return await interaction.reply({content: 'Log modifié avec succès', flags: MessageFlags.Ephemeral})
}

const isValidUrl = urlString => {
    const urlPattern = new RegExp('^(https?:\\/\\/)' + // validate protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // validate domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // validate OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // validate port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // validate query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // validate fragment locator
    return !!urlPattern.test(urlString);
}
