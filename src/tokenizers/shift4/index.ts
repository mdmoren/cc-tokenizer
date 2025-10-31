import { globalConfig } from '../../lib/config.js';
import { validateShift4Payload } from './helpers/validation.js';
import axios from 'axios';
import type { 
    IShift4Tokenizer, 
    Shift4Config, 
    Shift4TokenizeParams, 
    TokenizerResponse,
    Shift4Payload,
    Shift4ApiResponse 
} from '../../types/index.js';

class Shift4Tokenizer implements IShift4Tokenizer {
    public readonly name: string = 'shift4';
    private baseUrl: string;
    private routes: { add: string };
    private accessToken: string;
    private companyName: string;
    private interfaceName: string;
    private interfaceVersion: string;

    constructor(environment: string, config: Shift4Config) {
        const envConfig = globalConfig.shift4[environment as 'production' | 'test'];
        if (!envConfig || !('baseUrl' in envConfig)) {
            throw new Error(`Invalid environment: ${environment}`);
        }
        this.baseUrl = envConfig.baseUrl;
        this.routes = globalConfig.shift4.common.routes;
        this.accessToken = config.accessToken;
        this.companyName = config.companyName;
        this.interfaceName = config.interfaceName;
        this.interfaceVersion = config.interfaceVersion;
    }
    
    async tokenize({
        firstName,
        lastName,
        postalCode,
        cardNumber,
        expirationDate
    }: Shift4TokenizeParams): Promise<TokenizerResponse> {
        let response: TokenizerResponse = {
            success: false,
            message: '',
            data: {},
            errors: []
        };

        const url = this.baseUrl + this.routes.add;
        const headers = {
            AccessToken: this.accessToken,
            CompanyName: this.companyName,
            InterfaceName: this.interfaceName,
            InterfaceVersion: this.interfaceVersion,
            'Content-Type': 'application/json'
        };

        const payload: Shift4Payload = {
            dateTime: new Date().toISOString(),
            card: {
                expirationDate: expirationDate,
                number: cardNumber
            },
            customer: {
                firstName: firstName,
                lastName: lastName,
                postalCode: postalCode || ''
            }
        };

        try {
            const schemaValidation = validateShift4Payload(payload);
            if (!schemaValidation.ok) {
                response.message = 'Error: Schema Validation Failed';
                response.errors = schemaValidation.errors || [];
                return response;
            }

            const shift4Req = await axios.post<Shift4ApiResponse>(url, payload, { headers });
            const apiResponse = shift4Req.data;

            if (apiResponse.result && typeof apiResponse.result === 'object' && 'error' in apiResponse.result) {
                response.message = 'Error: could not tokenize card using Shift4';
                response.errors.push(apiResponse.result.error || {});
            }

            if (apiResponse.result) {
                response.success = true;
                response.message = 'Card tokenized successfully using Shift4';
                response.data = Array.isArray(apiResponse.result) ? apiResponse.result[0] || {} : apiResponse.result || {};
            }

            return response;

        } catch (error: any) {
            response.message = error.message || 'Internal Error: could not tokenize card using Shift4';
            response.errors.push(error.stack || {});

            return response;
        }
    }
}

export default Shift4Tokenizer;