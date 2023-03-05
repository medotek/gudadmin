import {REST} from '@discordjs/rest'
import {Routes} from 'discord-api-types/v10'
import {config} from "dotenv";

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
    rest.put(
        Routes.applicationGuildCommands(process.env.APP_ID, process.env.GUILD_ID),
        {body: commands}
    )
        .then(() => console.log('Successfully registered application commands.'))
        .catch(console.error);
}
