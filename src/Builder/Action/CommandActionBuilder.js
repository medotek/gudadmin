import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ModalBuilder, StringSelectMenuBuilder,
    TextInputBuilder,
    TextInputStyle
} from "discord.js";
import {fetchResponse} from "../../Request/Command/Logs.js";
import {config} from 'dotenv'
config()

export function LogsActionsManagementBuilder() {
    return [
        new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('logs-create')
                    .setLabel('Ajouter un log')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('logs-update')
                    .setLabel('Modifier un log')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('logs-delete')
                    .setLabel('Supprimer un log')
                    .setStyle(ButtonStyle.Danger),
            )
    ]
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
    if (typeof interaction === 'object'
        && interaction.hasOwnProperty('targetId')
        && typeof interaction.targetId !== 'undefined') {
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
 * @returns {{components: ActionRowBuilder<AnyComponentBuilder>[], embeds: EmbedBuilder[]}}
 * @constructor
 */
export async function LogsCreateActionBuilderStep1(interaction) {
    let embed = new EmbedBuilder();
    embed.setDescription(interaction.message.embeds[0].description)
        .addFields(
            {name: 'Action courante', value: 'Ajouter un log'},
        )

    let buttonsMenuBuilderRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('logs-return-action')
            .setLabel('Retour')
            .setStyle(ButtonStyle.Secondary),
    )

    // TODO : retrieve 3 last versions from gudapi
    let versions = await fetchResponse(`${process.env.GUDA_SSL}://${process.env.GUDA_BASEURL}/api/guda/public/versions`)
    console.log(versions)

    let selectMenuBuilderRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('select-se')
            .setPlaceholder('Choisissez la version')
            .addOptions(
                {
                    label: 'Select me',
                    description: 'This is a description',
                    value: 'first_option',
                }
            )
    )

    return {
        embeds: [embed],
        components: [buttonsMenuBuilderRow, selectMenuBuilderRow]
    }
}
