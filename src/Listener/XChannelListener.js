import {fetchResponse, getLatestVersionId} from "../Request/Command/Logs.js"
import {Gudalog} from "../Module/Guda.js"
import {logsNotificationRole} from "../Helper/NotificationRole.js"
import {client} from "../index.js"
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
        'tweet.fields': 'created_at,text',
        exclude: 'replies,retweets'
    })
    const data = await xApiRequest(`/users/${userId}/tweets?${params}`)
    return (data.data ?? []).slice(0, 3)
}

function stripQueryParams(url) {
    return url?.split('?')[0] ?? url
}

async function getAlreadyLoggedUrls(tweetUrls) {
    const logs = await fetchResponse('logs?type=Twitter', true)
    if (!Array.isArray(logs)) return null
    const urlSet = new Set(tweetUrls)
    return new Set(logs.filter(log => urlSet.has(stripQueryParams(log.url))).map(log => stripQueryParams(log.url)))
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

    const checkAndCreateLog = async () => {
        try {
            const tweets = await fetchLatestTweets(userId)
            if (!tweets.length) return

            const tweetUrls = tweets.map(t => `https://x.com/${process.env.X_ACCOUNT_USERNAME}/status/${t.id}`)
            const alreadyLogged = await getAlreadyLoggedUrls(tweetUrls)

            if (alreadyLogged === null) {
                Gudalog.warn('Impossible de vérifier les logs existants, tentative de création quand même')
                return false;
            }

            const versions = await fetchResponse('versions', true)
            if (!versions) return
            const versionId = getLatestVersionId(versions)

            for (const tweet of tweets.reverse()) {
                const tweetUrl = `https://x.com/${process.env.X_ACCOUNT_USERNAME}/status/${tweet.id}`

                if (alreadyLogged?.has(tweetUrl)) {
                    Gudalog.info(`Tweet déjà présent dans les logs: ${tweet.text.split('\n')[0]}`)
                    continue
                }

                const mention = logsNotificationRole('twitter')
                const notificationChannel = client.guilds.cache.get(process.env.GUILD_ID)
                    ?.client.channels.cache.get(process.env.GUDA_LOG_TWITTER_NOTIFICATION_CHANNEL)

                let messageId = null
                if (notificationChannel) {
                    const sent = await notificationChannel.send({
                        content: (mention ? mention + ' ' : '') + tweetUrl
                    })
                    messageId = sent.id
                }

                const logResponse = await fetchResponse(
                    'logs/create',
                    false,
                    {
                        version: versionId,
                        user: BOT_USER_ID,
                        title: tweet.text.split('\n')[0],
                        description: null,
                        url: tweetUrl,
                        type: 'twitter',
                        notification: true,
                        notificationDescription: null,
                        kind: null,
                        isAnUpdate: false,
                        messageId
                    },
                    'POST'
                )
                Gudalog.info('Nouveau tweet logué', logResponse)
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
