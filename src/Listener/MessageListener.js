import {fetchResponse} from "../Request/Command/Logs.js";

export const YoutubeChannelListener = (client) => {
    client.on('messageCreate', function (message) {
        if (message.channel.id !== process.env.YOUTUBE_CHANNEL_ID) return
        // Extract URL
        const regex = /(https?:\/\/[^\s]+)/;
        const url = message.content?.match(regex);

        if (url && url.length) {
            let youtubeUrl = new URL(url[0])
            let videoId = youtubeUrl.searchParams.get('v')
            fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${process.env.YOUTUBE_API_KEY}&part=snippet`)
                .then(response => response.json())
                .then(async data => {
                    if (!data.items.length)
                        return;

                    let versions = await fetchResponse('versions', true)
                    if (versions) {
                        await fetchResponse(
                            'logs/create',
                            false,
                            {
                                version: Object.entries(versions)[0][1].id,
                                user: 1,
                                title: data.items[0].snippet.title,
                                description: null,
                                url: youtubeUrl,
                                type: null,
                                notification: false,
                                notificationDescription: null,
                                kind: null,
                                isAnUpdate: false
                            },
                            'POST'
                        )
                    }
                })
                .catch(error => console.error("Erreur :", error));
        }
    })
}