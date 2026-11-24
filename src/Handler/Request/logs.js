import {attachMessageIdToLog, createLog} from "../../Request/Command/Logs.js";
import {client} from "../../Module/Client.js";
import {DiscordLogsNotificationEmbed, LogsNotificationEmbed} from "../../Builder/EmbedBuilder.js";
import {logsNotificationRole} from "../../Helper/NotificationRole.js";
import {Cache} from "../../Module/Cache.js";
import {Gudalog} from "../../Module/Guda.js";

/**
 * Processing log creation
 * @param logsOjb
 * @param cacheId
 * @param stepNumber
 * @returns {Promise<*|boolean>}
 */
export async function logsCreationRequestHandler(logsOjb, cacheId, stepNumber = 0) {
    // Verify if it's the right step
    if (stepNumber !== 5) return true;

    try {
        // 1. Créer le log d'abord : en cas d'échec, aucune notification n'est envoyée,
        //    ce qui évite un doublon sur Discord quand la commande est relancée.
        const created = await createLog(logsOjb)
        if (!created.success) {
            await Gudalog.error(`Création du log échouée : ${created.message}`, {
                location: 'Handler/Request/logs.js',
                response: created.response
            })
            return false
        }

        // Clear log obj
        Cache.clear(cacheId)

        // 2. Notifier seulement une fois le log enregistré
        let message = {embeds: [LogsNotificationEmbed(created.payload)]}
        let notificationChannelId = process.env.GUDA_LOG_WEBSITE_NOTIFICATION_CHANNEL
        // Default notification for a kind (website, discord)
        let canBeNotifiedInDiscord = false

        switch (created.payload.type) {
            case 'website':
                canBeNotifiedInDiscord = created.payload.notification;
                if (!created.payload.isAnUpdate) {
                    message = {content: logsNotificationRole(created.payload.type) + "\n\n" + `Le nouvel article **${created.payload.title}** est disponible sur le site !` + "\n" + (created.payload.url ?? '')}
                } else {
                    message = {embeds: [DiscordLogsNotificationEmbed(created.payload, "**[Mise à jour]**")]}
                }
                break;
            case 'twitter':
                message = {content: (logsNotificationRole(created.payload.type) ? logsNotificationRole(created.payload.type) + ' ' : '') + created.payload.url}
                notificationChannelId = process.env.GUDA_LOG_TWITTER_NOTIFICATION_CHANNEL
                canBeNotifiedInDiscord = created.payload.notification;
                break;
            case 'discord':
                canBeNotifiedInDiscord = true;
                break;
        }

        let messageUrl = ''
        if (canBeNotifiedInDiscord) {
            try {
                const notificationChannel = client.channels.cache.get(notificationChannelId)
                const sent = await notificationChannel.send(message)
                messageUrl = sent.url

                // 3. Rattacher le message au log (best effort : le log existe déjà)
                if (!await attachMessageIdToLog(created.payload, sent.id)) {
                    Gudalog.warn('Impossible de rattacher le messageId au log', {title: created.payload.title, messageId: sent.id})
                }
            } catch (e) {
                await Gudalog.error(`Log créé mais notification Discord échouée : ${e.message}`, {location: 'Handler/Request/logs.js'})
            }
        }

        return created.message + ' ' + messageUrl
    } catch (e) {
        await Gudalog.error(e.message, {location: 'Handler/Request/logs.js'})
        return false
    }
}
