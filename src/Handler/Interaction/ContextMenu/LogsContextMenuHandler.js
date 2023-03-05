import {LogsCRUDModalBuilder} from "../../../Builder/Action/CommandActionBuilder.js";
import {CachedManager, Message, MessageManager} from "discord.js";

export async function LogsContextMenuHandler(interaction) {
    switch (interaction.commandName) {
        case 'Modifier':
            await interaction.showModal(LogsCRUDModalBuilder(interaction))
            break;
        case 'Supprimer':
            break;
    }
}
