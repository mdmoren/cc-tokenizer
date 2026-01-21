// Common interfaces and types

export interface TokenizerResponse {
    success: boolean;
    message: string;
    data: Record<string, any>;
    errors: any[];
}

export interface TokenizerConfig {
    enabled: boolean;
}

export interface Shift4Config extends TokenizerConfig {
    accessToken: string;
    companyName: string;
    interfaceName: string;
    interfaceVersion: string;
}

export interface FreedomPayConfig extends TokenizerConfig {
    fpStoreId: string;
    fpTerminalId: string;
    fpEskey: string;
    fpKsn: string;
    fpRsa?: string; // Optional for freewayTokenizeWithTracke method
    fpTokenType: string;
}

export interface FreedomPayHpcConfig extends TokenizerConfig {
    code?: string;           // Required for getRsaPublicKey (server-side)
    key?: string;            // Required for getRsaPublicKey (server-side)
    storeId?: string;        // Required for getAccessToken and paymentRequest (server-side)
    terminalId?: string;     // Required for getAccessToken and paymentRequest (server-side)
    esKey?: string;          // Required for getAccessToken and paymentRequest (server-side)
    accessToken?: string;    // Required for getPaymentKey (client-side safe) - can be obtained via getAccessToken()
    showLogging?: boolean;   // Optional - enables request/response logging for debugging
    fullyMaskCardNumber?: boolean; // Optional - when true, masks all but last 4 digits of card number in response
}

export interface CCTokenizerOptions {
    shift4?: Shift4Config;
    freedomPay?: FreedomPayConfig;
    freedomPayHpc?: FreedomPayHpcConfig;
}

export interface CCTokenizerConstructorOptions {
    environment: string;
    options?: CCTokenizerOptions;
}

// Tokenizer method parameter interfaces

export interface Shift4TokenizeParams {
    firstName: string;
    lastName: string;
    postalCode?: string;
    cardNumber: string;
    expirationDate: string;
}

export interface FreedomPayCardStorParams {
    cardNumber: string;
    expirationMonth: string;
    expirationYear: string;
    securityCode?: string;
}

export interface FreedomPayFreewayParams {
    cardNumber: string;
    expirationMonth: string;
    expirationYear: string;
    securityCode: string;
    firstName: string;
    lastName: string;
    merchantReferenceCode?: string;
}

export interface FreedomPayFreewayWithTrackeParams {
    tracke: string;
    firstName: string;
    lastName: string;
    merchantReferenceCode?: string;
}

// FreedomPay HPC method parameters
export interface FreedomPayHpcGetAccessTokenParams {
    storeId: string;
    terminalId: string;
    esKey: string;
}

export interface FreedomPayHpcGetRsaPublicKeyParams {
    code: string;
    key: string;
}

export interface FreedomPayHpcGetPaymentKeyParams {
    cardData: string; // encrypted card data
    paymentType: number; // 1 for Card
    attributes?: {
        CardIssuer?: string;
        MaskedCardNumber?: string;
        ExpirationDate?: string;
    };
}

export interface FreedomPayHpcPaymentRequestItem {
    productCode: string;
    productName: string;
    productDescription?: string;
    unitPrice: string;
    quantity: string;
    totalAmount: string;
    taxIncludedFlag?: string;
    taxAmount?: string;
    unitOfMeasure?: string;
    saleCode?: string;
}

export interface FreedomPayHpcPaymentRequestParams {
    paymentKey: string;
    paymentType: number;
    storeId: string;
    terminalId: string;
    esKey: string;
    trackKsn: string;
    nameOnCard?: string;
    merchantReferenceCode?: string;
    chargeAmount?: string;
    transType?: string;
    tokenCreateType?: string;
    enableCapture?: boolean;
    invoiceNumber?: string;
    commerceIndicator?: string;
    items?: Array<{
        unitPrice: string;
        quantity: string;
        productName?: string;
        productSKU?: string;
        productCode?: string;
        taxAmount?: string;
    }>;
    posSyncId?: string;
    posSyncAttemptNum?: string;
    clientMetadata: {
        sellingSystemName: string;
        sellingSystemVersion: string;
        sellingMiddlewareName: string;
        sellingMiddlewareVersion: string;
    };
    hotelData?: {
        folioNumber?: string;
        expectedDuration?: string;
        checkinDate?: string;
        checkoutDate?: string;
        roomTax?: string;
    };
}

export interface FreedomPayHpcAcknowledgeParams {
    posSyncId: string;
    posSyncAttemptNum: string;
}

export interface FreedomPayHpcTokenizeParams {
    cardNumber: string;
    expirationMonth: string;
    expirationYear: string;
    securityCode: string;
    nameOnCard: string;
    merchantReferenceCode?: string;
    chargeAmount?: string;
    transType?: string;
    tokenCreateType?: string;
    enableCapture?: boolean;
    invoiceNumber?: string;
    commerceIndicator?: string;
    items?: Array<{
        unitPrice: string;
        quantity: string;
        productName?: string;
        productSKU?: string;
        productCode?: string;
        taxAmount?: string;
    }>;
    posSyncId?: string;
    posSyncAttemptNum?: string;
    clientMetadata: {
        sellingSystemName: string;
        sellingSystemVersion: string;
        sellingMiddlewareName: string;
        sellingMiddlewareVersion: string;
    };
    hotelData?: {
        folioNumber?: string;
        expectedDuration?: string;
        checkinDate?: string;
        checkoutDate?: string;
        roomTax?: string;
    };
}

// Internal interfaces

export interface ValidationResult {
    ok: boolean;
    errors?: any[];
}

export interface Shift4PayloadCard {
    expirationDate: string;
    number: string;
}

export interface Shift4PayloadCustomer {
    firstName: string;
    lastName: string;
    postalCode: string;
}

export interface Shift4Payload {
    dateTime: string;
    card: Shift4PayloadCard;
    customer: Shift4PayloadCustomer;
}

// Abstract interfaces for tokenizers

export interface ITokenizer {
    name: string;
}

export interface IShift4Tokenizer extends ITokenizer {
    tokenize(params: Shift4TokenizeParams): Promise<TokenizerResponse>;
}

export interface IFreedomPayTokenizer extends ITokenizer {
    cardStorTokenize(params: FreedomPayCardStorParams): Promise<TokenizerResponse>;
    freewayTokenize(params: FreedomPayFreewayParams): Promise<TokenizerResponse>;
    freewayTokenizeWithTracke(params: FreedomPayFreewayWithTrackeParams): Promise<TokenizerResponse>;
}

export interface IFreedomPayHpcTokenizer extends ITokenizer {
    tokenize(params: FreedomPayHpcTokenizeParams): Promise<TokenizerResponse>;
    getAccessToken(params: FreedomPayHpcGetAccessTokenParams): Promise<TokenizerResponse>;
    getRsaPublicKey(params: FreedomPayHpcGetRsaPublicKeyParams): Promise<TokenizerResponse>;
    getPaymentKey(params: FreedomPayHpcGetPaymentKeyParams): Promise<TokenizerResponse>;
    paymentRequest(params: FreedomPayHpcPaymentRequestParams): Promise<TokenizerResponse>;
    acknowledge(params: FreedomPayHpcAcknowledgeParams): Promise<TokenizerResponse>;
}

// Encryptor interfaces and types

export interface EncryptorResponse {
    success: boolean;
    message: string;
    data: Record<string, any>;
    errors: any[];
}

export interface EncryptorConfig {
    fpRsa: string;
    showLogging?: boolean;   // Optional - enables request/response logging for debugging
}

export interface FreedomPayEncryptParams {
    cardNumber: string;
    expirationMonth: string;
    expirationYear: string;
    securityCode: string;
}

export interface IEncryptor {
    name: string;
}

export interface IFreedomPayEncryptor extends IEncryptor {
    encrypt(params: FreedomPayEncryptParams): Promise<EncryptorResponse>;
}

// Shift4 API Response types
export interface Shift4ApiResult {
    error?: any;
    [key: string]: any;
}

export interface Shift4ApiResponse {
    result: Shift4ApiResult | Shift4ApiResult[];
}