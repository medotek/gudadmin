import {createLog, fetchResponse, getLatestVersionId} from "../Request/Command/Logs.js";
import {Gudalog} from "../Module/Guda.js";

const BOT_USER_ID = parseInt(process.env.GUDA_LOG_USER_ID ?? '1')

export const YoutubeChannelListener = (client) => {
    client.on('messageCreate', function (message) {
        if (message.channel.id !== process.env.YOUTUBE_CHANNEL_ID) return
        const regex = /(https?:\/\/[^\s]+)/;
        const url = message.content?.match(regex);

        if (url && url.length) {
            let youtubeUrl = new URL(url[0])
            let videoId = youtubeUrl.searchParams.get('v')
            fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${process.env.YOUTUBE_API_KEY}&part=snippet`)
                .then(response => response.json())
                .then(async data => {
                    if (!data.items.length) return;

                    const versions = await fetchResponse('versions', true)
                    if (!versions) return

                    const created = await createLog({
                        version: getLatestVersionId(versions),
                        user: BOT_USER_ID,
                        title: data.items[0].snippet.title,
                        description: null,
                        url: youtubeUrl.href,
                        type: 'youtube',
                        notification: false,
                        notificationDescription: null,
                        kind: null,
                        isAnUpdate: false
                    })
                    if (created.success) {
                        Gudalog.info('YouTube log créé', {url: youtubeUrl.href})
                    } else {
                        await Gudalog.error(`Création du log YouTube échouée : ${created.message}`, {
                            location: 'Listener/MessageListener.js',
                            url: youtubeUrl.href,
                            response: created.response
                        })
                    }
                })
                .catch(error => Gudalog.error(error.message, {location: 'Listener/MessageListener.js'}));
        }
    })
}