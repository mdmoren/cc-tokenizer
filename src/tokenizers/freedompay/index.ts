import { globalConfig } from '../../lib/config.js';
import { cardStorBuildXML, freedomPayParseXML, freeWayBuildXML, freeWayBuildXMLWithTracke } from './helpers/xml.js';
import { validateCardStorPayload, validateFreeWayPayload, validateFreeWayWithTrackePayload } from './helpers/validation.js';
import soapRequest from 'easy-soap-request';
import type { 
    IFreedomPayTokenizer, 
    FreedomPayConfig, 
    FreedomPayCardStorParams,
    FreedomPayFreewayParams,
    FreedomPayFreewayWithTrackeParams,
    TokenizerResponse
} from '../../types/index.js';

class FreedomPayTokenizer implements IFreedomPayTokenizer {
    public readonly name: string = 'freedomPay';
    private cardStorHost: string;
    private freewayHost: string;
    private baseUrlCardStor: string;
    private baseUrlFreeway: string;
    private fpStoreId: string;
    private fpTerminalId: string;
    private fpEskey: string;
    private fpKsn: string;
    private fpRsa?: string; // Optional - only needed for methods that encrypt internally
    private fpTokenType: string;

    constructor(environment: string, config: FreedomPayConfig) {
        this.cardStorHost = globalConfig.freedomPay.common.cardStorHost;
        this.freewayHost = globalConfig.freedomPay.common.freewayHost;
        
        const envConfig = globalConfig.freedomPay[environment as 'production' | 'test'];
        if (!envConfig || !('baseUrlCardStor' in envConfig)) {
            throw new Error(`Invalid environment: ${environment}`);
        }
        
        this.baseUrlCardStor = envConfig.baseUrlCardStor;
        this.baseUrlFreeway = envConfig.baseUrlFreeway;
        this.fpStoreId = config.fpStoreId;
        this.fpTerminalId = config.fpTerminalId;
        this.fpEskey = config.fpEskey;
        this.fpKsn = config.fpKsn;
        this.fpRsa = config.fpRsa; // Can be undefined
        this.fpTokenType = config.fpTokenType;
    }

    async cardStorTokenize({
        cardNumber,
        expirationMonth,
        expirationYear,
        securityCode
    }: FreedomPayCardStorParams): Promise<TokenizerResponse> {
        let response: TokenizerResponse = {
            success: false,
            message: '',
            data: {},
            errors: []
        };

        const headers = {
            'Content-Type': 'text/xml;charset=utf-8',
            'SOAPAction': `${this.cardStorHost}Submit`
        };

        const xml = cardStorBuildXML(
            this.fpStoreId,
            this.fpTerminalId,
            this.fpTokenType,
            this.cardStorHost,
            this.freewayHost,
            cardNumber,
            expirationMonth,
            expirationYear
        );

        if (xml) {
            try {
                const schemaValidation = validateCardStorPayload(
                    cardNumber,
                    expirationMonth,
                    expirationYear,
                    securityCode
                );
                if (!schemaValidation.ok) {
                    response.message = 'Error: Schema Validation Failed';
                    response.errors = schemaValidation.errors || [];
                    return response;
                }

                const soapResponse = await soapRequest({
                    url: this.baseUrlCardStor,
                    headers: headers,
                    xml: xml
                });

                const parsedXML = freedomPayParseXML(soapResponse.response.body);

                if (parsedXML.ok === true && parsedXML.response) {
                    response.success = true;
                    response.message = 'Card tokenized successfully using FreedomPay CardStor';
                    response.data = parsedXML.response;
                } else {
                    response.message = 'Error: could not tokenize card using FreedomPay CardStor';
                    response.errors.push(parsedXML.response || {});
                }

                return response;
            } catch (error: any) {
                response.message = 'Internal Error: could not tokenize card using FreedomPay CardStor';
                response.errors.push(error || {});
                return response;
            }
        }

        response.message = 'Error: Failed to build XML for CardStor request';
        return response;
    }

    async freewayTokenize({
        cardNumber,
        expirationMonth,
        expirationYear,
        securityCode,
        firstName,
        lastName,
        merchantReferenceCode = ''
    }: FreedomPayFreewayParams): Promise<TokenizerResponse> {
        let response: TokenizerResponse = {
            success: false,
            message: '',
            data: {},
            errors: []
        };

        // Validate that fpRsa is provided for methods that require encryption
        if (!this.fpRsa) {
            response.message = 'Error: fpRsa is required for freewayTokenize method';
            response.errors.push('fpRsa configuration is missing. This method requires RSA encryption.');
            return response;
        }

        const headers = {
            'Content-Type': 'text/xml;charset=utf-8',
            'SOAPAction': `${this.freewayHost}Submit`
        };

        const xml = await freeWayBuildXML(
            this.fpStoreId,
            this.fpTerminalId,
            this.fpKsn,
            this.fpRsa,
            this.fpTokenType,
            this.freewayHost,
            cardNumber,
            expirationMonth,
            expirationYear,
            securityCode,
            firstName,
            lastName,
            merchantReferenceCode
        );

        if (xml) {
            try {
                const schemaValidation = validateFreeWayPayload(
                    cardNumber,
                    expirationMonth,
                    expirationYear,
                    securityCode,
                    firstName,
                    lastName,
                    merchantReferenceCode
                );
                if (!schemaValidation.ok) {
                    response.message = 'Error: Schema Validation Failed';
                    response.errors = schemaValidation.errors || [];
                    return response;
                }

                const soapResponse = await soapRequest({
                    url: this.baseUrlFreeway,
                    headers: headers,
                    xml: xml
                });

                const parsedXML = freedomPayParseXML(soapResponse.response.body);

                if (parsedXML.ok === true && parsedXML.response) {
                    response.success = true;
                    response.message = 'Card tokenized successfully using FreedomPay Freeway';
                    response.data = parsedXML.response;
                } else {
                    response.message = 'Error: could not tokenize card using FreedomPay Freeway';
                    response.errors.push(parsedXML.response || {});
                }

                return response;
            } catch (error: any) {
                response.message = 'Internal Error: could not tokenize card using FreedomPay Freeway';
                response.errors.push(error || {});
                return response;
            }
        }

        response.message = 'Error: Failed to build XML for Freeway request';
        return response;
    }

    async freewayTokenizeWithTracke({
        tracke,
        firstName,
        lastName,
        merchantReferenceCode
    }: FreedomPayFreewayWithTrackeParams): Promise<TokenizerResponse> {
        let response: TokenizerResponse = {
            success: false,
            message: '',
            data: {},
            errors: []
        };

        const headers = {
            'Content-Type': 'text/xml;charset=utf-8',
            'SOAPAction': `${this.freewayHost}Submit`
        };

        const xml = await freeWayBuildXMLWithTracke(
            this.fpStoreId,
            this.fpTerminalId,
            this.fpKsn,
            this.fpTokenType,
            this.freewayHost,
            tracke,
            firstName,
            lastName,
            merchantReferenceCode
        );

        if (xml) {
            try {
                const schemaValidation = validateFreeWayWithTrackePayload(
                    tracke,
                    firstName,
                    lastName,
                    merchantReferenceCode
                );
                if (!schemaValidation.ok) {
                    response.message = 'Error: Schema Validation Failed';
                    response.errors = schemaValidation.errors || [];
                    return response;
                }

                const soapResponse = await soapRequest({
                    url: this.baseUrlFreeway,
                    headers: headers,
                    xml: xml
                });

                const parsedXML = freedomPayParseXML(soapResponse.response.body);

                if (parsedXML.ok === true && parsedXML.response) {
                    response.success = true;
                    response.message = 'Card tokenized successfully using FreedomPay Freeway with encrypted tracke';
                    response.data = parsedXML.response;
                } else {
                    response.message = 'Error: could not tokenize card using FreedomPay Freeway with encrypted tracke';
                    response.errors.push(parsedXML.response || {});
                }

                return response;
            } catch (error: any) {
                response.message = 'Internal Error: could not tokenize card using FreedomPay Freeway with encrypted tracke';
                response.errors.push(error || {});
                return response;
            }
        }

        response.message = 'Error: Failed to build XML for Freeway request with encrypted tracke';
        return response;
    }
}

export default FreedomPayTokenizer;