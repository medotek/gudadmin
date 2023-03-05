import {request} from 'undici'
import {config} from 'dotenv'
import {GudaToken} from "../../Module/GudaToken.js"
config()


/**
 *
 * @param endpoint
 * @param data
 * @param method
 * @returns {Promise<null>}
 */
export async function fetchResponse(endpoint, data = null, method = "GET") {
    let results = null;
    const {statusCode, body} = await gudapiEndpointRequest(endpoint, data, method)

    if (statusCode === 200) {
        results = await body.json().then(res => {
            return res
        }).catch(err => {
            return null
        })
    }

    return results;
}

/**
 * @param endpoint
 * @param data
 * @param method
 * @returns {Promise<Dispatcher.ResponseData>}
 */
export async function gudapiEndpointRequest(endpoint, data = null, method = "GET") {
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
        options.body = data
    }

    return await request(
        process.env.GUDASHBOARD_BASE_URL + endpoint,
        options
    )
}
