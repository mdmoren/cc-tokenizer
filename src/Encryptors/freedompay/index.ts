import { freedomPayMakeTracke } from '../../tokenizers/freedompay/helpers/xml.js';
import type { 
    EncryptorResponse, 
    IFreedomPayEncryptor, 
    FreedomPayEncryptParams 
} from '../../types/index.js';

export default class FreedomPayEncryptor implements IFreedomPayEncryptor {
    public name: string = 'FreedomPayEncryptor';
    private rsaPublicKey: string;
    private showLogging: boolean;

    constructor(rsaPublicKey: string, showLogging: boolean = false) {
        if (!rsaPublicKey) {
            throw new Error('RSA public key is required for FreedomPay encryptor');
        }
        this.rsaPublicKey = rsaPublicKey;
        this.showLogging = showLogging;
    }

    async encrypt(params: FreedomPayEncryptParams): Promise<EncryptorResponse> {
        try {
            const { cardNumber, expirationMonth, expirationYear, securityCode } = params;

            // Validate required parameters
            if (!cardNumber || !expirationMonth || !expirationYear || !securityCode) {
                return {
                    success: false,
                    message: 'Error: Missing required parameters for FreedomPay encryption',
                    data: {},
                    errors: ['Card number, expiration month, expiration year, and security code are required']
                };
            }

            if (this.showLogging) {
                console.log('\n=== FreedomPayEncryptor - method: encrypt ===');
                console.log('Operation: RSA Encryption');
                console.log('Input Data:', {
                    cardNumber,
                    expirationMonth,
                    expirationYear,
                    securityCode,
                    rsaPublicKey: this.rsaPublicKey
                });
            }

            // Use the existing freedomPayMakeTracke function to encrypt the data
            const trackeVal = await freedomPayMakeTracke(
                cardNumber,
                expirationMonth,
                expirationYear,
                securityCode,
                this.rsaPublicKey
            );

            if (this.showLogging) {
                console.log('Encrypted Data Length:', trackeVal.length);
                console.log('Encrypted Data:', trackeVal);
                console.log('=== End encrypt ===\n');
            }

            return {
                success: true,
                message: 'Card data successfully encrypted',
                data: {
                    trackeVal
                },
                errors: []
            };

        } catch (error) {
            return {
                success: false,
                message: 'Error: Could not encrypt card data using FreedomPay',
                data: {},
                errors: [error instanceof Error ? error.message : String(error)]
            };
        }
    }
}
