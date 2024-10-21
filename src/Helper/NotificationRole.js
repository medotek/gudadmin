export function logsNotificationRole(type) {
    let mention = null;
    switch (type) {
        case 'website':
            mention = `<@&${process.env.GUDA_LOG_WEBSITE_NOTIFICATION_ROLE}>`
            break;
        case 'twitter':
            mention = `<@&${process.env.GUDA_LOG_TWITTER_NOTIFICATION_ROLE}>`
            break;
    }

    return mention
}
