import {MessageFlags} from "discord.js";
import {LogsEmbed} from "../../../Builder/EmbedBuilder.js";
import {
    LogsActionsManagementBuilder,
    LogsCreateActionBuilderStep4Twitter,
    buildLogCreationModal
} from "../../../Builder/Action/CommandActionBuilder.js";
import {fetchResponse, getLatestVersionId} from "../../../Request/Command/Logs.js";
import {Cache} from "../../../Module/Cache.js";
import {config} from "dotenv";

config()

export async function LogsInteractionHandler(commandName, interaction) {
    if (commandName === 'logs') {
        const isNew = interaction.options?.getBoolean('new')
        const type = interaction.options?.getString('type')

        if (isNew && type) {
            return handleQuickCreate(interaction, type)
        }

        return interaction.reply({
            embeds: [LogsEmbed()],
            components: LogsActionsManagementBuilder(),
            flags: MessageFlags.Ephemeral
        })
    }
}

async function handleQuickCreate(interaction, type) {
    const versions = await fetchResponse('versions', true)
    if (!versions) {
        return interaction.reply({content: 'Impossible de récupérer les versions', flags: MessageFlags.Ephemeral})
    }

    const versionId = getLatestVersionId(versions)
    const versionNumber = Object.values(versions)[0]?.number ?? ''

    if (type === 'twitter') {
        const twitterSelect = await LogsCreateActionBuilderStep4Twitter(interaction)
        if (!twitterSelect) {
            return interaction.reply({content: 'Impossible de récupérer les tweets, veuillez réessayer', flags: MessageFlags.Ephemeral})
        }

        await interaction.reply({...twitterSelect, flags: MessageFlags.Ephemeral})
        const msg = await interaction.fetchReply()

        Cache.set(`${interaction.user.id}_${msg.id}_create`, {
            currentStep: 3,
            version: versionId,
            user: interaction.user.id,
            title: null,
            description: null,
            url: null,
            type: 'twitter',
            notification: false,
            notificationDescription: null,
            kind: null,
            isAnUpdate: false
        })
    } else {
        Cache.set(`${interaction.user.id}_quick`, {version: versionId, type})
        const modal = buildLogCreationModal(`Création d'un log ${versionNumber} - ${type}`, type, false)
        await interaction.showModal(modal)
    }
}
