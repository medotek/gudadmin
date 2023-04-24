import {request} from 'undici'
import {config} from 'dotenv'
import {Gudalog} from "../Module/Guda.js";

config()

/**
 * This class has to be defined on the overall app x bridge : Gu-dahsboard
 * @class GudaTokenService
 */
export class GudaTokenService {
    constructor() {
        this.gudapiToken = null;
        this.lastTimeUpdate = null;
    }

    async getBearerToken() {
        if (this.lastTimeUpdate) {
            // + 1h
            let lastTimeUpdateAfter = this.getLastTimeUpdate() + 3600
            if (Date.now() < lastTimeUpdateAfter) {
                return this.gudapiToken;
            }
        }

        // Add/Update token
        await this.setBearerToken();

        return this.gudapiToken
    }

    async setBearerToken() {
        try {
            const {statusCode, headers, trailers, body} = await this.getCredentials()
            if (statusCode === 200) {
                this.gudapiToken = await body.json().then(r => {
                    if (r.token !== undefined && r.token) {
                        this.setLastTimeUpdate()
                        return r.token
                    } else {
                        return null
                    }
                }).catch(err => {
                    return null
                })
            } else {
                this.gudapiToken = null
            }
        } catch (e) {
            // TODO : cannot call gudalog before initialization
        }
    }

    getLastTimeUpdate() {
        return this.lastTimeUpdate;
    }

    setLastTimeUpdate() {
        this.lastTimeUpdate = Date.now();
    }

    /**
     * The way to retrieve the bearer token from Gu-dashboard
     * - login as user / ROLE_BOT
     */
    async getCredentials() {
        return await request(`${process.env.GUDA_SSL}://${process.env.GUDA_BASEURL}/api/login`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                email: process.env.GUDA_EMAIL,
                password: process.env.GUDA_PWD
            })
        });
    }
}
