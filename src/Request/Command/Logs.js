import {request} from 'undici'
import {config} from 'dotenv'
import {GudaToken, Gudalog} from "../../Module/Guda.js"

config()


/**
 * Returns the ID of the most recent version from a versions response object.
 * @param {object} versions
 * @returns {number|null}
 */
export function getLatestVersionId(versions) {
    const entries = Object.entries(versions)
    if (!entries.length) return null
    return entries[0][1].id
}

// Tailles des colonnes de l'entité Logs côté gudashboard
const LOG_TITLE_MAX_LENGTH = 255
const LOG_URL_MAX_LENGTH = 255
const LOG_KIND_MAX_LENGTH = 30

/**
 * Tronque une chaîne à `max` caractères (par caractère, pas par unité UTF-16,
 * pour ne pas couper un emoji en deux).
 */
export function truncateText(value, max) {
    if (typeof value !== 'string') return value
    const chars = Array.from(value)
    return chars.length <= max ? value : chars.slice(0, max - 1).join('') + '…'
}

/**
 * Point d'entrée unique pour créer un log. Ne notifie jamais sur Discord :
 * l'appelant n'envoie la notification que si `success` est vrai, puis rattache
 * le message avec attachMessageIdToLog().
 *
 * @param {object} data payload de logs/create
 * @returns {Promise<{success: boolean, message: string, payload: object, response?: any}>}
 */
export async function createLog(data) {
    const payload = {
        ...data,
        title: truncateText(data.title?.trim(), LOG_TITLE_MAX_LENGTH),
        kind: truncateText(data.kind, LOG_KIND_MAX_LENGTH),
        messageId: null
    }

    // Une URL tronquée serait inutilisable : on refuse plutôt que de la couper
    if (payload.url && Array.from(payload.url).length > LOG_URL_MAX_LENGTH) {
        return {success: false, message: `URL trop longue (max ${LOG_URL_MAX_LENGTH} caractères)`, payload}
    }

    const response = await fetchResponse('logs/create', false, payload, 'POST')
    if (response?.success === true) return {success: true, message: response.message, payload}

    return {
        success: false,
        message: response?.message ?? 'Réponse invalide de l\'API logs/create',
        payload,
        response
    }
}

/**
 * Rattache un message Discord à un log déjà créé. logs/create ne renvoyant pas
 * l'id du log, on le retrouve parmi les plus récents de son type (triés par date DESC).
 *
 * @param {object} payload le `payload` renvoyé par createLog()
 * @param {string} messageId
 * @returns {Promise<boolean>}
 */
export async function attachMessageIdToLog(payload, messageId) {
    const logs = await fetchResponse(`logs?type=${encodeURIComponent(payload.type)}`, true)
    if (!Array.isArray(logs)) return false

    // Le backend stocke une url absente sous forme de chaîne vide
    const url = payload.url || ''
    const log = logs.find(l => l.title === payload.title && (l.url || '') === url && !l.discordMessageId)
    if (!log?.id) return false

    const response = await fetchResponse('logs/update', false, {id: log.id, messageId}, 'PUT')
    return response?.success === true
}

/**
 *
 * @param endpoint
 * @param isPublic
 * @param data
 * @param method
 * @returns {Promise<null>}
 */
export async function fetchResponse(endpoint, isPublic = false, data = null, method = "GET") {
    const {statusCode, body} = await gudapiEndpointRequest(endpoint, isPublic, data, method)

    return await body.json().then(res => {
        return res
    }).catch(err => {
        // Logger
        Gudalog.error(err.message, {
            location: `Request/Commands/Logs.js`,
            data: data,
            method: method,
            isPublic: isPublic,
            endpoint: endpoint
        })

        return null
    });
}

/**
 * @param endpoint
 * @param isPublic
 * @param data
 * @param method
 * @returns {Promise<Dispatcher.ResponseData>}
 */
async function gudapiEndpointRequest(endpoint, isPublic = false, data = null, method = "GET") {
    let gudaToken = await GudaToken.getBearerToken()
    let headers = {
        "Authorization": "Bearer " + gudaToken,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    let options = {
        method: method,
        headers: headers
    }
    if (data) {
        options.body = JSON.stringify(data)
    }

    return await request(
        (isPublic ? process.env.GUDASHBOARD_PUBLIC_BASE_URL : process.env.GUDASHBOARD_BASE_URL) + endpoint,
        options
    )
}
