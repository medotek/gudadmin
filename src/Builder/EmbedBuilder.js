import {EmbedBuilder} from "discord.js";

export function LogsEmbed() {
    return new EmbedBuilder()
        .setColor(0xf2d77c)
        .setDescription(`Commande de gestion des logs`)
}
