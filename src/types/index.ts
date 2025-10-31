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
    fpRsa: string;
    fpTokenType: string;
}

export interface CCTokenizerOptions {
    shift4?: Shift4Config;
    freedomPay?: FreedomPayConfig;
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
}

// Shift4 API Response types
export interface Shift4ApiResult {
    error?: any;
    [key: string]: any;
}

export interface Shift4ApiResponse {
    result: Shift4ApiResult | Shift4ApiResult[];
}