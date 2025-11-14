import type { ValidationResult, Shift4Payload } from '../../../types/index.js';

export const validateShift4Payload = (payload: Shift4Payload): ValidationResult => {
    let returnVal: ValidationResult = { ok: true, errors: [] };

    // Required fields
    if (!payload.customer?.firstName) {
        returnVal.ok = false;
        returnVal.errors?.push('Missing required field: customer.firstName');
    }
    if (!payload.customer?.lastName) {
        returnVal.ok = false;
        returnVal.errors?.push('Missing required field: customer.lastName');
    }

    if (!payload.card?.number) {
        returnVal.ok = false;
        returnVal.errors?.push('Missing required field: card.number');
    }
    if (!payload.card?.expirationDate) {
        returnVal.ok = false;
        returnVal.errors?.push('Missing required field: card.expirationDate');
    }

    // Validate card.number: 13-19 digits
    if (payload.card?.number && !/^\d{13,19}$/.test(payload.card.number)) {
        returnVal.ok = false;
        returnVal.errors?.push('card.number must be 13-19 digits');
    }

    // Validate card.expirationDate: 4 digits MMYY
    if (payload.card?.expirationDate && !/^\d{4}$/.test(payload.card.expirationDate)) {
        returnVal.ok = false;
        returnVal.errors?.push('card.expirationDate must be 4 digits in MMYY format');
    } else if (payload.card?.expirationDate) {
        const month = parseInt(payload.card.expirationDate.slice(0, 2), 10);
        const year = parseInt(payload.card.expirationDate.slice(2, 4), 10);
        const now = new Date();
        const currentYear = now.getFullYear() % 100; // last two digits
        const currentMonth = now.getMonth() + 1;

        if (month < 1 || month > 12) {
            returnVal.ok = false;
            returnVal.errors?.push('card.expirationDate month must be between 01 and 12');
        }
        if (year < currentYear || (year === currentYear && month < currentMonth)) {
            returnVal.ok = false;
            returnVal.errors?.push('card.expirationDate must be current month/year or later');
        }
    }

    return returnVal;
};