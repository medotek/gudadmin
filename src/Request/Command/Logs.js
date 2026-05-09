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
