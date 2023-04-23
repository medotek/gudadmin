import {Cache} from "../Module/Cache.js";
import {logsCreationRequestHandler} from "../Handler/Request/logs.js";
import {fetchResponse} from "../Request/Command/Logs.js";
import {client} from "../index.js";
import {LogsNotificationEmbed} from "../Builder/EmbedBuilder.js";

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
                url: null,
                type: null,
                notification: false
            }

            Cache.set(cacheId, logsOjb);

            return true;
        } else {
            if (stepNumber === 1) return false;

            // STEPS 2 to 5
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
                        /** STEP 3 - MODAL - SET TITLE, DESCRIPTION, URL */
                        if (typeof value === 'object'
                            && value.hasOwnProperty('title')
                            && value.hasOwnProperty('description')
                            && value.hasOwnProperty('url')
                        ) {
                            logsOjb.title = value.title
                            logsOjb.description = value.description
                            logsOjb.url = value.url
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

                return logsCreationRequestHandler(logsOjb, cacheId, stepNumber);
            }

            return false;
        }
    }

    static async update(userId, obj) {
        let cachedLog = await Cache.retrieve(`log_update_${userId}`)

        if (!cachedLog
            || typeof cachedLog !== 'object'
            || !cachedLog.hasOwnProperty('id')
            || !cachedLog.id)
            return false

        let updatedLog = await fetchResponse(`logs/update`, false, {
            id: cachedLog.id,
            description: obj.description,
            url: obj.url
        }, 'PUT')

        /**
         * Update discord message
         */
        if (updatedLog
            && (updatedLog.hasOwnProperty('success') && updatedLog.success)
            && (updatedLog.hasOwnProperty('data') && updatedLog.data.messageId)
        ) {
            let discordClient = client.guilds.cache.get(process.env.GUILD_ID).client
            let notificationChannel = discordClient.channels.cache.get(process.env.GUDA_LOG_NOTIFICATION_CHANNEL);
            let message = await notificationChannel.messages.fetch(updatedLog.data.messageId)
            let content = {embeds: [LogsNotificationEmbed(updatedLog.data)]}
            if (message) message.edit(content)
            // Flush cache
            await Cache.clear(`log_update_${userId}`)

            return true;
        }

        return false;
    }
}
