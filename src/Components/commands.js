import {InteractionType} from "discord-api-types/v10";
import {LogsInteractionHandler} from "../Handler/Interaction/SlashCommand/Logs.js";
import {LogsButtonInteractionHandler} from "../Handler/Interaction/Button/LogsButtonInteractionHandler.js";
import {LogsContextMenuHandler} from "../Handler/Interaction/ContextMenu/LogsContextMenuHandler.js";
import {LogsSelectInteractionHandler} from "../Handler/Interaction/Select/LogsSelectInteractionHandler.js";
import {LogsSubmitModalHandler} from "../Handler/Interaction/Modal/LogsModalHandler.js";

export const Commands = (client, sequelize) => {
    client.on('interactionCreate', async interaction => {
        // let response = {
        //     message: 'An error occurred, medo help!'
        // };

        /**************************************/
        /******** MESSAGE CONTEXT MENU ********/
        /**************************************/
        if (interaction.isMessageContextMenuCommand()) {
            await LogsContextMenuHandler(interaction)
        } else

            /***********************************/
            /*********** APP COMMAND ***********/
            /***********************************/
        if (interaction.type === InteractionType.ApplicationCommand) {
            const {commandName} = interaction
            await LogsInteractionHandler(commandName, interaction)
        } else

            /***********************************/
            /********* BUTTON ACTIONS **********/
            /***********************************/
        if (interaction.isButton()) {
            await LogsButtonInteractionHandler(interaction)
        }

        /***********************************/
        /********* SELECT ACTIONS **********/
        /***********************************/
        if (interaction.isStringSelectMenu()) {
            await LogsSelectInteractionHandler(interaction)
        } else

            /***********************************/
            /********* MODAL SUBMITTED *********/
            /***********************************/
        if (interaction.isModalSubmit()) {
            await LogsSubmitModalHandler(interaction)
        }
    })
}
