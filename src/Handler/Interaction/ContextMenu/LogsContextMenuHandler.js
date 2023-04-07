import {LogsCRUDModalBuilder} from "../../../Builder/Action/CommandActionBuilder.js";
import {config} from 'dotenv'
import {CachedManager, Message, MessageManager} from "discord.js";

config();

export async function LogsContextMenuHandler(interaction) {
    // Check user permissions
    if (!interaction.member.permissions.has("ADMINISTRATOR") || !interaction.member.roles.cache.some(r => r.id === process.env.GUDA_LOG_ALLOWED_ROLE))
        return await interaction.reply({content: "Mais qui es-tu ?", ephemeral: true});

    switch (interaction.commandName) {
        case 'Modifier':
            let modal = await LogsCRUDModalBuilder(interaction)
            if (!modal) return await interaction.reply({
                content: "Ceci n'est pas un log",
                ephemeral: true
            });
            await interaction.showModal(modal)
            break;
        case 'Supprimer':
            break;
    }
}
