import {request} from 'undici'
import {config} from 'dotenv'
import {GudaToken} from "../../Module/GudaToken.js"

config()


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
