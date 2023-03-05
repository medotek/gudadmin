import {ContextMenuCommandBuilder, SlashCommandBuilder} from "@discordjs/builders";
import {ApplicationCommandType} from "discord.js";

export function LogsManagementCommandBuilder() {
    return new SlashCommandBuilder()
        .setName('logs')
        .setDescription('Gestion des logs')
}

export function LogsModifyContextMessageCommandBuilder() {
    return new ContextMenuCommandBuilder()
        .setName('Modifier')
        .setType(ApplicationCommandType.Message);
}

export function LogsDeleteContextMessageCommandBuilder() {
    return new ContextMenuCommandBuilder()
        .setName('Supprimer')
        .setType(ApplicationCommandType.Message);
}
