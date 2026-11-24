import {attachMessageIdToLog, createLog, fetchResponse, getLatestVersionId} from "../Request/Command/Logs.js"
import {Gudalog} from "../Module/Guda.js"
import {logsNotificationRole} from "../Helper/NotificationRole.js"
import {client} from "../Module/Client.js"
import {request} from 'undici'

const POLL_INTERVAL_MS = parseInt(process.env.X_POLL_INTERVAL_MINUTES ?? '15') * 60 * 1000
const BOT_USER_ID = parseInt(process.env.GUDA_LOG_USER_ID ?? '1')

async function xApiRequest(path) {
    const {statusCode, body} = await request(`https://api.x.com/2${path}`, {
        headers: {'Authorization': `Bearer ${process.env.X_BEARER_TOKEN}`}
    })
    const data = await body.json()
    if (statusCode !== 200) throw new Error(`X API error ${statusCode}: ${JSON.stringify(data)}`)
    return data
}

async function fetchUserId(username) {
    const data = await xApiRequest(`/users/by/username/${username}`)
    if (!data.data) throw new Error(`Compte X @${username} introuvable`)
    return data.data.id
}

async function fetchLatestTweets(userId) {
    const params = new URLSearchParams({
        max_results: '5',
        'tweet.fields': 'created_at,text,in_reply_to_user_id',
        exclude: 'replies,retweets'
    })
    const data = await xApiRequest(`/users/${userId}/tweets?${params}`)
    return (data.data ?? []).filter(t => !t.in_reply_to_user_id).slice(0, 3)
}

function stripQueryParams(url) {
    return url?.split('?')[0] ?? url
}

function tweetUrlOf(tweet) {
    return `https://x.com/${process.env.X_ACCOUNT_USERNAME}/status/${tweet.id}`
}

/**
 * Première ligne non vide du tweet (la troncature est faite par createLog).
 */
function buildTitle(text) {
    return (text ?? '').split('\n').map(l => l.trim()).find(Boolean) ?? 'Tweet'
}

/**
 * Logs twitter existants indexés par URL (sans query params).
 * @returns {Promise<Map<string, object>|null>} null si l'API n'a pas répondu correctement
 */
async function fetchTwitterLogsByUrl() {
    const logs = await fetchResponse('logs?type=twitter', true)
    if (!Array.isArray(logs)) return null
    return new Map(logs.filter(log => log.url).map(log => [stripQueryParams(log.url), log]))
}

function createTweetLog(tweet, versionId) {
    return createLog({
        version: versionId,
        user: BOT_USER_ID,
        title: buildTitle(tweet.text),
        description: null,
        url: tweetUrlOf(tweet),
        type: 'twitter',
        notification: true,
        notificationDescription: null,
        kind: null,
        isAnUpdate: false
    })
}

async function sendNotification(tweetUrl) {
    const channel = client.channels.cache.get(process.env.GUDA_LOG_TWITTER_NOTIFICATION_CHANNEL)
    if (!channel) {
        Gudalog.warn('Salon de notification Twitter introuvable', {channelId: process.env.GUDA_LOG_TWITTER_NOTIFICATION_CHANNEL})
        return null
    }
    const mention = logsNotificationRole('twitter')
    const sent = await channel.send({content: (mention ? mention + ' ' : '') + tweetUrl})
    return sent.id
}

export const XChannelListener = async () => {
    if (!process.env.X_BEARER_TOKEN || !process.env.X_ACCOUNT_USERNAME) return

    let userId
    try {
        userId = await fetchUserId(process.env.X_ACCOUNT_USERNAME)
        Gudalog.info(`Surveillance du compte @${process.env.X_ACCOUNT_USERNAME} (id: ${userId})`)
    } catch (e) {
        await Gudalog.error(e.message, {location: 'Listener/XChannelListener.js', action: 'fetchUserId'})
        return
    }

    // Tweets déjà traités depuis le démarrage : filet de sécurité si l'API des logs
    // ne renvoie plus un tweet qu'on a pourtant déjà logué et notifié.
    const handledTweetIds = new Set()

    const checkAndCreateLog = async () => {
        try {
            const tweets = (await fetchLatestTweets(userId)).filter(t => !handledTweetIds.has(t.id))
            if (!tweets.length) return

            const existingLogs = await fetchTwitterLogsByUrl()
            if (existingLogs === null) {
                Gudalog.warn('Impossible de vérifier les logs Twitter existants, poll ignoré')
                return
            }

            const versions = await fetchResponse('versions', true)
            const versionId = versions ? getLatestVersionId(versions) : null
            if (!versionId) {
                Gudalog.warn('Impossible de récupérer la dernière version, poll ignoré')
                return
            }

            // Du plus ancien au plus récent pour garder l'ordre chronologique des notifs
            for (const tweet of [...tweets].reverse()) {
                const tweetUrl = tweetUrlOf(tweet)

                if (existingLogs.has(tweetUrl)) {
                    handledTweetIds.add(tweet.id)
                    continue
                }

                // 1. Créer le log d'abord : tant qu'il n'existe pas, on ne notifie pas.
                //    Un échec ici est retenté au poll suivant sans spammer Discord.
                const created = await createTweetLog(tweet, versionId)
                if (!created.success) {
                    await Gudalog.error(`Création du log Twitter échouée, notification non envoyée : ${created.message}`, {
                        location: 'Listener/XChannelListener.js',
                        tweetUrl,
                        response: created.response
                    })
                    continue
                }
                handledTweetIds.add(tweet.id)
                Gudalog.info('Nouveau tweet logué', {tweetUrl})

                // 2. Notifier une seule fois, le log existant empêche toute renotification.
                let messageId = null
                try {
                    messageId = await sendNotification(tweetUrl)
                } catch (e) {
                    await Gudalog.error(`Envoi de la notification Twitter échoué : ${e.message}`, {
                        location: 'Listener/XChannelListener.js',
                        tweetUrl
                    })
                }

                // 3. Rattacher le message Discord au log (best effort).
                if (messageId && !await attachMessageIdToLog(created.payload, messageId)) {
                    Gudalog.warn('Impossible de rattacher le messageId au log', {tweetUrl, messageId})
                }
            }
        } catch (e) {
            await Gudalog.error(e.message, {location: 'Listener/XChannelListener.js', action: 'checkAndCreateLog'})
        }
    }

    await checkAndCreateLog()
    setInterval(
        () => checkAndCreateLog().catch(e => Gudalog.warn('Erreur non gérée dans checkAndCreateLog()', {message: e.message})),
        POLL_INTERVAL_MS
    )
}
