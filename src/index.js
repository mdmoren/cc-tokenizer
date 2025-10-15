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
            // expected options:
            // {
            //     accessToken: 'your-access-token',    
            //     companyName: 'Your Company',
            //     interfaceName: 'Your Interface',
            //     interfaceVersion: '1.0.0'
            // }
        }
        if (options.freedomPay && options.freedomPay.enabled) {
            this.tokenizers.freedomPay = new FreedomPayTokenizer(environment, options.freedomPay);
            // expected options:
            // {
            //     fpStoreId: 'your-store-id',
            //     fpTerminalId: 'your-terminal-id',
            //     fpEskey: 'your-eskey',
            //     fpKsn: 'your-ksn',
            //     fpRsa: 'your-rsa',
            //     fpTokenType: 'your-token-type'
            // }
        }
    }

    // add methods here to interact with the tokenizers
    getTokenizer(name) {
        return this.tokenizers[name];
    }
}