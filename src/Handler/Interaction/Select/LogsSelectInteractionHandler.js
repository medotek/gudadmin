import {Logs} from "../../../Components/logs.js";
import {
    LogsCreateActionBuilderStep2,
    LogsCreateActionBuilderStep3, LogsCRUDModalBuilder, LogsDeleteContextMessageActionBuilder
} from "../../../Builder/Action/CommandActionBuilder.js";
import {Cache} from "../../../Module/Cache.js";
import {fetchResponse} from "../../../Request/Command/Logs.js";

export async function LogsSelectInteractionHandler(interaction) {
    let value = interaction.values[0]
    switch (interaction.customId) {
        case 'create-log-version':

            if (await Logs.create(1, interaction.user.id, interaction.message.id, value)) {
                let newInteraction1 = await LogsCreateActionBuilderStep2(interaction)
                await interaction.update(newInteraction1)
            } else {
                await interaction.update({content: 'Error', components: [], embeds: []})
            }
            break

        case 'create-log-type':

            if (await Logs.create(2, interaction.user.id, interaction.message.id, value)) {
                let newInteraction2 = await LogsCreateActionBuilderStep3(interaction)
                await interaction.showModal(newInteraction2)
            } else {
                await interaction.update({content: 'Error', components: [], embeds: []})
            }
            break

        case 'update-log-select':
            // Update log from SELECT action
            let modal = await LogsCRUDModalBuilder(interaction, 'select', value)
            if (!modal) return await interaction.reply({content: 'Error thrown', ephemeral: true})

            await interaction.showModal(modal)
            break;

        case 'delete-log-select':
            const response = await fetchResponse(`logs/${value}`, true)

            if (typeof response !== 'object'
                || !response.hasOwnProperty('id')
                || (response.hasOwnProperty('success') && !response.success)
            ) {
                return await interaction.reply({
                    content: "Le log est introuvable",
                    ephemeral: true
                })
            }

            let messageUrl = null
            if (response.hasOwnProperty('discordMessageId') && response.discordMessageId) {
                Cache.set(`log_delete_${interaction.user.id}_${response.discordMessageId}`, response.id)
                messageUrl = `https://discord.com/channels/${process.env.GUILD_ID}/${process.env.GUDA_LOG_NOTIFICATION_CHANNEL}/${response.discordMessageId}`
            } else {
                Cache.set(`log_delete_select_${interaction.user.id}`, value)
            }

            let repliedInteraction = await interaction.guild.channels.cache.get(process.env.GUDA_LOG_BOT_CHANNEL).send(
                LogsDeleteContextMessageActionBuilder(
                    interaction,
                    messageUrl ?? '#' + response.id
                )
            )

            setTimeout(async function () {
                try {
                    await repliedInteraction.delete()
                } catch (e) {
                    // prevent from throwing error
                }
            }, 30000)

            await interaction.reply({
                content: `Valider la suppression du log https://discord.com/channels/${repliedInteraction.guildId}/${repliedInteraction.channelId}/${repliedInteraction.id}`,
                ephemeral: true
            })
            break;
        default:
            await interaction.reply({content: 'Error thrown', ephemeral: true})
    }
}
