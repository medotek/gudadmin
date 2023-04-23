// Init logger
import {createLogger} from "@livy/logger";
import {RotatingFileHandler} from "@livy/rotating-file-handler";
import {GudaToken} from "../Module/Guda.js";
import {HttpHandler} from "@livy/http-handler";
import {config} from 'dotenv'

config()

export default class Logger {
    _syncLogger
    _asyncLogger
    _gudaToken

    constructor(gudaToken) {
        // Sync logger for rotating logs
        this._syncLogger = createLogger('gudadmin-logger-sync', {
            mode: 'sync',
            handlers: [
                // Write daily rotating, automatically deleted log files
                new RotatingFileHandler('log/error_%date%.log', {
                    level: 'error',
                    maxFiles: 30
                })
            ]
        })

        this._asyncLogger = createLogger('gudadmin-logger-async', {
            mode: 'async'
        })

        this._gudaToken = gudaToken
    }

    /**
     * Return http logger handler
     * Handle authorization token expiration
     */
    async asyncLogger(httpHandler = null) {
        if (httpHandler) {
            this._asyncLogger._handlers.clear()
            this._asyncLogger._handlers.add(httpHandler)
        }

        return this._asyncLogger
    }

    /**
     * @returns {SyncLogger}
     */
    get rotatingLogger() {
        return this._syncLogger
    }

    get gudaToken() {
        return this._gudaToken
    }
}
