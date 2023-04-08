import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ModalBuilder,
    StringSelectMenuBuilder,
    TextInputBuilder,
    TextInputStyle,
    version
} from "discord.js";
import {fetchResponse} from "../../Request/Command/Logs.js";
import {config} from 'dotenv'
import {Logs} from "../../Components/logs.js";
import {Cache} from "../../Module/Cache.js";
config()

export function LogsActionsManagementBuilder() {
    return [new ActionRowBuilder()
        .addComponents(new ButtonBuilder()
            .setCustomId('logs-create')
            .setLabel('Ajouter un log')
            .setStyle(ButtonStyle.Primary), new ButtonBuilder()
            .setCustomId('logs-update')
            .setLabel('Modifier un log')
            .setStyle(ButtonStyle.Secondary), new ButtonBuilder()
            .setCustomId('logs-delete')
            .setLabel('Supprimer un log')
            .setStyle(ButtonStyle.Danger),)]
}


export async function LogsCRUDModalBuilder(interaction, origin = 'context', id = null) {
    const modal = new ModalBuilder()
        .setCustomId('logs-update-modal')
        .setTitle("Modifier un log");

    const description = new TextInputBuilder()
        .setCustomId('logs-update-description')
        .setLabel("Description")
        // Paragraph means multiple lines of text.
        .setStyle(TextInputStyle.Paragraph)
        .setMinLength(1)
        .setMaxLength(255);

    const url = new TextInputBuilder()
        .setCustomId('logs-update-url')
        .setLabel("URL")
        // Paragraph means multiple lines of text.
        .setStyle(TextInputStyle.Paragraph)
        .setMinLength(1)
        .setMaxLength(255)
        .setRequired(false);

    /*************************************/
    /******** AUTOCOMPLETE VALUES ********/
    /*************************************/
    if (typeof interaction === 'object') {
        try {

            let _title = '';
            let _description = '';
            let _url = '';
            let _data = '';
            if (origin === 'context' && interaction.hasOwnProperty('targetId') && typeof interaction.targetId !== 'undefined') {
                let response = await fetchResponse(`logs/get/${interaction.targetId}`, false)
                console.log(response)
                if (typeof response !== 'object' || !response.hasOwnProperty('success') || !response.hasOwnProperty('data'))
                    return false;

                _title = response.data.title
                _description = response.data.description
                _url = response.data.url
                _data = response.data
            } else if (origin === 'select' && id) {
                let response = await fetchResponse(`logs/${id.toString()}`, true)
                if (typeof response !== 'object')
                    return false;

                _title = response.title
                _description = response.description
                _url = response.url
                _data = response
            } else {
                throw new Error('not valid object')
            }

            modal.setTitle(`Modification - ${_title}`)
            description.setValue(_description)
            url.setValue(_url)

            // Cache
            Cache.set(`log_update_${interaction.user.id}`, _data)
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    modal.addComponents(
        new ActionRowBuilder().addComponents(description),
        new ActionRowBuilder().addComponents(url)
    );

    return modal;
}

/**
 * Logs creation - Step 1
 * @param interaction
 * @returns {Promise<{content: string}|{components: ActionRowBuilder<AnyComponentBuilder>[], embeds: EmbedBuilder[]}>}
 */
export async function LogsCreateActionBuilderStep1(interaction) {
    let embed = new EmbedBuilder();
    embed.setDescription(interaction.message.embeds[0].description)
        .addFields({name: 'Action courante', value: 'Ajouter un log'},)

    let buttonsMenuBuilderRow = new ActionRowBuilder().addComponents(new ButtonBuilder()
        .setCustomId('logs-return-action')
        .setLabel('Retour')
        .setStyle(ButtonStyle.Secondary),)

    let versions = await fetchResponse('versions', true)

    if (versions && typeof versions !== 'undefined') {
        let selectMenu = new StringSelectMenuBuilder()
            .setCustomId('create-log-version')
            .setPlaceholder('Choisissez la version')

        let i = 0;
        for (const [key, version] of Object.entries(versions)) {
            if (!version.hasOwnProperty('number') || !version.hasOwnProperty('id') || i > 2) return

            selectMenu.addOptions({
                label: version.number.toString(), value: version.id.toString()
            })

            i++
        }

        let selectMenuBuilderRow = new ActionRowBuilder().addComponents(selectMenu)

        return {
            embeds: [embed], components: [buttonsMenuBuilderRow, selectMenuBuilderRow]
        }
    }

    return {
        content: 'Une erreur est survenue'
    }
}

/**
 * Logs creation - Step 2
 * @param interaction
 * @returns {Promise<{content: string}|{components: ActionRowBuilder<AnyComponentBuilder>[], embeds: EmbedBuilder[]}>}
 */
export async function LogsCreateActionBuilderStep2(interaction) {
    let embed = new EmbedBuilder();
    embed.setDescription(interaction.message.embeds[0].description)
        .addFields({name: 'Action courante', value: 'Type de log'},)

    let buttonsMenuBuilderRow = new ActionRowBuilder().addComponents(new ButtonBuilder()
        .setCustomId('logs-return-action')
        .setLabel('Retour')
        .setStyle(ButtonStyle.Secondary),)

    let selectMenu = new StringSelectMenuBuilder()
        .setCustomId('create-log-type')
        .setPlaceholder('Choisissez le type de log')
        .addOptions({
            label: 'Hoyolab', value: 'hoyolab'
        }, {
            label: 'Site', value: 'website'
        }, {
            label: 'Twitter', value: 'twitter'
        }, {
            label: 'Youtube', value: 'youtube'
        }, {
            label: 'Discord', value: 'discord'
        })

    let selectMenuBuilderRow = new ActionRowBuilder().addComponents(selectMenu)

    return {
        embeds: [embed], components: [buttonsMenuBuilderRow, selectMenuBuilderRow]
    }
}


/**
 * Logs creation - Step 3
 * @param interaction
 */
export async function LogsCreateActionBuilderStep3(interaction) {

    let cachedLog = await Logs.getCachedLog(interaction, 'create')
    if (!cachedLog) return false;
    let version = await fetchResponse(`versions/${cachedLog.version}`, true)
    if (typeof version !== 'object' || !version.hasOwnProperty('number')) return false;
    let title = `Création d'un log ${version.number} - ${cachedLog.type}`;

    // max length -> 45
    if (title.length > 45) title = title.slice(0, 44)
    const modal = new ModalBuilder()
        .setCustomId('logs-create-modal')
        .setTitle(title);

    const modalInputTitle = new TextInputBuilder()
        .setCustomId('logs-create-modal-title')
        .setLabel("Titre")
        .setStyle(TextInputStyle.Short);

    const modalInputDescription = new TextInputBuilder()
        .setCustomId('logs-create-modal-description')
        .setLabel("Message")
        .setStyle(TextInputStyle.Paragraph);

    const modalInputLink = new TextInputBuilder()
        .setCustomId('logs-create-modal-link')
        .setLabel("Lien")
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

    const firstActionRow = new ActionRowBuilder().addComponents(modalInputTitle);
    const secondActionRow = new ActionRowBuilder().addComponents(modalInputDescription);
    const thirdActionRow = new ActionRowBuilder().addComponents(modalInputLink);

    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

    return modal;
}

export async function LogsUpdateActionBuilder(interaction) {
    /** @var {array} logs */
    let logs = await fetchResponse(`logs`, true)
    if (!Array.isArray(logs) || !logs.length) return false

    let embed = new EmbedBuilder();
    embed.setDescription(interaction.message.embeds[0].description)
        .addFields({name: 'Action courante', value: 'Modifier un log'},)

    let buttonsMenuBuilderRow = new ActionRowBuilder().addComponents(new ButtonBuilder()
        .setCustomId('logs-return-action')
        .setLabel('Retour')
        .setStyle(ButtonStyle.Secondary))

    let selectMenu = new StringSelectMenuBuilder()
        .setCustomId('update-log-select')
        .setPlaceholder('Choisissez le log')

    // Add options
    let array = logs.slice(0, 5)
    array.forEach(function (item) {
        selectMenu.addOptions({
            label: item.title, value: item.id.toString()
        })
    })

    let selectMenuBuilderRow = new ActionRowBuilder().addComponents(selectMenu)

    return {
        embeds: [embed], components: [buttonsMenuBuilderRow, selectMenuBuilderRow]
    }
}

export function LogsDeleteContextMessageActionBuilder(messageUrl, interaction) {
    let embed = new EmbedBuilder();
    embed.setDescription("Etes-vous sûr de supprimer le log ?")

    let buttons = new ActionRowBuilder().addComponents(new ButtonBuilder()
        .setCustomId('logs-delete-confirm')
        .setLabel('Supprimer')
        .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('logs-delete-cancel')
            .setLabel('Annuler')
            .setStyle(ButtonStyle.Secondary))

    return {
        content: `> Action demandée par <@${interaction.user.id}> | Suppression du log ${messageUrl}`,
        embeds: [embed],
        components: [buttons]
    }
}
