import {
    LogsCRUDModalBuilder,
    LogsDeleteContextMessageActionBuilder
} from "../../../Builder/Action/CommandActionBuilder.js";
import {config} from 'dotenv'

config();

export async function LogsContextMenuHandler(interaction) {
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
            // TODO : Set messageId into cache

            let repliedInteraction = await interaction.guild.channels.cache.get(process.env.GUDA_LOG_BOT_CHANNEL).send(
                LogsDeleteContextMessageActionBuilder(`https://discord.com/channels/${process.env.GUILD_ID}/${process.env.GUDA_LOG_NOTIFICATION_CHANNEL}/${messageId}`, interaction)
            )

            setTimeout(async function () {
                repliedInteraction.delete()
            }, 30000)

            await interaction.reply({
                content: `Valider la suppression du log https://discord.com/channels/${repliedInteraction.guildId}/${repliedInteraction.channelId}/${repliedInteraction.id}`,
                ephemeral: true
            })
            break;
    }
}
