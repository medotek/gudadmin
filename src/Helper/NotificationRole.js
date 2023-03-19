export function logsNotificationRole(type) {
    let mention = null;
    switch (type) {
        case 'website':
            mention = `<@${process.env.GUDA_LOG_NOTIFICATION_ROLE_DISCORD}>`
            break;
    }

    return mention
}
