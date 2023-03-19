import {Cache} from "../Module/Cache.js";
import {fetchResponse} from "../Request/Command/Logs.js";
import {client} from "../index.js";
import {LogsNotificationEmbed} from "../Builder/EmbedBuilder.js";
import {logsNotificationRole} from "../Helper/NotificationRole.js";

export class Logs {

    /**
     * Possible elements from the object returned
     *  currentStep: {integer}
     *  version: {string}
     *  user: {string}
     *  title: {string}
     *  description: {string}
     *  type: {string}
     *  notification: {boolean}
     * @param interaction
     * @param action
     * @returns {Promise<*>}
     */
    static async getCachedLog(interaction, action = 'create') {
        return await Cache.retrieve(`${interaction.user.id}_${interaction.message.id}_${action}`)
    }

    static async create(stepNumber, userId, messageId = null, value = null) {
        // userId + messageId + action
        let cacheId = `${userId}_${messageId}_create`
        let logsOjb = {};

        if (!Cache.has(cacheId)) {
            if (stepNumber !== 1) return false;

            /** STEP 1 - INIT */
            logsOjb = {
                currentStep: 1,
                version: value,
                user: userId,
                title: null,
                description: null,
                link: null,
                type: null,
                notification: false
            }

            Cache.set(cacheId, logsOjb);

            return true;
        } else {
            if (stepNumber === 1) return false;

            // STEPS 2, 3, 5
            logsOjb = await Cache.retrieve(cacheId)

            if (logsOjb) {
                logsOjb.currentStep = stepNumber

                switch (stepNumber) {
                    case 2:
                        /** STEP 2 - SET TYPE */
                        if (value)
                            logsOjb.type = value
                        break
                    case 3:
                        /** STEP 3 - MODAL - SET TITLE, DESCRIPTION, LINK */
                        if (typeof value === 'object'
                            && value.hasOwnProperty('title')
                            && value.hasOwnProperty('description')
                            && value.hasOwnProperty('link')
                        ) {
                            logsOjb.title = value.title
                            logsOjb.description = value.description
                            logsOjb.link = value.link
                        } else {
                            return false;
                        }
                        break;
                    case 4:
                        /** STEP 4 - SET NOTIFICATION */
                        if (typeof value === 'boolean')
                            logsOjb.notification = value
                }

                Cache.set(cacheId, logsOjb);

                /**
                 * Processing log creation
                 */
                if (stepNumber !== 4) return true;
                let response = await fetchResponse('logs/create', false, logsOjb, 'POST')
                if (!response) return false

                if (typeof response === 'object' && response.hasOwnProperty('success')
                    && response.hasOwnProperty('message')
                ) {
                    if (response.success) {
                        try {
                            // Notify on discord
                            let discordClient = client.guilds.cache.get(process.env.GUILD_ID).client
                            let notificationChannel = discordClient.channels.cache.get(process.env.GUDA_LOG_NOTIFICATION_CHANNEL);
                            let message = {embeds: [LogsNotificationEmbed(logsOjb)]}
                            let canBeNotifiedInDiscord = false

                            switch (logsOjb.type) {
                                case 'website':
                                    canBeNotifiedInDiscord = true;
                                    message = {content: logsNotificationRole(logsOjb.type) + "\n\n" + ` ${logsOjb.description}` + "\n" + logsOjb.link}
                                    break;
                                case 'discord':
                                    canBeNotifiedInDiscord = true;
                                    break;
                            }

                            if (canBeNotifiedInDiscord)
                                notificationChannel.send(message)
                        } catch (e) {
                            // TODO : cache errors
                        }

                        Cache.clear(cacheId)
                    }

                    return response.message
                }
            }

            return false;
        }
    }
}
