import {GudaTokenService} from "../Services/GudaTokenService.js"
import Logger from "../Services/Logger.js";
import {HttpHandler} from "@livy/http-handler";
import {config} from 'dotenv'

config();

/*********************************************/
/************* GudaTokenService **************/
/*********************************************/

/**
 * Bearer token generator for the middleware
 * @type {GudaTokenService}
 */
export const GudaToken = new GudaTokenService()

/*********************************************/
/***************** LOGGER ********************/
/*********************************************/

let token = await GudaToken.getBearerToken()
const logger = await new Logger(token)
/**
 * Logger instance for the rotating logs & more
 * @type {{error: ((function(*, *): Promise<void>)|*)}}
 */
export const Gudalog = {
    error: async function (message, context) {
        try {
            logger.rotatingLogger.error(message, context)
            // http request
            let logRecord = {
                level: "error",
                message: message,
                context: context
            }
            let asyncLogger = await logger.asyncLogger(
                new HttpHandler(
                    process.env.GUDASHBOARD_BASE_URL + 'logger',
                    {
                        requestOptions: {
                            method: 'POST',
                            headers: {
                                "Authorization": `Bearer ${await GudaToken.getBearerToken()}`,
                                "Content-Type": "application/json",
                                "Accept": "application/json",
                            },
                            body: JSON.stringify(logRecord)
                        }
                    }))
            // Trigger
            asyncLogger.runHandlers(logRecord)
        } catch (e) {
            console.log(e)
        }
    },
    // TODO : manage other debug levels
}
