import {REST} from '@discordjs/rest'
import {Routes} from 'discord-api-types/v10'
import {config} from "dotenv";
import {pathToFileURL} from "node:url";

import {
    LogsDeleteContextMessageCommandBuilder,
    LogsManagementCommandBuilder,
    LogsModifyContextMessageCommandBuilder
} from "../Builder/CommandBuilder.js";

config();

export async function deployCommands() {
    const commands = [
        LogsManagementCommandBuilder(),
        LogsModifyContextMessageCommandBuilder(),
        LogsDeleteContextMessageCommandBuilder()
    ];

    const rest = new REST({version: '10'}).setToken(process.env.TOKEN);
    await rest.put(
        Routes.applicationGuildCommands(process.env.APP_ID, process.env.GUILD_ID),
        {body: commands}
    );
    console.log('Successfully registered application commands.');
}

// Ne déploie que si le fichier est lancé directement (`yarn deploy`).
// À l'import, on n'expose que la fonction : c'est index.js qui décide, via DEPLOY_ON_START.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    await deployCommands();
}
