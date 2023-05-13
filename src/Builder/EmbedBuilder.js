import {EmbedBuilder} from "discord.js";

export function LogsEmbed() {
    return new EmbedBuilder()
        .setColor(0xf2d77c)
        .setDescription(`Commande de gestion des logs`)
}

export function LogsNotificationEmbed(data) {
    let embed = new EmbedBuilder()
        .setColor(0xf2d77c)
        .setTitle(data.title)
        .setDescription(data.description)

    if (typeof data.url !== 'undefined' && data.url) {
        embed.setURL(data.url)
    }

    return embed
}

export function DiscordLogsNotificationEmbed(data, title) {
    let description = (data.kind ? "**${data.kind}** \n\n" : "");
    description += data.description
    let embed = new EmbedBuilder()
        .setColor(0xf2d77c)
        .setTitle(title)
        .setDescription(description)

    if (typeof data.url !== 'undefined' && data.url) {
        embed.setURL(data.url)
    }

    return embed
}

export function ErrorEmbed(interaction, error) {
    return new EmbedBuilder()
        .setTitle('Une erreur est survenue')
        .setDescription(error.message)
        .setFields({name: 'Action', value: `${interaction.customId} - TYPE : ${interaction.type}`})
}
