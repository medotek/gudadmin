/**
 * Declare cache as service for the overall app
 */
import {CacheService} from "../Services/CacheService.js"
const ttl = 60 * 60; // 1H

export const Cache = new CacheService(ttl)
