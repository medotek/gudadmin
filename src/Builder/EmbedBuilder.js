import {EmbedBuilder} from "discord.js";

export function LogsEmbed() {
    return new EmbedBuilder()
        .setColor(0xf2d77c)
        .setDescription(`Commande de gestion des logs`)
}

export function LogsNotificationEmbed(data) {
    return new EmbedBuilder()
        .setColor(0xf2d77c)
        .setTitle(data.title)
        .setDescription(data.description)
        .setURL(data.link)
}
