import {createServer} from 'node:http'
import {createHmac, timingSafeEqual} from 'node:crypto'
import {fetchResponse, getLatestVersionId} from '../Request/Command/Logs.js'
import {logsCreationRequestHandler} from '../Handler/Request/logs.js'
import {Gudalog} from '../Module/Guda.js'

const PORT = parseInt(process.env.WEBHOOK_PORT ?? '3000')

function buildCrcResponse(crcToken) {
    const hmac = createHmac('sha256', process.env.X_CONSUMER_SECRET)
    hmac.update(crcToken)
    return 'sha256=' + hmac.digest('base64')
}

function isValidSignature(rawBody, signature) {
    if (!signature) return false
    const hmac = createHmac('sha256', process.env.X_CONSUMER_SECRET)
    hmac.update(rawBody)
    const expected = Buffer.from('sha256=' + hmac.digest('base64'))
    const received = Buffer.from(signature)
    if (expected.length !== received.length) return false
    return timingSafeEqual(expected, received)
}

function extractTweetText(tweet) {
    return tweet.extended_tweet?.full_text ?? tweet.full_text ?? tweet.text
}

async function handleTweetEvent(tweet) {
    // Skip retweets and replies
    if (tweet.retweeted_status || tweet.in_reply_to_status_id_str) return

    const username = tweet.user.screen_name
    const url = `https://x.com/${username}/status/${tweet.id_str}`

    const versions = await fetchResponse('versions', true)
    if (!versions) {
        await Gudalog.error('Webhook X: impossible de récupérer les versions', {location: 'Server/WebhookServer.js'})
        return
    }

    const versionId = getLatestVersionId(versions)
    if (!versionId) {
        await Gudalog.error('Webhook X: aucune version trouvée', {location: 'Server/WebhookServer.js'})
        return
    }

    const logsObj = {
        currentStep: 5,
        version: versionId,
        user: process.env.GUDA_LOG_USER_ID ?? '1',
        title: extractTweetText(tweet),
        description: null,
        url,
        type: 'twitter',
        notification: true,
        notificationDescription: null,
        kind: null,
        isAnUpdate: false
    }

    const cacheId = `webhook_twitter_${tweet.id_str}`
    const result = await logsCreationRequestHandler(logsObj, cacheId, 5)

    if (!result) {
        await Gudalog.error(`Webhook X: échec création log pour le tweet ${tweet.id_str}`, {location: 'Server/WebhookServer.js'})
    }
}

export function startWebhookServer() {
    if (!process.env.X_CONSUMER_SECRET) {
        console.warn('[Webhook X] X_CONSUMER_SECRET non défini — serveur webhook non démarré')
        return
    }

    const server = createServer((req, res) => {
        const url = new URL(req.url, 'http://localhost')

        if (url.pathname !== '/webhook/twitter') {
            res.writeHead(404).end()
            return
        }

        // CRC challenge (X vérifie que le serveur t'appartient)
        if (req.method === 'GET') {
            const crcToken = url.searchParams.get('crc_token')
            if (!crcToken) {
                res.writeHead(400).end()
                return
            }
            res.writeHead(200, {'Content-Type': 'application/json'})
            res.end(JSON.stringify({response_token: buildCrcResponse(crcToken)}))
            return
        }

        // Événements de tweet
        if (req.method === 'POST') {
            let rawBody = ''
            req.on('data', chunk => { rawBody += chunk })
            req.on('end', async () => {
                if (!isValidSignature(rawBody, req.headers['x-twitter-webhooks-signature'])) {
                    res.writeHead(401).end()
                    return
                }

                // X attend une réponse < 3s, on répond immédiatement
                res.writeHead(200).end()

                try {
                    const payload = JSON.parse(rawBody)
                    for (const tweet of (payload.tweet_create_events ?? [])) {
                        await handleTweetEvent(tweet)
                    }
                } catch (e) {
                    await Gudalog.error(e.message, {location: 'Server/WebhookServer.js'})
                }
            })
            return
        }

        res.writeHead(405).end()
    })

    server.listen(PORT, () => {
        console.log(`[Webhook X] Serveur démarré sur le port ${PORT}`)
    })
}
