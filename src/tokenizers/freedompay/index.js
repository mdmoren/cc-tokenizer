import { globalConfig } from '../../lib/config.js'
import { freedomPayBuildXML, freedomPayParseXML } from './helpers/xml.js'
import { validateFreedomPayPayload } from './helpers/validation.js'
import soapRequest from 'easy-soap-request'

class FreedomPayTokenizer {
    constructor(environment, config = {}) {
        this.name = 'freedomPay'
        this.cardStorHost = globalConfig.freedomPay.common.cardStorHost
        this.freewayHost = globalConfig.freedomPay.common.freewayHost
        this.baseUrl = globalConfig.freedomPay[environment].baseUrl
        this.fpStoreId = config.fpStoreId
        this.fpTerminalId = config.fpTerminalId
        this.fpEskey = config.fpEskey
        this.fpKsn = config.fpKsn
        this.fpRsa = config.fpRsa
        this.fpTokenType = config.fpTokenType
    }

    async tokenize({
        cardNumber,
        expirationMonth,
        expirationYear,
        securityCode
    }) {
        let response = {
            success: false,
            message: '',
            data: {},
            errors: []
        }

        const headers = {
            'Content-Type': 'text/xml;charset=utf-8',
            'SOAPAction': `${this.cardStorHost}Submit`
        };

        const xml = freedomPayBuildXML(
            this.fpStoreId,
            this.fpTerminalId,
            this.fpEskey,
            this.fpKsn,
            this.fpRsa,
            this.fpTokenType,
            this.cardStorHost,
            this.freewayHost,
            cardNumber,
            expirationMonth,
            expirationYear,
            securityCode
        );

        if (xml) {
            let soapResponse;

            try {
                const schemaValidation = validateFreedomPayPayload(
                    cardNumber,
                    expirationMonth,
                    expirationYear,
                    securityCode
                )
                if (!schemaValidation.ok) {
                    response.message = 'Error: Schema Validation Failed'
                    response.errors = schemaValidation.errors
                    return response
                }

                soapResponse = await soapRequest({
                    url: this.baseUrl,
                    headers: headers || {},
                    xml: xml
                });

                const parsedXML = freedomPayParseXML(soapResponse.response.body)

                if (parsedXML.ok === true && parsedXML.response) {
                    response.success = true;
                    response.message = 'Card tokenized successfully using FreedomPay';
                    response.data = parsedXML.response;
                } else {
                    response.message = 'Error: could not tokenize card using FreedomPay';
                    response.errors.push(parsedXML.response || {});
                }

                return response
            } catch (error) {
                response.message = 'Internal Error: could not tokenize card using FreedomPay';
                response.errors.push(error || {});
                return response
            }
        }
    }
}

export default FreedomPayTokenizer
