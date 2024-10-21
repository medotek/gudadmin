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
        let message = {embeds: [LogsNotificationEmbed(logsOjb)]}
        var notificationChannelId = process.env.GUDA_LOG_WEBSITE_NOTIFICATION_CHANNEL
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
            case 'twitter':
                message = logsNotificationRole(logsOjb.type) + ' ' + logsOjb.url
                notificationChannelId = process.env.GUDA_LOG_TWITTER_NOTIFICATION_CHANNEL
                canBeNotifiedInDiscord = logsOjb.notification;
                break;
            case 'discord':
                canBeNotifiedInDiscord = true;
                break;
        }

        let messageUrl = ''
        if (canBeNotifiedInDiscord) {
            let notificationChannel = discordClient.channels.cache.get(notificationChannelId)
            // Wait for message payload
            let {messageId, guildId, channelId} = await notificationChannel.send(message)
            // Insert message id
            logsOjb.messageId = messageId
            // Build message url
            messageUrl = `https://discord.com/channels/${guildId}/${channelId}/${messageId}`
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
        console.error(e)

        return false
    }
}
