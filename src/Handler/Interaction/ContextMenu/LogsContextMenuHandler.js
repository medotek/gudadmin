import {LogsCRUDModalBuilder} from "../../../Builder/Action/CommandActionBuilder.js";
import {config} from 'dotenv'
import {CachedManager, Message, MessageManager} from "discord.js";

config();

export async function LogsContextMenuHandler(interaction) {
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
