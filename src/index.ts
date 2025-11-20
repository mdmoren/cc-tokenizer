import Shift4Tokenizer from './tokenizers/shift4/index.js';
import FreedomPayTokenizer from './tokenizers/freedompay/index.js';
import FreedomPayHpcTokenizer from './tokenizers/freedompay-hpc/index.js';
import FreedomPayEncryptor from './Encryptors/freedompay/index.js';
import type { 
    CCTokenizerConstructorOptions,
    IShift4Tokenizer,
    IFreedomPayTokenizer,
    IFreedomPayHpcTokenizer,
    EncryptorConfig,
    IFreedomPayEncryptor
} from './types/index.js';

export class CCTokenizer {
    public environment: string;
    private tokenizers: {
        shift4?: IShift4Tokenizer;
        freedomPay?: IFreedomPayTokenizer;
        freedomPayHpc?: IFreedomPayHpcTokenizer;
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
        if (options.freedomPayHpc && options.freedomPayHpc.enabled) {
            this.tokenizers.freedomPayHpc = new FreedomPayHpcTokenizer(environment, options.freedomPayHpc);
            // expected options:
            // {
            //     code: 'your-code',
            //     key: 'your-key',
            //     storeId: 'your-store-id',
            //     terminalId: 'your-terminal-id',
            //     esKey: 'your-eskey',
            //     accessToken: 'optional-bearer-token' // Can be obtained via getAccessToken()
            // }
        }
    }

    /**
     * Access the Shift4 tokenizer with full type safety
     * @returns Shift4 tokenizer instance or undefined if not enabled
     */
    shift4(): IShift4Tokenizer | undefined {
        return this.tokenizers.shift4;
    }

    /**
     * Access the FreedomPay tokenizer with full type safety
     * @returns FreedomPay tokenizer instance or undefined if not enabled
     */
    freedomPay(): IFreedomPayTokenizer | undefined {
        return this.tokenizers.freedomPay;
    }

    /**
     * Access the FreedomPay HPC tokenizer with full type safety
     * @returns FreedomPay HPC tokenizer instance or undefined if not enabled
     */
    freedomPayHpc(): IFreedomPayHpcTokenizer | undefined {
        return this.tokenizers.freedomPayHpc;
    }
}

export class CCEncryptor {
    private encryptors: {
        freedomPay?: IFreedomPayEncryptor;
    };

    constructor(options: { freedomPay?: EncryptorConfig } = {}) {
        this.encryptors = {};

        // Initialize FreedomPay encryptor if RSA key is provided
        if (options.freedomPay && options.freedomPay.fpRsa) {
            this.encryptors.freedomPay = new FreedomPayEncryptor(
                options.freedomPay.fpRsa,
                options.freedomPay.showLogging || false
            );
        }
    }

    /**
     * Access the FreedomPay encryptor with full type safety
     * @returns FreedomPay encryptor instance or undefined if not enabled
     */
    freedomPay(): IFreedomPayEncryptor | undefined {
        return this.encryptors.freedomPay;
    }
}

// Export types for consumers
export type {
    CCTokenizerConstructorOptions,
    CCTokenizerOptions,
    Shift4Config,
    FreedomPayConfig,
    FreedomPayHpcConfig,
    Shift4TokenizeParams,
    FreedomPayCardStorParams,
    FreedomPayFreewayParams,
    FreedomPayFreewayWithTrackeParams,
    FreedomPayHpcGetAccessTokenParams,
    FreedomPayHpcGetRsaPublicKeyParams,
    FreedomPayHpcGetPaymentKeyParams,
    FreedomPayHpcPaymentRequestParams,
    FreedomPayHpcPaymentRequestItem,
    FreedomPayHpcTokenizeParams,
    TokenizerResponse,
    IShift4Tokenizer,
    IFreedomPayTokenizer,
    IFreedomPayHpcTokenizer,
    EncryptorResponse,
    EncryptorConfig,
    FreedomPayEncryptParams,
    IEncryptor,
    IFreedomPayEncryptor
} from './types/index.js';