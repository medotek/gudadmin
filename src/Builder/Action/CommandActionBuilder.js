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


export function LogsCRUDModalBuilder(interaction) {

    const modal = new ModalBuilder()
        .setCustomId('logs-create-modal')
        .setTitle("Ajouter un log");

    const title = new TextInputBuilder()
        .setCustomId('logs-create-title')
        // The label is the prompt the user sees for this input
        .setLabel("Titre")
        // Short means only a single line of text
        .setStyle(TextInputStyle.Short)
        .setMinLength(1)
        .setMaxLength(255);

    const description = new TextInputBuilder()
        .setCustomId('logs-create-description')
        .setLabel("Description")
        // Paragraph means multiple lines of text.
        .setStyle(TextInputStyle.Paragraph)
        .setMinLength(1)
        .setMaxLength(255);


    /*************************************/
    /******** AUTOCOMPLETE VALUES ********/
    /*************************************/
    if (typeof interaction === 'object' && interaction.hasOwnProperty('targetId') && typeof interaction.targetId !== 'undefined') {
        try {
            // TODO : fetch log by message id from gudapi
        } catch (e) {
            console.error(e);
        }
    }

    const firstActionRow = new ActionRowBuilder().addComponents(title);
    const secondActionRow = new ActionRowBuilder().addComponents(description);

    // Add inputs to the modal
    modal.addComponents(firstActionRow, secondActionRow);

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
        .setStyle(TextInputStyle.Short);

    const firstActionRow = new ActionRowBuilder().addComponents(modalInputTitle);
    const secondActionRow = new ActionRowBuilder().addComponents(modalInputDescription);
    const thirdActionRow = new ActionRowBuilder().addComponents(modalInputLink);

    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

    return modal;
}
