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

/**
 *
 * @param interaction
 * @param origin - Origin of the action (select or message context)
 * @param id
 * @returns {Promise<ModalBuilder|boolean>}
 */
export async function LogsCRUDModalBuilder(interaction, origin = 'context', id = null) {
    const modal = new ModalBuilder()
        .setCustomId('logs-update-modal')
        .setTitle("Modifier un log");

    const description = new TextInputBuilder()
        .setCustomId('logs-update-description')
        .setLabel("Description")
        // Paragraph means multiple lines of text.
        .setStyle(TextInputStyle.Paragraph);

    const url = new TextInputBuilder()
        .setCustomId('logs-update-url')
        .setLabel("URL")
        // Paragraph means multiple lines of text.
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(255)
        .setRequired(false);

    const kind = new TextInputBuilder()
        .setCustomId('logs-update-kind')
        .setLabel("Entité")
        .setStyle(TextInputStyle.Short)
        .setMaxLength(255)
        .setRequired(false);


    /*************************************/
    /******** AUTOCOMPLETE VALUES ********/
    /*************************************/
    if (typeof interaction === 'object') {
        try {
            let data = '';

            if (origin === 'context' && interaction.hasOwnProperty('targetId') && typeof interaction.targetId !== 'undefined') {
                let response = await fetchResponse(`logs/get/${interaction.targetId}`, false)
                if (typeof response !== 'object' || !response.hasOwnProperty('success') || !response.hasOwnProperty('data'))
                    return false;
                data = response.data
            } else if (origin === 'select' && id) {
                let response = await fetchResponse(`logs/${id.toString()}`, true)
                if (typeof response !== 'object')
                    return false;
                data = response
            } else {
                throw new Error('not valid object')
            }

            let title = `Modification - ${data.title}`
            modal.setTitle(title.slice(0, 45))

            if (data?.isAnUpdate) {
                description.setValue(data.description)
                modal.addComponents(new ActionRowBuilder().addComponents(description));
                if (data.type === 'website') {
                    kind.setValue(data.kind)
                    modal.addComponents(new ActionRowBuilder().addComponents(kind));
                }
            } else {
                url.setValue(data.url)
                modal.addComponents(new ActionRowBuilder().addComponents(url));
            }

            // Cache
            Cache.set(`log_update_${interaction.user.id}`, data)

            return modal;
        } catch (e) {

            console.error(e);
            return false;

        }
    }

    return false;
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
            if (!version.hasOwnProperty('number') || !version.hasOwnProperty('id') || i > 2)
                continue;

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
        .addFields({name: 'Action courante', value: 'Est-ce un ajout ou une mise à jour ?'},)

    let buttonsMenuBuilderRow = new ActionRowBuilder().addComponents(new ButtonBuilder()
        .setCustomId('logs-return-action')
        .setLabel('Retour')
        .setStyle(ButtonStyle.Secondary),)

    let add = new ButtonBuilder()
        .setCustomId('create-log-add-status')
        .setLabel('Ajout')
        .setStyle(ButtonStyle.Success)
    let update = new ButtonBuilder()
        .setCustomId('create-log-update-status')
        .setLabel('Mise à jour')
        .setStyle(ButtonStyle.Primary)


    let buttonsBuilderRow = new ActionRowBuilder().addComponents(add, update)

    return {
        embeds: [embed], components: [buttonsMenuBuilderRow, buttonsBuilderRow]
    }
}


/**
 * Logs creation - Step 3
 * @param interaction
 * @returns {Promise<{content: string}|{components: ActionRowBuilder<AnyComponentBuilder>[], embeds: EmbedBuilder[]}>}
 */
export async function LogsCreateActionBuilderStep3(interaction) {
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
 * Logs creation - Step 4
 * @param interaction
 */
export async function LogsCreateActionBuilderStep4(interaction) {

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
        .setStyle(TextInputStyle.Short)
        .setMaxLength(256);
    const firstActionRow = new ActionRowBuilder().addComponents(modalInputTitle);
    modal.addComponents(firstActionRow);

    if (!cachedLog.isAnUpdate && cachedLog.type !== 'discord') {

        const modalInputLink = new TextInputBuilder()
            .setCustomId('logs-create-modal-link')
            .setLabel("Lien")
            .setStyle(TextInputStyle.Short)
            .setMaxLength(524)
            .setRequired(false);

        const thirdActionRow = new ActionRowBuilder().addComponents(modalInputLink);
        modal.addComponents(thirdActionRow);

    } else {

        const modalInputDescription = new TextInputBuilder()
            .setCustomId('logs-create-modal-description')
            .setLabel("Message")
            .setStyle(TextInputStyle.Paragraph);

        const secondActionRow = new ActionRowBuilder().addComponents(modalInputDescription);
        modal.addComponents(secondActionRow);

    }

    if (cachedLog.type === 'website') {

        const modalInputKind = new TextInputBuilder()
            .setCustomId('logs-create-modal-kind')
            .setLabel("Entité")
            .setPlaceholder("(ex : articles, personnages, fiches personnages, etc...)")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(100);
        const forthActionRow = new ActionRowBuilder().addComponents(modalInputKind);
        modal.addComponents(forthActionRow);

    }

    return modal;
}

export async function LogsSelectActionBuilder(interaction, action = 'update') {
    /** @var {array} logs */
    let logs = await fetchResponse(`logs`, true)
    if (!Array.isArray(logs) || !logs.length) return false

    let embed = new EmbedBuilder();
    embed.setDescription(interaction.message.embeds[0].description)
        .addFields({name: 'Action courante', value: (action === 'delete' ? 'Supprimer' : 'Modifier') + ' un log'},)

    let buttonsMenuBuilderRow = new ActionRowBuilder().addComponents(new ButtonBuilder()
        .setCustomId('logs-return-action')
        .setLabel('Retour')
        .setStyle(ButtonStyle.Secondary))

    let selectMenu = new StringSelectMenuBuilder()
        .setCustomId((action === 'delete' ? 'delete' : 'update') + '-log-select')
        .setPlaceholder('Choisissez le log')

    // Add options
    let array = logs.slice(0, (action === 'delete' ? 10 : 5))
    array.forEach(function (item) {
        selectMenu.addOptions({
            label: item.title.substring(0, 100),
            description: `ID : ${item.id} | Version : ${item.version.number} | Type : ${item.type}`.substring(0, 100),
            value: item.id.toString()
        })
    })

    let selectMenuBuilderRow = new ActionRowBuilder().addComponents(selectMenu)

    return {
        embeds: [embed], components: [buttonsMenuBuilderRow, selectMenuBuilderRow]
    }
}

export function LogsDeleteContextMessageActionBuilder(interaction, messageUrl = null) {
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
        content: `> Action demandée par <@${interaction.user.id}> | Suppression du log ${messageUrl ?? ''}`,
        embeds: [embed],
        components: [buttons]
    }
}
