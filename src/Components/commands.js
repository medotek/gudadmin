import {InteractionType} from "discord-api-types/v10";
import {LogsInteractionHandler} from "../Handler/Interaction/SlashCommand/Logs.js";
import {LogsButtonInteractionHandler} from "../Handler/Interaction/Button/LogsButtonInteractionHandler.js";
import {LogsContextMenuHandler} from "../Handler/Interaction/ContextMenu/LogsContextMenuHandler.js";

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
        }
        else

        /***********************************/
        /*********** APP COMMAND ***********/
        /***********************************/
       if (interaction.type === InteractionType.ApplicationCommand) {
            const {commandName} = interaction
            await LogsInteractionHandler(commandName, interaction)
        }
        else

        /***********************************/
        /********* BUTTON ACTIONS **********/
        /***********************************/
        if (interaction.isButton()) {
            await LogsButtonInteractionHandler(interaction)
        }
    //
    //     /***********************************/
    //     /********* SELECT ACTIONS **********/
    //     /***********************************/
    //     if (interaction.isSelectMenu()) {
    //         await selectElementHelpCommandActions(interaction)
    //     }
            // else
    //
    //     /***********************************/
    //     /********* MODAL SUBMITTED *********/
    //     /***********************************/
    //     if (interaction.isModalSubmit()) {
    //
    //         if (interaction.customId === 'setUidModal') {
    //             const {user} = interaction
    //             const pseudo = interaction.fields.getTextInputValue('setUidNickname');
    //             const uid = interaction.fields.getTextInputValue('setUidNumber');
    //             if (pseudo && uid) {
    //                 response = await UserDataProvider('update', sequelize, user, uid, pseudo.replace(/[^a-zA-Z0-9]/g, ""))
    //             }
    //             // Clear cache if exists
    //             let cacheKey = 'get-uid' + user.id
    //             if (Cache.has(cacheKey)
    //                 && typeof response.data === "object"
    //                 && response.data !== undefined
    //                 && Object.keys(response.data).length) {
    //                 Cache.clear(cacheKey)
    //             }
    //         }
    //
    //         await interaction.reply({content: response.message, ephemeral: true})
    //     }
    })
}
