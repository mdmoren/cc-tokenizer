import Shift4Tokenizer from './tokenizers/shift4/index.js';
import FreedomPayTokenizer from './tokenizers/freedompay/index.js';
import type { 
    CCTokenizerConstructorOptions,
    IShift4Tokenizer,
    IFreedomPayTokenizer
} from './types/index.js';

export class CCTokenizer {
    public environment: string;
    public tokenizers: {
        shift4?: IShift4Tokenizer;
        freedomPay?: IFreedomPayTokenizer;
    };

    constructor({ environment, options = {} }: CCTokenizerConstructorOptions) {
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
    getTokenizer(name: string): IShift4Tokenizer | IFreedomPayTokenizer | undefined {
        return this.tokenizers[name as keyof typeof this.tokenizers];
    }
}

// Export types for consumers
export type {
    CCTokenizerConstructorOptions,
    CCTokenizerOptions,
    Shift4Config,
    FreedomPayConfig,
    Shift4TokenizeParams,
    FreedomPayCardStorParams,
    FreedomPayFreewayParams,
    TokenizerResponse,
    IShift4Tokenizer,
    IFreedomPayTokenizer
} from './types/index.js';