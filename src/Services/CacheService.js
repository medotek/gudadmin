import NodeCache from "node-cache"

export class CacheService {
    constructor(ttlSeconds) {
        this.cache = new NodeCache({
            stdTTL: ttlSeconds,
            checkperiod: ttlSeconds * 0.2,
            useClones: false
        });
    }

    has(key) {
        return this.cache.has(key)
    }

    retrieveAll() {
        return this.cache.keys()
    }

    /**
     * @param key
     * @param result
     * @param stdTTL (optional)
     * @returns {boolean}
     */
    set(key, result, stdTTL = this.cache.stdTTL) {
        return this.cache.set(key, result, stdTTL);
    }

    retrieve(key) {
        const value = this.cache.get(key);
        if (value) {
            return Promise.resolve(value);
        }
        return null;
    }

    clear(keys) {
        this.cache.del(keys);
    }

    flush() {
        this.cache.flushAll();
    }
}
