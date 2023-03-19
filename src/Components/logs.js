import {Cache} from "../Module/Cache.js";

export class Logs {

    /**
     * Possible element from the object returned
     *  currentStep: {integer}
     *  version: {string}
     *  user: {string}
     *  title: {string}
     *  description: {string}
     *  type: {string}
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

        console.log(cacheId)
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
                type: null
            }

            Cache.set(cacheId, logsOjb);

            return true;
        } else {

            // STEPS 2, 3, 4, 5
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
                    // default:
                    //     return false;
                }

                Cache.set(cacheId, logsOjb);

                return true;
            }

            return false;
        }
    }
}
