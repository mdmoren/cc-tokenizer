import {XMLBuilder, XMLParser} from 'fast-xml-parser';
import crypto from 'crypto';

function onlyDigits(v: string | number | null | undefined): string {
    return String(v ?? '').replace(/\D/g, '');
}

function normalizeExpiration(expirationMonth: string, expirationYear: string): { mm: string; yy: string } {
    const mm = onlyDigits(expirationMonth).padStart(2, '0');
    const yy = onlyDigits(expirationYear).slice(-2).padStart(2, '0');

    const mmNum = Number(mm);
    if (!(mmNum >= 1 && mmNum <= 12)) {
        throw new Error(`Invalid expiration month: ${expirationMonth}`);
    }
    return { mm, yy };
}

export function cardStorBuildXML(
    storeId: string, 
    terminalId: string, 
    tokenType: string, 
    cardStorHost: string, 
    freewayHost: string, 
    cardNumber: string,        
    expirationMonth: string,
    expirationYear: string
): string {
    const builder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        format: true,
    });

    const { mm } = normalizeExpiration(expirationMonth, expirationYear);

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
                            expirationMonth: { '@_xmlns': freewayHost, '#text': mm },
                            expirationYear: { '@_xmlns': freewayHost, '#text': expirationYear },
                        }
                    }
                }
            }
        }
    };

    return builder.build(body);
}

function hasSubtleCrypto(): boolean {
    return typeof globalThis !== 'undefined' && !!globalThis.crypto && !!globalThis.crypto.subtle;
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(new Uint8Array(buf)).toString('base64');
    }
    let binary = '';
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    // btoa is available in browsers
    return btoa(binary);
}

function pemToSpkiArrayBuffer(pem: string): ArrayBuffer {
    const cleaned = String(pem)
        .replace(/-----BEGIN PUBLIC KEY-----/g, '')
        .replace(/-----END PUBLIC KEY-----/g, '')
        .replace(/\s+/g, '');
    if (typeof Buffer !== 'undefined') {
        return Uint8Array.from(Buffer.from(cleaned, 'base64')).buffer;
    }
    const raw = atob(cleaned);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out.buffer;
}

export async function freedomPayMakeTracke(
    cardNumber: string,        
    expirationMonth: string,
    expirationYear: string,
    securityCode: string,
    rsaPublicKeyPem: string 
): Promise<string> {
    // Spec: M{PAN}={YY}{MM}:{CVV}
    const { mm, yy } = normalizeExpiration(expirationMonth, expirationYear);
    const pan = onlyDigits(cardNumber);
    const cvv = onlyDigits(securityCode);

    const payload = `M${pan}=${yy}${mm}:${cvv}`;

    if (hasSubtleCrypto()) {
        // Browser: use Web Crypto (RSA-OAEP with SHA-1)
        const pem = freedomPayValidatePem(rsaPublicKeyPem);
        const spki = pemToSpkiArrayBuffer(pem);
        const key = await globalThis.crypto.subtle.importKey(
            'spki',
            spki,
            { name: 'RSA-OAEP', hash: 'SHA-1' },
            false,
            ['encrypt']
        );
        const encoded = new TextEncoder().encode(payload);
        const encrypted = await globalThis.crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, encoded);
        return arrayBufferToBase64(encrypted);
    } else {
        // Node: use crypto.publicEncrypt (RSA-OAEP with SHA-1)
        const encrypted = crypto.publicEncrypt(
            {
                key: freedomPayValidatePem(rsaPublicKeyPem),
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha1',
            },
            Buffer.from(payload, 'utf8')
        );
        return encrypted.toString('base64');
    }
}

export interface FreedomPayTokenInformation {
    accountNumberMasked: string | null;
    token: string | null;
    cardExpirationMonth: string | null;
    cardExpirationYear: string | null;
    tokenExpiration: string | null;
    brand: string | null;
}

export interface FreedomPaySuccessResponse {
    ok: true;
    response: {
        requestId: any;
        decision: string;
        reasonCode: any;
        tokenInformation: FreedomPayTokenInformation;
    };
}

export interface FreedomPayErrorResponse {
    ok: false;
    response: {
        decision: string;
        reasonCode: any;
        requestId: any;
        missingFields?: any;
    };
}

export type FreedomPayParseResult = FreedomPaySuccessResponse | FreedomPayErrorResponse;

export function freedomPayParseXML(response: string): FreedomPayParseResult {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_'
    });

    const json = parser.parse(response);

    const result = json?.['soap:Envelope']?.['soap:Body']?.['SubmitResponse']?.['SubmitResult'];

    const decision = result?.decision;
    const tokenInformation = result?.tokenInformation;

    const textOf = (node: any): string | null => {
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

export function freedomPayValidatePem(pem: string): string {
    if (!pem) {
        throw new Error('Missing RSA public key');
    }

    const trimmed = String(pem).trim().replace(/^"|"$/g, '');

    if (/-----BEGIN [A-Z ]+KEY-----/.test(trimmed)) {
        return trimmed; // already PEM
    }

    const base64 = trimmed.replace(/\s+/g, '');
    const wrapped = base64.match(/.{1,64}/g)?.join('\n') || base64;

    return `-----BEGIN PUBLIC KEY-----\n${wrapped}\n-----END PUBLIC KEY-----`;
}

export async function freeWayBuildXML(
    storeId: string, 
    terminalId: string, 
    trackKsn: string, 
    rsaPublicKeyPem: string, 
    tokenType: string, 
    freewayHost: string, 
    cardNumber: string,        
    expirationMonth: string,
    expirationYear: string,
    securityCode: string,
    firstName: string,
    lastName: string,
    merchantReferenceCode: string | null = null
): Promise<string> {
    const tracke = await freedomPayMakeTracke(
        cardNumber,        
        expirationMonth,
        expirationYear,
        securityCode,
        rsaPublicKeyPem 
    );

    if (!tracke) {
        throw new Error('Error generating encrypted tracke data');
    }

    const builder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        suppressBooleanAttributes: false,
        format: true,
    });

    const request: any = {
        storeId,
        terminalId,
        card: {
            cardType: 'credit',
            nameOnCard: `${firstName} ${lastName}`,
        },
        pos: {
            entryMode: 'keyed',
            cardPresent: 'N',
            trackKsn,
            tracke,
            encMode: 'rsa',
            msrType: 'none'
        },
        tokenCreateService: {
            '@_run': 'true',
            type: tokenType
        },
        ccAuthService: {
            '@_run': 'true',
            commerceIndicator: 'internet',
            cofIndicator: 'S'
        },
        purchaseTotals: {
            chargeAmount: '0'
        }
    };

    if (merchantReferenceCode) {
        request.merchantReferenceCode = merchantReferenceCode;
    }
    
    const body = {
        'soap:Envelope': {
            '@_xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
            '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            '@_xmlns:xsd': 'http://www.w3.org/2001/XMLSchema',
            'soap:Body': {
                Submit: {
                    '@_xmlns': freewayHost,
                    request
                }
            }
        }
    };

    return builder.build(body);
}

export async function freeWayBuildXMLWithTracke(
    storeId: string, 
    terminalId: string, 
    trackKsn: string,
    tokenType: string, 
    freewayHost: string, 
    tracke: string,
    firstName: string,
    lastName: string,
    merchantReferenceCode: string | null = null
): Promise<string> {
    if (!tracke) {
        throw new Error('Encrypted tracke data is required');
    }

    const builder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        suppressBooleanAttributes: false,
        format: true,
    });

    const request: any = {
        storeId,
        terminalId,
        card: {
            cardType: 'credit',
            nameOnCard: `${firstName} ${lastName}`,
        },
        pos: {
            entryMode: 'keyed',
            cardPresent: 'N',
            trackKsn,
            tracke,
            encMode: 'rsa',
            msrType: 'none'
        },
        tokenCreateService: {
            '@_run': 'true',
            type: tokenType
        },
        ccAuthService: {
            '@_run': 'true',
            commerceIndicator: 'internet',
            cofIndicator: 'S'
        },
        purchaseTotals: {
            chargeAmount: '0'
        }
    };

    if (merchantReferenceCode) {
        request.merchantReferenceCode = merchantReferenceCode;
    }
    
    const body = {
        'soap:Envelope': {
            '@_xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
            '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            '@_xmlns:xsd': 'http://www.w3.org/2001/XMLSchema',
            'soap:Body': {
                Submit: {
                    '@_xmlns': freewayHost,
                    request
                }
            }
        }
    };

    return builder.build(body);
}