import Shift4Tokenizer from './tokenizers/shift4/index.js'
import FreedomPayTokenizer from './tokenizers/freedompay/index.js'

export class CCTokenizer {
    constructor({ environment, options = {} }) {
        if (!environment) {
            throw new Error("Environment is required");
        }
        
        this.environment = environment;
        this.tokenizers = {};

        // Initialize enabled tokenizers
        if (options.shift4 && options.shift4.enabled) {
            this.tokenizers.shift4 = new Shift4Tokenizer(environment, options.shift4);
        }
        if (options.freedomPay) {
            this.tokenizers.freedomPay = new FreedomPayTokenizer(environment);
        }
    }

    // add methods here to interact with the tokenizers
    getTokenizer(name) {
        return this.tokenizers[name];
    }
}