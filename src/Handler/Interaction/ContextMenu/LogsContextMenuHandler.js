import {
    LogsCRUDModalBuilder,
    LogsDeleteContextMessageActionBuilder
} from "../../../Builder/Action/CommandActionBuilder.js";
import {config} from 'dotenv'
import {fetchResponse} from "../../../Request/Command/Logs.js";
import {Cache} from "../../../Module/Cache.js";

config();

export default async function LogsContextMenuHandler(interaction) {
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
            let messageId = interaction.targetId
            const response = await fetchResponse(`logs/get/${messageId}`, false)

            if (typeof response !== 'object' || !response.hasOwnProperty('success') || !response.success) {
                return await interaction.reply({
                    content: "Le log est introuvable",
                    ephemeral: true
                })
            }

            Cache.set(`log_delete_${interaction.user.id}_${messageId}`, response.data.id)

            let repliedInteraction = await interaction.guild.channels.cache.get(process.env.GUDA_LOG_BOT_CHANNEL).send(
                LogsDeleteContextMessageActionBuilder(
                    interaction,
                    `https://discord.com/channels/${process.env.GUILD_ID}/${process.env.GUDA_LOG_NOTIFICATION_CHANNEL}/${messageId}`
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
    }
}
