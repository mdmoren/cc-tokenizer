import { globalConfig } from '../../lib/config.js';
import { cardStorBuildXML, freedomPayParseXML, freeWayBuildXML } from './helpers/xml.js';
import { validateCardStorPayload, validateFreeWayPayload } from './helpers/validation.js';
import soapRequest from 'easy-soap-request';
import type { 
    IFreedomPayTokenizer, 
    FreedomPayConfig, 
    FreedomPayCardStorParams,
    FreedomPayFreewayParams,
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
    private fpRsa: string;
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
        this.fpRsa = config.fpRsa;
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
        merchantReferenceCode = 'MERCH_REF_001'
    }: FreedomPayFreewayParams): Promise<TokenizerResponse> {
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
}

export default FreedomPayTokenizer;