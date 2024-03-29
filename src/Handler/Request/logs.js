import {fetchResponse} from "../../Request/Command/Logs.js";
import {client} from "../../index.js";
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
        let discordClient = client.guilds.cache.get(process.env.GUILD_ID).client
        let notificationChannel = discordClient.channels.cache.get(process.env.GUDA_LOG_NOTIFICATION_CHANNEL);
        let message = {embeds: [LogsNotificationEmbed(logsOjb)]}
        // Default notification for a kind (website, discord)
        let canBeNotifiedInDiscord = false

        switch (logsOjb.type) {
            case 'website':
                canBeNotifiedInDiscord = logsOjb.notification;
                if (!logsOjb.isAnUpdate) {
                    message = {content: logsNotificationRole(logsOjb.type) + "\n\n" + `Le nouvel article **${logsOjb.title}** est disponible sur le site !` + "\n" + (logsOjb.url ?? '')}
                } else {
                    message = {embeds: [DiscordLogsNotificationEmbed(logsOjb, "**[Mise à jour]**")]}
                }

                break;
            case 'discord':
                canBeNotifiedInDiscord = true;
                break;
        }

        let messageUrl = ''
        if (canBeNotifiedInDiscord) {
            // Wait for message payload
            let sentMessage = await notificationChannel.send(message)
            // Insert message id
            logsOjb.messageId = sentMessage.id
            // Build message url
            messageUrl = `https://discord.com/channels/${sentMessage.guildId}/${sentMessage.channelId}/${sentMessage.id}`
        }

        // Create logs
        let response = await fetchResponse('logs/create', false, logsOjb, 'POST')
        if (!response) return false

        if (typeof response !== 'object'
            || !response.hasOwnProperty('success')
            || !response.hasOwnProperty('message')
            || !response.success
        )
            return false

        // Clear log obj
        Cache.clear(cacheId)

        return response.message + ' ' + messageUrl
    } catch (e) {
        // Logger
        await Gudalog.error(e.message, {
            location: `Request/logs.js`,
            data: logsOjb,
            cacheId: cacheId,
            step: stepNumber
        })

        return false
    }
}
