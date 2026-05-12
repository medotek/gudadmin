import {request} from 'undici'
import {Cache} from '../Module/Cache.js'

const CACHE_TTL_SECONDS = parseInt(process.env.X_CACHE_TTL_MINUTES ?? '15') * 60
export const X_LATEST_TWEETS_KEY = 'x_latest_tweets'
const X_USER_ID_KEY = 'x_user_id'

async function xApiRequest(path) {
    const {statusCode, body} = await request(`https://api.twitter.com/2${path}`, {
        headers: {'Authorization': `Bearer ${process.env.X_BEARER_TOKEN}`}
    })
    const data = await body.json()
    if (statusCode !== 200) throw new Error(`X API error ${statusCode}: ${JSON.stringify(data)}`)
    return data
}

async function fetchXUserId(username) {
    const cached = Cache.retrieve(X_USER_ID_KEY)
    if (cached) return cached
    const data = await xApiRequest(`/users/by/username/${username}`)
    if (!data.data) throw new Error(`Compte X @${username} introuvable`)
    Cache.set(X_USER_ID_KEY, data.data.id, 0)
    return data.data.id
}

async function fetchTweets(userId) {
    const params = new URLSearchParams({
        max_results: '5',
        'tweet.fields': 'created_at,text',
        exclude: 'replies,retweets'
    })
    const data = await xApiRequest(`/users/${userId}/tweets?${params}`)
    return data.data ?? []
}

/**
 * Returns the 5 latest tweets for the UI select menu.
 * Cached for X_CACHE_TTL_MINUTES (default 15 min) to avoid redundant API calls.
 */
export async function getLatestTweetsForUI() {
    if (!process.env.X_BEARER_TOKEN || !process.env.X_ACCOUNT_USERNAME) return []
    const cached = Cache.retrieve(X_LATEST_TWEETS_KEY)
    if (cached) return cached
    const userId = await fetchXUserId(process.env.X_ACCOUNT_USERNAME)
    const tweets = await fetchTweets(userId)
    if (tweets.length) Cache.set(X_LATEST_TWEETS_KEY, tweets, CACHE_TTL_SECONDS)
    return tweets
}
