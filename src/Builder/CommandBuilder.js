import {ContextMenuCommandBuilder, SlashCommandBuilder} from "@discordjs/builders";
import {ApplicationCommandType} from "discord.js";

export function LogsManagementCommandBuilder() {
    return new SlashCommandBuilder()
        .setName('logs')
        .setDescription('Gestion des logs')
        .addBooleanOption(option => option
            .setName('new')
            .setDescription('Créer rapidement un nouveau log (version la plus récente)')
            .setRequired(false))
        .addStringOption(option => option
            .setName('type')
            .setDescription('Type de log')
            .setRequired(false)
            .addChoices(
                {name: 'Hoyolab', value: 'hoyolab'},
                {name: 'Site', value: 'website'},
                {name: 'Twitter', value: 'twitter'},
                {name: 'Youtube', value: 'youtube'},
                {name: 'Discord', value: 'discord'}
            ))
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
