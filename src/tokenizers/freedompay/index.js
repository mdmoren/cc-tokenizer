import { globalConfig } from '../../lib/config.js'

class FreedomPayTokenizer {
    constructor(environment) {
        this.name = 'freedomPay'
        this.cardStorHost = globalConfig.freedomPay.common.cardStorHost
        this.baseUrl = globalConfig.freedomPay[environment].baseUrl
    }

    tokenize({}) {

    }
}

export default FreedomPayTokenizer