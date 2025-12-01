import type { 
    ValidationResult,
    FreedomPayHpcGetAccessTokenParams,
    FreedomPayHpcGetRsaPublicKeyParams,
    FreedomPayHpcGetPaymentKeyParams,
    FreedomPayHpcPaymentRequestParams,
    FreedomPayHpcTokenizeParams,
    FreedomPayHpcAcknowledgeParams
} from '../../../types/index.js';

export function validateTokenizePayload(params: any): ValidationResult {
    const errors: string[] = [];

    if (!params.cardNumber || typeof params.cardNumber !== 'string') {
        errors.push('cardNumber is required and must be a string');
    }
    if (!params.expirationMonth || typeof params.expirationMonth !== 'string') {
        errors.push('expirationMonth is required and must be a string');
    }
    if (!params.expirationYear || typeof params.expirationYear !== 'string') {
        errors.push('expirationYear is required and must be a string');
    }
    if (!params.securityCode || typeof params.securityCode !== 'string') {
        errors.push('securityCode is required and must be a string');
    }
    if (!params.nameOnCard || typeof params.nameOnCard !== 'string') {
        errors.push('nameOnCard is required and must be a string');
    }

    // Validate clientMetadata
    if (!params.clientMetadata || typeof params.clientMetadata !== 'object') {
        errors.push('clientMetadata is required and must be an object');
    } else {
        if (!params.clientMetadata.sellingSystemName || typeof params.clientMetadata.sellingSystemName !== 'string') {
            errors.push('clientMetadata.sellingSystemName is required and must be a string');
        }
        if (!params.clientMetadata.sellingSystemVersion || typeof params.clientMetadata.sellingSystemVersion !== 'string') {
            errors.push('clientMetadata.sellingSystemVersion is required and must be a string');
        }
        if (!params.clientMetadata.sellingMiddlewareName || typeof params.clientMetadata.sellingMiddlewareName !== 'string') {
            errors.push('clientMetadata.sellingMiddlewareName is required and must be a string');
        }
        if (!params.clientMetadata.sellingMiddlewareVersion || typeof params.clientMetadata.sellingMiddlewareVersion !== 'string') {
            errors.push('clientMetadata.sellingMiddlewareVersion is required and must be a string');
        }
    }

    // Validate hotelData
    if (!params.hotelData || typeof params.hotelData !== 'object') {
        errors.push('hotelData is required and must be an object');
    } else {
        if (!params.hotelData.folioNumber || typeof params.hotelData.folioNumber !== 'string') {
            errors.push('hotelData.folioNumber is required and must be a string');
        }
        if (!params.hotelData.expectedDuration || typeof params.hotelData.expectedDuration !== 'string') {
            errors.push('hotelData.expectedDuration is required and must be a string');
        }
        if (!params.hotelData.checkinDate || typeof params.hotelData.checkinDate !== 'string') {
            errors.push('hotelData.checkinDate is required and must be a string');
        }
        if (!params.hotelData.checkoutDate || typeof params.hotelData.checkoutDate !== 'string') {
            errors.push('hotelData.checkoutDate is required and must be a string');
        }
        if (!params.hotelData.roomTax || typeof params.hotelData.roomTax !== 'string') {
            errors.push('hotelData.roomTax is required and must be a string');
        }
    }

    return {
        ok: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
    };
}

export function validateGetAccessTokenPayload(params: FreedomPayHpcGetAccessTokenParams): ValidationResult {
    const errors: string[] = [];

    if (!params.storeId || params.storeId.trim() === '') {
        errors.push('storeId is required');
    }

    if (!params.terminalId || params.terminalId.trim() === '') {
        errors.push('terminalId is required');
    }

    if (!params.esKey || params.esKey.trim() === '') {
        errors.push('esKey is required');
    }

    return {
        ok: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
    };
}

export function validateGetRsaPublicKeyPayload(params: FreedomPayHpcGetRsaPublicKeyParams): ValidationResult {
    const errors: string[] = [];

    if (!params.code || params.code.trim() === '') {
        errors.push('code is required');
    }

    if (!params.key || params.key.trim() === '') {
        errors.push('key is required');
    }

    return {
        ok: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
    };
}

export function validateGetPaymentKeyPayload(params: FreedomPayHpcGetPaymentKeyParams): ValidationResult {
    const errors: string[] = [];

    if (!params.cardData || params.cardData.trim() === '') {
        errors.push('cardData is required');
    }

    if (params.paymentType !== 1) {
        errors.push('paymentType must be 1 for Card');
    }

    return {
        ok: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
    };
}

export function validatePaymentRequestPayload(params: any): ValidationResult {
    const errors: string[] = [];

    if (!params.paymentKey || typeof params.paymentKey !== 'string') {
        errors.push('paymentKey is required and must be a string');
    }
    if (typeof params.paymentType !== 'number') {
        errors.push('paymentType is required and must be a number');
    }
    if (!params.storeId || typeof params.storeId !== 'string') {
        errors.push('storeId is required and must be a string');
    }
    if (!params.terminalId || typeof params.terminalId !== 'string') {
        errors.push('terminalId is required and must be a string');
    }
    if (!params.esKey || typeof params.esKey !== 'string') {
        errors.push('esKey is required and must be a string');
    }
    if (!params.trackKsn || typeof params.trackKsn !== 'string') {
        errors.push('trackKsn is required and must be a string');
    }

    // Validate clientMetadata
    if (!params.clientMetadata || typeof params.clientMetadata !== 'object') {
        errors.push('clientMetadata is required and must be an object');
    } else {
        if (!params.clientMetadata.sellingSystemName || typeof params.clientMetadata.sellingSystemName !== 'string') {
            errors.push('clientMetadata.sellingSystemName is required and must be a string');
        }
        if (!params.clientMetadata.sellingSystemVersion || typeof params.clientMetadata.sellingSystemVersion !== 'string') {
            errors.push('clientMetadata.sellingSystemVersion is required and must be a string');
        }
        if (!params.clientMetadata.sellingMiddlewareName || typeof params.clientMetadata.sellingMiddlewareName !== 'string') {
            errors.push('clientMetadata.sellingMiddlewareName is required and must be a string');
        }
        if (!params.clientMetadata.sellingMiddlewareVersion || typeof params.clientMetadata.sellingMiddlewareVersion !== 'string') {
            errors.push('clientMetadata.sellingMiddlewareVersion is required and must be a string');
        }
    }

    // Validate hotelData
    if (!params.hotelData || typeof params.hotelData !== 'object') {
        errors.push('hotelData is required and must be an object');
    } else {
        if (!params.hotelData.folioNumber || typeof params.hotelData.folioNumber !== 'string') {
            errors.push('hotelData.folioNumber is required and must be a string');
        }
        if (!params.hotelData.expectedDuration || typeof params.hotelData.expectedDuration !== 'string') {
            errors.push('hotelData.expectedDuration is required and must be a string');
        }
        if (!params.hotelData.checkinDate || typeof params.hotelData.checkinDate !== 'string') {
            errors.push('hotelData.checkinDate is required and must be a string');
        }
        if (!params.hotelData.checkoutDate || typeof params.hotelData.checkoutDate !== 'string') {
            errors.push('hotelData.checkoutDate is required and must be a string');
        }
        if (!params.hotelData.roomTax || typeof params.hotelData.roomTax !== 'string') {
            errors.push('hotelData.roomTax is required and must be a string');
        }
    }

    return {
        ok: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
    };
}

export function validateAcknowledgePayload(params: FreedomPayHpcAcknowledgeParams): ValidationResult {
    const errors: string[] = [];

    if (!params.posSyncId || params.posSyncId.trim() === '') {
        errors.push('posSyncId is required');
    }

    if (!params.posSyncAttemptNum || params.posSyncAttemptNum.trim() === '') {
        errors.push('posSyncAttemptNum is required');
    }

    return {
        ok: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
    };
}
