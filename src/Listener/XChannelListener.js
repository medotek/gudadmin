import {fetchResponse} from "../Request/Command/Logs.js"
import {Cache} from "../Module/Cache.js"
import {Gudalog} from "../Module/Guda.js"
import {request} from 'undici'

const X_LAST_TWEET_KEY = 'x_last_tweet_id'
const POLL_INTERVAL_MS = parseInt(process.env.X_POLL_INTERVAL_MINUTES ?? '15') * 60 * 1000

async function xApiRequest(path) {
    const {statusCode, body} = await request(`https://api.twitter.com/2${path}`, {
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

async function fetchNewTweets(userId, sinceId) {
    const params = new URLSearchParams({
        max_results: '10',
        'tweet.fields': 'created_at,text',
        exclude: 'replies,retweets'
    })
    if (sinceId) params.set('since_id', sinceId)
    const data = await xApiRequest(`/users/${userId}/tweets?${params}`)
    return data.data ?? []
}

export const XChannelListener = async () => {
    if (!process.env.X_BEARER_TOKEN || !process.env.X_ACCOUNT_USERNAME) return

    let userId
    try {
        userId = await fetchUserId(process.env.X_ACCOUNT_USERNAME)
        console.log(`[X Listener] Surveillance du compte @${process.env.X_ACCOUNT_USERNAME} (id: ${userId})`)
    } catch (e) {
        await Gudalog.error(e.message, {location: 'Listener/XChannelListener.js', action: 'fetchUserId'})
        return
    }

    const poll = async () => {
        try {
            const lastId = await Cache.retrieve(X_LAST_TWEET_KEY)
            const tweets = await fetchNewTweets(userId, lastId)

            if (!tweets.length) return

            // Mise à jour du dernier tweet en cache (sans expiration)
            Cache.set(X_LAST_TWEET_KEY, tweets[0].id, 0)

            // Premier poll : on initialise uniquement la baseline, sans créer de logs
            if (!lastId) return

            const versions = await fetchResponse('versions', true)
            if (!versions) return

            const versionId = Object.entries(versions)[0][1].id

            // Traitement du plus ancien au plus récent
            for (const tweet of tweets.reverse()) {
                const tweetUrl = `https://x.com/${process.env.X_ACCOUNT_USERNAME}/status/${tweet.id}`
                const logResponse = await fetchResponse(
                    'logs/create',
                    false,
                    {
                        version: versionId,
                        user: 1,
                        title: tweet.text,
                        description: null,
                        url: tweetUrl,
                        type: 'twitter',
                        notification: true,
                        notificationDescription: null,
                        kind: null,
                        isAnUpdate: false
                    },
                    'POST'
                )
                console.log('[X Listener] Nouveau tweet logué :', logResponse)
            }
        } catch (e) {
            await Gudalog.error(e.message, {location: 'Listener/XChannelListener.js', action: 'poll'})
        }
    }

    await poll()
    setInterval(poll, POLL_INTERVAL_MS)
}
