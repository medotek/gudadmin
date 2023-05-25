import {InteractionType} from "discord-api-types/v10";
import {LogsInteractionHandler} from "../Handler/Interaction/SlashCommand/Logs.js";
import {LogsButtonInteractionHandler} from "../Handler/Interaction/Button/LogsButtonInteractionHandler.js";
import LogsContextMenuHandler from "../Handler/Interaction/ContextMenu/LogsContextMenuHandler.js";
import {LogsSelectInteractionHandler} from "../Handler/Interaction/Select/LogsSelectInteractionHandler.js";
import {
    LogsCreation,
    LogsUpdate
} from "../Handler/Interaction/Modal/LogsModalHandler.js";
import {ErrorEmbed} from "../Builder/EmbedBuilder.js";
import {Gudalog} from "../Module/Guda.js";
import {client} from "../index.js";

export const Commands = (client, sequelize) => {
    client.on('interactionCreate', async interaction => {
        try {
            if (!interaction.member.permissions.has("ADMINISTRATOR")) {
                let roles = process.env.GUDA_LOG_ALLOWED_ROLES.split(',')
                let allowed = false;
                for (const roleId of roles) {
                    if (!allowed)
                        allowed = interaction.member.roles.cache.some(r => r.id === roleId)
                }

                if (!allowed)
                    return await interaction.reply({content: "Mais qui es-tu ?", ephemeral: true});
            }

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
                // Logs creation handler
                await LogsCreation(interaction)
                // Logs update handler
                await LogsUpdate(interaction)
            }
        } catch (e) {
            /***********************************/
            /*********** CATCH ERROR ***********/
            /***********************************/
            let discordClient = client.guilds.cache.get(process.env.GUILD_ID).client
            let notificationChannel = discordClient.channels.cache.get(process.env.GUDA_LOG_BOT_CHANNEL);
            await notificationChannel.send({
                embeds: [ErrorEmbed(interaction, e)]
            })

            console.log(e)
            // Logger
            await Gudalog.error(e.message, {location: `commands.js`, interaction: interaction.toString()})
        }
    })
}
