/**
 * Type checking test - verifies all types are properly exported and accessible
 */

import { CCTokenizer, CCEncryptor } from './dist/index.js';
import type {
    // Main classes
    CCTokenizerConstructorOptions,
    CCTokenizerOptions,
    
    // Configs
    Shift4Config,
    FreedomPayConfig,
    FreedomPayHpcConfig,
    EncryptorConfig,
    
    // Tokenizer Interfaces
    IShift4Tokenizer,
    IFreedomPayTokenizer,
    IFreedomPayHpcTokenizer,
    IFreedomPayEncryptor,
    
    // Parameter Types
    Shift4TokenizeParams,
    FreedomPayCardStorParams,
    FreedomPayFreewayParams,
    FreedomPayFreewayWithTrackeParams,
    FreedomPayHpcGetAccessTokenParams,
    FreedomPayHpcGetRsaPublicKeyParams,
    FreedomPayHpcGetPaymentKeyParams,
    FreedomPayHpcPaymentRequestParams,
    FreedomPayHpcTokenizeParams,
    FreedomPayEncryptParams,
    
    // Response Types
    TokenizerResponse,
    EncryptorResponse
} from './dist/index.js';

// Test 1: Constructor options are properly typed
const options: CCTokenizerConstructorOptions = {
    environment: 'test',
    options: {
        shift4: {
            enabled: true,
            accessToken: 'test',
            companyName: 'Test',
            interfaceName: 'Test',
            interfaceVersion: '1.0'
        },
        freedomPay: {
            enabled: true,
            fpStoreId: 'test',
            fpTerminalId: 'test',
            fpEskey: 'test',
            fpKsn: 'test',
            fpTokenType: 'test'
        },
        freedomPayHpc: {
            enabled: true,
            code: 'test',
            key: 'test',
            storeId: 'test',
            terminalId: 'test',
            esKey: 'test'
        }
    }
};

// Test 2: Tokenizer initialization
const tokenizer = new CCTokenizer(options);

// Test 3: Type-safe method access
const shift4: IShift4Tokenizer | undefined = tokenizer.shift4();
const freedomPay: IFreedomPayTokenizer | undefined = tokenizer.freedomPay();
const hpc: IFreedomPayHpcTokenizer | undefined = tokenizer.freedomPayHpc();

// Test 4: Parameter types are properly defined
const shift4Params: Shift4TokenizeParams = {
    firstName: 'John',
    lastName: 'Doe',
    cardNumber: '4111111111111111',
    expirationDate: '1225'
};

const freedomPayParams: FreedomPayCardStorParams = {
    cardNumber: '4111111111111111',
    expirationMonth: '12',
    expirationYear: '25'
};

const hpcParams: FreedomPayHpcTokenizeParams = {
    cardNumber: '4111111111111111',
    expirationMonth: '12',
    expirationYear: '25',
    securityCode: '123'
};

// Test 5: Encryptor initialization
const encryptor = new CCEncryptor({
    freedomPay: {
        fpRsa: 'test-key'
    }
});

const freedomPayEncryptor: IFreedomPayEncryptor | undefined = encryptor.freedomPay();

// Test 6: Method signatures are correctly typed
async function testMethodSignatures() {
    if (shift4) {
        const result: TokenizerResponse = await shift4.tokenize(shift4Params);
        // @ts-expect-error - Should error: cardStorTokenize doesn't exist on Shift4
        await shift4.cardStorTokenize(freedomPayParams);
    }
    
    if (freedomPay) {
        const result: TokenizerResponse = await freedomPay.cardStorTokenize(freedomPayParams);
        // @ts-expect-error - Should error: getAccessToken doesn't exist on FreedomPay
        await freedomPay.getAccessToken({} as any);
    }
    
    if (hpc) {
        const result: TokenizerResponse = await hpc.tokenize(hpcParams);
        const accessToken: TokenizerResponse = await hpc.getAccessToken({
            storeId: 'test',
            terminalId: 'test',
            esKey: 'test'
        });
        // @ts-expect-error - Should error: cardStorTokenize doesn't exist on HPC
        await hpc.cardStorTokenize(freedomPayParams);
    }
    
    if (freedomPayEncryptor) {
        const result: EncryptorResponse = await freedomPayEncryptor.encrypt({
            cardNumber: '4111111111111111',
            expirationMonth: '12',
            expirationYear: '25',
            securityCode: '123'
        });
    }
}

console.log('✅ All type checks passed!');
