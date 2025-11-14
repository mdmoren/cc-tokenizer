import { freedomPayMakeTracke } from '../../tokenizers/freedompay/helpers/xml.js';
import type { 
    EncryptorResponse, 
    IFreedomPayEncryptor, 
    FreedomPayEncryptParams 
} from '../../types/index.js';

export default class FreedomPayEncryptor implements IFreedomPayEncryptor {
    public name: string = 'FreedomPayEncryptor';
    private rsaPublicKey: string;

    constructor(rsaPublicKey: string) {
        if (!rsaPublicKey) {
            throw new Error('RSA public key is required for FreedomPay encryptor');
        }
        this.rsaPublicKey = rsaPublicKey;
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

            // Use the existing freedomPayMakeTracke function to encrypt the data
            const trackeVal = await freedomPayMakeTracke(
                cardNumber,
                expirationMonth,
                expirationYear,
                securityCode,
                this.rsaPublicKey
            );

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
