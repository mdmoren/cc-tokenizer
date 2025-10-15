export const validateFreedomPayPayload = (cardNumber, expirationMonth, expirationYear, securityCode) => {
    let returnVal = { ok: true, errors: [] };

    // cardNumber: 13-19 digits
    if (!cardNumber || !/^\d{13,19}$/.test(cardNumber)) {
        returnVal.ok = false;
        returnVal.errors.push('cardNumber must be 13-19 digits');
    }

    // expirationMonth: 2 digits, 01-12
    if (!expirationMonth || !/^\d{2}$/.test(expirationMonth)) {
        returnVal.ok = false;
        returnVal.errors.push('expirationMonth must be 2 digits in MM format');
    } else {
        const month = parseInt(expirationMonth, 10);
        if (month < 1 || month > 12) {
            returnVal.ok = false;
            returnVal.errors.push('expirationMonth must be between 01 and 12');
        }
    }

    // expirationYear: 2 digits, current year or later
    if (!expirationYear || !/^\d{2}$/.test(expirationYear)) {
        returnVal.ok = false;
        returnVal.errors.push('expirationYear must be 2 digits in YY format');
    } else {
        const year = parseInt(expirationYear, 10);
        const now = new Date();
        const currentYear = now.getFullYear() % 100; // last two digits
        if (year < currentYear) {
            returnVal.ok = false;
            returnVal.errors.push('expirationYear must be current year or later');
        }
    }

    // securityCode: 3 or 4 digits
    if (!securityCode || !/^\d{3,4}$/.test(securityCode)) {
        returnVal.ok = false;
        returnVal.errors.push('securityCode must be 3 or 4 digits');
    }

    return returnVal;
}