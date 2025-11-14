import type { 
    ValidationResult,
    FreedomPayHpcGetAccessTokenParams,
    FreedomPayHpcGetRsaPublicKeyParams,
    FreedomPayHpcGetPaymentKeyParams,
    FreedomPayHpcPaymentRequestParams,
    FreedomPayHpcTokenizeParams
} from '../../../types/index.js';

export function validateTokenizePayload(params: FreedomPayHpcTokenizeParams): ValidationResult {
    const errors: string[] = [];

    if (!params.cardNumber || params.cardNumber.trim() === '') {
        errors.push('cardNumber is required');
    }

    if (!params.expirationMonth || params.expirationMonth.trim() === '') {
        errors.push('expirationMonth is required');
    }

    if (!params.expirationYear || params.expirationYear.trim() === '') {
        errors.push('expirationYear is required');
    }

    if (!params.securityCode || params.securityCode.trim() === '') {
        errors.push('securityCode is required');
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

export function validatePaymentRequestPayload(params: FreedomPayHpcPaymentRequestParams): ValidationResult {
    const errors: string[] = [];

    if (!params.paymentKey || params.paymentKey.trim() === '') {
        errors.push('paymentKey is required');
    }

    if (params.paymentType !== 1) {
        errors.push('paymentType must be 1 for Card');
    }

    if (!params.storeId || params.storeId.trim() === '') {
        errors.push('storeId is required');
    }

    if (!params.terminalId || params.terminalId.trim() === '') {
        errors.push('terminalId is required');
    }

    if (!params.esKey || params.esKey.trim() === '') {
        errors.push('esKey is required');
    }

    if (!params.trackKsn || params.trackKsn.trim() === '') {
        errors.push('trackKsn is required');
    }

    // merchantReferenceCode is optional

    return {
        ok: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
    };
}
