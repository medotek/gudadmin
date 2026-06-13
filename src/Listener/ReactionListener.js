import {Gudalog} from "../Module/Guda.js";

/**
 * Identifiants des salons surveillés (séparés par une virgule).
 * Pour un forum, renseigner l'ID du salon forum : les posts (threads) en héritent automatiquement.
 * @returns {Set<string>}
 */
function getWatchedChannelIds() {
    return new Set(
        (process.env.OSEF_CHANNEL_ID ?? '')
            .split(',')
            .map(id => id.trim())
            .filter(Boolean)
    )
}

/**
 * Un salon est surveillé s'il correspond directement à un ID configuré,
 * ou si son salon parent l'est (cas des threads/posts d'un forum).
 */
function isWatchedChannel(channel, watchedIds) {
    if (!channel) return false
    return watchedIds.has(channel.id) || (channel.parentId != null && watchedIds.has(channel.parentId))
}

/**
 * Vrai si l'emoji est l'emoji "vu" configuré.
 * Compare par ID (emoji custom) avec repli sur le nom (emoji unicode).
 */
function isVuEmoji(emoji) {
    const vuId = process.env.OSEF_VU_EMOJI_ID
    if (!vuId) return false
    return emoji.id === vuId || emoji.name === vuId
}

/**
 * Résout les données partielles (réaction/message sur un message non mis en cache).
 */
async function resolveReactionContext(reaction) {
    if (reaction.partial) await reaction.fetch()
    if (reaction.message.partial) await reaction.message.fetch()
}

/**
 * Vrai si l'utilisateur a déjà réagi avec l'emoji "vu" sur ce message.
 */
async function userHasVu(message, userId) {
    const vuReaction = message.reactions.cache.find(r => isVuEmoji(r.emoji))
    if (!vuReaction) return false
    const users = await vuReaction.users.fetch()
    return users.has(userId)
}

export const VuReactionListener = (client) => {
    client.on('messageReactionAdd', async (reaction, user) => {
        try {
            if (user.bot) return
            const watchedIds = getWatchedChannelIds()
            if (!watchedIds.size || !process.env.OSEF_VU_EMOJI_ID) return

            await resolveReactionContext(reaction)

            if (!isWatchedChannel(reaction.message.channel, watchedIds)) return
            // L'emoji "vu" lui-même est toujours autorisé
            if (isVuEmoji(reaction.emoji)) return
            // L'utilisateur a déjà posé son "vu" : on laisse passer
            if (await userHasVu(reaction.message, user.id)) return

            // Réaction avec un autre emoji sans "vu" préalable : on l'annule et on prévient
            await reaction.users.remove(user.id)
        } catch (e) {
            await Gudalog.error(e.message, {location: 'Listener/ReactionListener.js', action: 'messageReactionAdd'})
        }
    })
}
