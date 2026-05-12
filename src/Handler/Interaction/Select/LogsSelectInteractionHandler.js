import {MessageFlags} from "discord.js";
import {Logs} from "../../../Components/logs.js";
import {
    LogsCreateActionBuilderStep2,
    LogsCreateActionBuilderStep4,
    LogsCreateActionBuilderStep4Twitter,
    LogsCreateNotificationStepBuilder,
    LogsCRUDModalBuilder,
    LogsDeleteContextMessageActionBuilder
} from "../../../Builder/Action/CommandActionBuilder.js";
import {getLatestTweetsForUI} from "../../../Services/TwitterService.js";
import {Cache} from "../../../Module/Cache.js";
import {fetchResponse} from "../../../Request/Command/Logs.js";
import {ErrorEmbed} from "../../../Builder/EmbedBuilder.js";

export async function LogsSelectInteractionHandler(interaction) {
    let value = interaction.values[0]
    switch (interaction.customId) {
        case 'create-log-version':

            if (await Logs.create(1, interaction.user.id, interaction.message.id, value)) {
                let choicesInteraction = await LogsCreateActionBuilderStep2(interaction)
                await interaction.update(choicesInteraction)
            } else {
                await interaction.update({content: '', components: [], embeds: [ErrorEmbed(interaction, {message: "STEP 1"})]})
            }
            break

        case 'create-log-type':

            if (await Logs.create(3, interaction.user.id, interaction.message.id, value)) {
                if (value === 'twitter') {
                    const twitterSelect = await LogsCreateActionBuilderStep4Twitter(interaction)
                    if (!twitterSelect) {
                        await interaction.update({content: 'Impossible de récupérer les tweets, veuillez réessayer', components: [], embeds: []})
                    } else {
                        await interaction.update(twitterSelect)
                    }
                } else {
                    let newInteraction2 = await LogsCreateActionBuilderStep4(interaction)
                    await interaction.showModal(newInteraction2)
                }
            } else {
                await interaction.update({content: '', components: [], embeds: [ErrorEmbed(interaction, {message: "STEP 2"})]})
            }
            break

        case 'create-log-twitter-tweet':
            const tweetId = value
            const cachedTweets = await getLatestTweetsForUI()
            const selectedTweet = cachedTweets.find(t => t.id === tweetId)

            if (!selectedTweet) {
                await interaction.update({content: 'Tweet introuvable, veuillez recommencer', components: [], embeds: []})
                return
            }

            const tweetUrl = `https://x.com/${process.env.X_ACCOUNT_USERNAME}/status/${tweetId}`

            if (await Logs.create(4, interaction.user.id, interaction.message.id, {
                title: selectedTweet.text,
                description: null,
                url: tweetUrl,
                kind: null
            })) {
                await interaction.update(LogsCreateNotificationStepBuilder(interaction))
            } else {
                await interaction.update({content: '', components: [], embeds: [ErrorEmbed(interaction, {message: "STEP 4 Twitter"})]})
            }
            break

        case 'update-log-select':
            // Update log from SELECT action
            let modal = await LogsCRUDModalBuilder(interaction, 'select', value)
            if (!modal) return await interaction.reply({content: 'Error thrown', flags: MessageFlags.Ephemeral})

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
                    flags: MessageFlags.Ephemeral
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
                // Delete after the passed 30 secs
            }, 30000)

            await interaction.reply({
                content: `Valider la suppression du log https://discord.com/channels/${repliedInteraction.guildId}/${repliedInteraction.channelId}/${repliedInteraction.id}`,
                flags: MessageFlags.Ephemeral
            })
            break;
        default:
            await interaction.reply({content: 'Error thrown', flags: MessageFlags.Ephemeral})
    }
}
