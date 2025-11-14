import type { ValidationResult } from '../../../types/index.js';

export const validateCardStorPayload = (
    cardNumber: string, 
    expirationMonth: string, 
    expirationYear: string, 
    securityCode?: string
): ValidationResult => {
    let returnVal: ValidationResult = { ok: true, errors: [] };

    // cardNumber: 13-19 digits
    if (!cardNumber || !/^\d{13,19}$/.test(cardNumber)) {
        returnVal.ok = false;
        returnVal.errors?.push('cardNumber must be 13-19 digits');
    }

    // expirationMonth: 2 digits, 01-12
    if (!expirationMonth || !/^\d{2}$/.test(expirationMonth)) {
        returnVal.ok = false;
        returnVal.errors?.push('expirationMonth must be 2 digits in MM format');
    } else {
        const month = parseInt(expirationMonth, 10);
        if (month < 1 || month > 12) {
            returnVal.ok = false;
            returnVal.errors?.push('expirationMonth must be between 01 and 12');
        }
    }

    // expirationYear: 2 digits, current year or later
    if (!expirationYear || !/^\d{2}$/.test(expirationYear)) {
        returnVal.ok = false;
        returnVal.errors?.push('expirationYear must be 2 digits in YY format');
    } else {
        const year = parseInt(expirationYear, 10);
        const now = new Date();
        const currentYear = now.getFullYear() % 100; // last two digits
        if (year < currentYear) {
            returnVal.ok = false;
            returnVal.errors?.push('expirationYear must be current year or later');
        }
    }

    // securityCode: 3 or 4 digits (optional)
    if (securityCode && !/^\d{3,4}$/.test(securityCode)) {
        returnVal.ok = false;
        returnVal.errors?.push('securityCode must be 3 or 4 digits');
    }

    return returnVal;
};

export const validateFreeWayPayload = (
    cardNumber: string, 
    expirationMonth: string, 
    expirationYear: string, 
    securityCode?: string, 
    firstName?: string, 
    lastName?: string, 
    merchantReferenceCode: string | null = null
): ValidationResult => {
    let returnVal: ValidationResult = { ok: true, errors: [] };

    // cardNumber: 13-19 digits
    if (!cardNumber || !/^\d{13,19}$/.test(cardNumber)) {
        returnVal.ok = false;
        returnVal.errors?.push('cardNumber must be 13-19 digits');
    }

    // expirationMonth: 2 digits, 01-12
    if (!expirationMonth || !/^\d{2}$/.test(expirationMonth)) {
        returnVal.ok = false;
        returnVal.errors?.push('expirationMonth must be 2 digits in MM format');
    } else {
        const month = parseInt(expirationMonth, 10);
        if (month < 1 || month > 12) {
            returnVal.ok = false;
            returnVal.errors?.push('expirationMonth must be between 01 and 12');
        }
    }

    // expirationYear: 2 digits, current year or later
    if (!expirationYear || !/^\d{2}$/.test(expirationYear)) {
        returnVal.ok = false;
        returnVal.errors?.push('expirationYear must be 2 digits in YY format');
    } else {
        const year = parseInt(expirationYear, 10);
        const now = new Date();
        const currentYear = now.getFullYear() % 100; // last two digits
        if (year < currentYear) {
            returnVal.ok = false;
            returnVal.errors?.push('expirationYear must be current year or later');
        }
    }

    // securityCode: 3 or 4 digits (optional)
    if (securityCode && !/^\d{3,4}$/.test(securityCode)) {
        returnVal.ok = false;
        returnVal.errors?.push('securityCode must be 3 or 4 digits');
    }

    // firstName: required, not empty (optional parameter)
    if (firstName !== undefined && (!firstName || firstName.trim() === '')) {
        returnVal.ok = false;
        returnVal.errors?.push('firstName is required and cannot be empty');
    }

    // lastName: required, not empty (optional parameter)
    if (lastName !== undefined && (!lastName || lastName.trim() === '')) {
        returnVal.ok = false;
        returnVal.errors?.push('lastName is required and cannot be empty');
    }

    return returnVal;
};

export const validateFreeWayWithTrackePayload = (
    tracke: string,
    firstName: string, 
    lastName: string, 
    merchantReferenceCode?: string
): ValidationResult => {
    let returnVal: ValidationResult = { ok: true, errors: [] };

    // tracke: required, base64 string (should be non-empty)
    if (!tracke || tracke.trim() === '') {
        returnVal.ok = false;
        returnVal.errors?.push('tracke is required and cannot be empty');
    }

    // firstName: required, not empty
    if (!firstName || firstName.trim() === '') {
        returnVal.ok = false;
        returnVal.errors?.push('firstName is required and cannot be empty');
    }

    // lastName: required, not empty
    if (!lastName || lastName.trim() === '') {
        returnVal.ok = false;
        returnVal.errors?.push('lastName is required and cannot be empty');
    }

    // merchantReferenceCode: optional, but if provided, should not be empty
    if (merchantReferenceCode !== undefined && merchantReferenceCode.trim() === '') {
        returnVal.ok = false;
        returnVal.errors?.push('merchantReferenceCode cannot be empty if provided');
    }

    return returnVal;
};