import {XMLBuilder, XMLParser} from 'fast-xml-parser';

export function freedomPayBuildXML(
    storeId, 
    terminalId, 
    esKey,
    trackKsn, 
    rsaPublicKeyPem, 
    tokenType, 
    cardStorHost, 
    freewayHost, 
    cardNumber,        
    expirationMonth,
    expirationYear,
    securityCode
) {
    const builder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        format: true,
    });

    const body = {
        'soap:Envelope': {
            '@_xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
            '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            '@_xmlns:xsd': 'http://www.w3.org/2001/XMLSchema',
            'soap:Body': {
                Submit: {
                    '@_xmlns': cardStorHost,
                    request: {
                        storeId,
                        terminalId,
                        operation: 'create',
                        type: tokenType,
                        card: {
                            accountNumber: { '@_xmlns': freewayHost, '#text': cardNumber },
                            expirationMonth: { '@_xmlns': freewayHost, '#text': expirationMonth },
                            expirationYear: { '@_xmlns': freewayHost, '#text': expirationYear },
                        }
                    }
                }
            }
        }
    };

    return builder.build(body);
}

export function freedomPayParseXML(response) {

    const parser = new XMLParser()

    const json = parser.parse(response, {
        ignoreAttributes: false,
        attributeNamePrefix: '@_'
    });

    const result = json?.['soap:Envelope']?.['soap:Body']?.['SubmitResponse']?.['SubmitResult'];

    const decision = result?.decision;
    const tokenInformation = result?.tokenInformation;

    const textOf = (node) => {
        if (node == null) return null;
        if (typeof node === 'object' && '#text' in node) return node['#text'];
        return node;
    };

    if (decision && String(decision).toUpperCase() === 'ACCEPT' && tokenInformation) {
        return {
            ok: true,
            response: {
                requestId: result?.requestId,
                decision: String(decision).toUpperCase(),
                reasonCode: result?.reasonCode,
                tokenInformation: {
                    accountNumberMasked: textOf(tokenInformation?.accountNumberMasked),
                    token: textOf(tokenInformation?.token),
                    cardExpirationMonth: textOf(tokenInformation?.cardExpirationMonth),
                    cardExpirationYear: textOf(tokenInformation?.cardExpirationYear),
                    tokenExpiration: textOf(tokenInformation?.tokenExpiration),
                    brand: textOf(tokenInformation?.brand)
                }
            }
        };
    }

    if (decision && ['FAILURE', 'ERROR'].includes(String(decision).toUpperCase())) {
        return {
            ok: false,
            response: {
                decision: String(decision).toUpperCase(),
                reasonCode: result?.reasonCode,
                requestId: result?.requestId,
                missingFields: result?.missingFields?.missingField
            }
        };
    }

    return {
        ok: false,
        response: result ?? json
    };
}