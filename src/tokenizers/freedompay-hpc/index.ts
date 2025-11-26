import { globalConfig } from '../../lib/config.js';
import { 
    validateTokenizePayload,
    validateGetAccessTokenPayload,
    validateGetRsaPublicKeyPayload, 
    validateGetPaymentKeyPayload,
    validatePaymentRequestPayload,
    validateAcknowledgePayload
} from './helpers/validation.js';
import axios from 'axios';
import CCEncryptor from '../../Encryptors/freedompay/index.js';
import { randomUUID } from 'crypto';
import type { 
    IFreedomPayHpcTokenizer, 
    FreedomPayHpcConfig,
    FreedomPayHpcGetAccessTokenParams,
    FreedomPayHpcGetRsaPublicKeyParams,
    FreedomPayHpcGetPaymentKeyParams,
    FreedomPayHpcPaymentRequestParams,
    FreedomPayHpcTokenizeParams,
    FreedomPayHpcAcknowledgeParams,
    TokenizerResponse
} from '../../types/index.js';

class FreedomPayHpcTokenizer implements IFreedomPayHpcTokenizer {
    public readonly name: string = 'freedomPayHpc';
    private baseUrlEnterpriseServices: string;
    private baseUrlHpc: string;
    private routes: {
        sessionInitialize: string;
        rsaKeys: string;
        paymentKey: string;
        payments: string;
        acknowledge: string;
    };
    private code?: string;
    private key?: string;
    private storeId?: string;
    private terminalId?: string;
    private esKey?: string;
    private accessToken?: string;
    private showLogging: boolean;

    constructor(environment: string, config: FreedomPayHpcConfig) {
        const envConfig = globalConfig.freedomPayHpc[environment as 'production' | 'test'];
        if (!envConfig || !('baseUrlEnterpriseServices' in envConfig)) {
            throw new Error(`Invalid environment: ${environment}`);
        }
        
        this.baseUrlEnterpriseServices = envConfig.baseUrlEnterpriseServices;
        this.baseUrlHpc = envConfig.baseUrlHpc;
        this.routes = globalConfig.freedomPayHpc.common.routes;
        
        // Optional properties - only required for specific methods
        this.code = config.code;
        this.key = config.key;
        this.storeId = config.storeId;
        this.terminalId = config.terminalId;
        this.esKey = config.esKey;
        this.accessToken = config.accessToken;
        this.showLogging = config.showLogging || false;
    }

    /**
     * Complete tokenization workflow in a single method
     * Handles all 5 steps: session init, RSA key retrieval, encryption, payment key, and payment request
     * Returns token information from FreedomPay
     */
    async tokenize(params: FreedomPayHpcTokenizeParams): Promise<TokenizerResponse> {
        let response: TokenizerResponse = {
            success: false,
            message: '',
            data: {},
            errors: []
        };

        try {
            // Validate input parameters
            const schemaValidation = validateTokenizePayload(params);
            if (!schemaValidation.ok) {
                response.message = 'Error: Schema Validation Failed';
                response.errors = schemaValidation.errors || [];
                return response;
            }

            // Validate required credentials for tokenize method
            if (!this.storeId || !this.terminalId || !this.esKey || !this.code || !this.key) {
                response.message = 'Error: tokenize method requires storeId, terminalId, esKey, code, and key in configuration';
                response.errors.push('Missing required credentials for server-side operation');
                return response;
            }

            // Step 1: Get Access Token (Session Initialization)
            const tokenResponse = await this.getAccessToken({
                storeId: this.storeId,
                terminalId: this.terminalId,
                esKey: this.esKey
            });

            if (!tokenResponse.success) {
                response.message = 'Error: Failed to get access token';
                response.errors = tokenResponse.errors;
                return response;
            }

            const accessToken = tokenResponse.data.accessToken;

            // Step 2: Retrieve RSA Public Key
            const rsaResponse = await this.getRsaPublicKey({
                code: this.code!,
                key: this.key!
            });

            if (!rsaResponse.success) {
                response.message = 'Error: Failed to retrieve RSA public key';
                response.errors = rsaResponse.errors;
                return response;
            }

            const publicKey = rsaResponse.data.publicKey;
            const trackKsn = rsaResponse.data.trackKsn; // Get trackKsn from RSA response

            // Step 3: Encrypt card data
            const encryptor = new CCEncryptor(publicKey, this.showLogging);

            const encryptionResponse = await encryptor.encrypt({
                cardNumber: params.cardNumber,
                expirationMonth: params.expirationMonth,
                expirationYear: params.expirationYear,
                securityCode: params.securityCode
            });

            if (!encryptionResponse.success) {
                response.message = 'Error: Failed to encrypt card data';
                response.errors = encryptionResponse.errors;
                return response;
            }

            const encryptedCardData = encryptionResponse.data.trackeVal;

            // Step 4: Get Payment Key
            const paymentKeyResponse = await this.getPaymentKey({
                cardData: encryptedCardData,
                paymentType: 1
            });

            if (!paymentKeyResponse.success) {
                response.message = 'Error: Failed to get payment key';
                response.errors = paymentKeyResponse.errors;
                return response;
            }

            const paymentKey = paymentKeyResponse.data.paymentKeys[0];

            // Step 5: Make Payment Request
            const paymentResponse = await this.paymentRequest({
                paymentKey: paymentKey,
                paymentType: 1,
                storeId: this.storeId!,
                terminalId: this.terminalId!,
                esKey: this.esKey!,
                trackKsn: trackKsn,
                nameOnCard: params.nameOnCard,
                merchantReferenceCode: params.merchantReferenceCode,
                chargeAmount: params.chargeAmount || '0.00',
                transType: params.transType || 'verify',
                tokenCreateType: params.tokenCreateType,
                enableCapture: params.enableCapture,
                invoiceNumber: params.invoiceNumber,
                items: params.items,
                posSyncId: params.posSyncId,
                posSyncAttemptNum: params.posSyncAttemptNum,
                clientMetadata: params.clientMetadata
            });

            if (!paymentResponse.success) {
                response.message = 'Error: Failed to complete payment request';
                response.errors = paymentResponse.errors;
                return response;
            }

            // Return successful tokenization result
            response.success = true;
            response.message = 'Card tokenized successfully';
            response.data = paymentResponse.data;

            return response;
        } catch (error: any) {
            response.message = error.message || 'Internal Error: could not complete tokenization';
            response.errors.push(error.stack || {});
            return response;
        }
    }

    /**
     * Initialize HPC session and retrieve access token (bearer token)
     * This token is required for getPaymentKey and paymentRequest methods
     * The token expires after 1800 seconds (30 minutes)
     * 
     * SERVER-SIDE ONLY: Requires storeId, terminalId, and esKey in configuration
     * 
     * @returns TokenizerResponse with accessToken, expiresIn, tokenType, statusCode
     * Note: trackKsn is NOT returned by this endpoint - use getRsaPublicKey() to get trackKsn
     */
    async getAccessToken(params: FreedomPayHpcGetAccessTokenParams): Promise<TokenizerResponse> {
        let response: TokenizerResponse = {
            success: false,
            message: '',
            data: {},
            errors: []
        };

        try {
            const schemaValidation = validateGetAccessTokenPayload(params);
            if (!schemaValidation.ok) {
                response.message = 'Error: Schema Validation Failed';
                response.errors = schemaValidation.errors || [];
                return response;
            }

            const url = `${this.baseUrlHpc}${this.routes.sessionInitialize}`;
            const headers = {
                'Content-Type': 'application/json'
            };

            const payload = {
                PaymentFlow: 'Mobile',
                Platform: 'Direct',
                PaymentTypes: {
                    Card: {}
                },
                FormValidation: {
                    validationMessageType: 'Feedback'
                },
                RequestMessage: {
                    storeId: params.storeId,
                    terminalId: params.terminalId,
                    esKey: params.esKey
                }
            };

            if (this.showLogging) {
                console.log('\n=== FreedomPayHPC - method: getAccessToken ===');
                console.log('Method: POST');
                console.log('URL:', url);
                console.log('Headers:', JSON.stringify(headers, null, 2));
                console.log('Request Payload:', JSON.stringify(payload, null, 2));
            }

            const apiResponse = await axios.post(url, payload, { headers });

            if (this.showLogging) {
                console.log('Response Status:', apiResponse.status);
                console.log('Response Headers:', JSON.stringify(apiResponse.headers, null, 2));
                console.log('Response Data:', JSON.stringify(apiResponse.data, null, 2));
                console.log('=== End getAccessToken ===\n');
            }

            if (apiResponse.data && apiResponse.data.access_token) {
                // Update the instance's accessToken for subsequent calls
                this.accessToken = apiResponse.data.access_token;

                response.success = true;
                response.message = 'Access token retrieved successfully';
                response.data = {
                    accessToken: apiResponse.data.access_token,
                    expiresIn: apiResponse.data.expires_in,
                    tokenType: apiResponse.data.token_type,
                    statusCode: apiResponse.data.StatusCode
                };
            } else {
                response.message = 'Error: could not retrieve access token';
                response.errors.push('Invalid response from server');
            }

            return response;
        } catch (error: any) {
            response.message = error.message || 'Internal Error: could not retrieve access token';
            response.errors.push(error.response?.data || error.stack || {});
            return response;
        }
    }

    /**
     * Retrieve RSA public key from FreedomPay Enterprise Services
     * This key is used to encrypt card data on the client side
     * 
     * SERVER-SIDE ONLY: Requires code and key in configuration
     * 
     * @returns TokenizerResponse with publicKey, certificate, and trackKsn
     * Note: The trackKsn from this response must be used in the paymentRequest() call
     */
    async getRsaPublicKey(params: FreedomPayHpcGetRsaPublicKeyParams): Promise<TokenizerResponse> {
        let response: TokenizerResponse = {
            success: false,
            message: '',
            data: {},
            errors: []
        };

        try {
            const schemaValidation = validateGetRsaPublicKeyPayload(params);
            if (!schemaValidation.ok) {
                response.message = 'Error: Schema Validation Failed';
                response.errors = schemaValidation.errors || [];
                return response;
            }

            const url = `${this.baseUrlEnterpriseServices}${this.routes.rsaKeys}?code=${params.code}&key=${params.key}`;
            
            if (this.showLogging) {
                console.log('\n=== FreedomPayHPC - method: getRsaPublicKey ===');
                console.log('Method: GET');
                console.log('URL:', url);
            }

            const apiResponse = await axios.get(url);

            if (this.showLogging) {
                console.log('Response Status:', apiResponse.status);
                console.log('Response Headers:', JSON.stringify(apiResponse.headers, null, 2));
                console.log('Response Data:', JSON.stringify(apiResponse.data, null, 2));
                console.log('=== End getRsaPublicKey ===\n');
            }

            if (apiResponse.data && apiResponse.data.publicKey) {
                response.success = true;
                response.message = 'RSA public key retrieved successfully';
                response.data = {
                    publicKey: apiResponse.data.publicKey,
                    certificate: apiResponse.data.certificate,
                    trackKsn: apiResponse.data.trackKsn
                };
            } else {
                response.message = 'Error: could not retrieve RSA public key';
                response.errors.push('Invalid response from server');
            }

            return response;
        } catch (error: any) {
            response.message = error.message || 'Internal Error: could not retrieve RSA public key';
            response.errors.push(error.response?.data || error.stack || {});
            return response;
        }
    }

    /**
     * Retrieve payment key by sending encrypted card data to HPC
     * The payment key is then used to make a payment request
     * 
     * CLIENT-SIDE SAFE: Only requires accessToken (bearer token)
     * Initialize tokenizer with just { accessToken: 'your-token' } for client-side use
     */
    async getPaymentKey(params: FreedomPayHpcGetPaymentKeyParams): Promise<TokenizerResponse> {
        let response: TokenizerResponse = {
            success: false,
            message: '',
            data: {},
            errors: []
        };

        try {
            const schemaValidation = validateGetPaymentKeyPayload(params);
            if (!schemaValidation.ok) {
                response.message = 'Error: Schema Validation Failed';
                response.errors = schemaValidation.errors || [];
                return response;
            }

            // Only require accessToken for this client-side safe method
            if (!this.accessToken) {
                response.message = 'Error: accessToken is required for getPaymentKey method';
                response.errors.push('accessToken configuration is missing. For client-side use, initialize with { accessToken: "your-bearer-token" }');
                return response;
            }

            const url = `${this.baseUrlHpc}${this.routes.paymentKey}`;
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.accessToken}`
            };

            const payload = {
                cardData: params.cardData,
                paymentType: params.paymentType,
                attributes: params.attributes || {}
            };

            if (this.showLogging) {
                console.log('\n=== FreedomPayHPC - method: getPaymentKey ===');
                console.log('Method: POST');
                console.log('URL:', url);
                console.log('Headers:', JSON.stringify(headers, null, 2));
                console.log('Request Payload:', JSON.stringify(payload, null, 2));
            }

            const apiResponse = await axios.post(url, payload, { headers });

            if (this.showLogging) {
                console.log('Response Status:', apiResponse.status);
                console.log('Response Headers:', JSON.stringify(apiResponse.headers, null, 2));
                console.log('Response Data:', JSON.stringify(apiResponse.data, null, 2));
                console.log('=== End getPaymentKey ===\n');
            }

            if (apiResponse.data && apiResponse.data.PaymentKeys && apiResponse.data.PaymentKeys.length > 0) {
                response.success = true;
                response.message = 'Payment key retrieved successfully';
                response.data = {
                    paymentType: apiResponse.data.PaymentType,
                    paymentKeys: apiResponse.data.PaymentKeys,
                    attributes: apiResponse.data.Attributes
                };
            } else {
                response.message = 'Error: could not retrieve payment key';
                response.errors.push('Invalid response from server');
            }

            return response;
        } catch (error: any) {
            response.message = error.message || 'Internal Error: could not retrieve payment key';
            response.errors.push(error.response?.data || error.stack || {});
            return response;
        }
    }

    /**
     * Make a payment request to HPC with the payment key
     * For tokenization, use a zero amount (0.00)
     * Returns token information from FreedomPay Freeway
     * 
     * SERVER-SIDE ONLY: Requires accessToken, storeId, terminalId, and esKey
     */
    async paymentRequest(params: FreedomPayHpcPaymentRequestParams): Promise<TokenizerResponse> {
        let response: TokenizerResponse = {
            success: false,
            message: '',
            data: {},
            errors: []
        };

        try {
            const schemaValidation = validatePaymentRequestPayload(params);
            if (!schemaValidation.ok) {
                response.message = 'Error: Schema Validation Failed';
                response.errors = schemaValidation.errors || [];
                return response;
            }

            if (!this.accessToken) {
                response.message = 'Error: accessToken is required for paymentRequest method';
                response.errors.push('accessToken configuration is missing');
                return response;
            }

            const url = `${this.baseUrlHpc}${this.routes.payments}`;
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.accessToken}`
            };

            // Build the request payload
            const payload: any = {
                PaymentKey: params.paymentKey,
                PaymentType: params.paymentType,
                PosSyncId: params.posSyncId || `${new Date().toISOString()};${Date.now()};${Date.now()};${randomUUID()}`,
                posSyncAttemptNum: params.posSyncAttemptNum || "1",
                RequestMessage: {
                    Industrydatatype: 'hotel',
                    cofIndicator: 'S',
                    storeId: params.storeId,
                    terminalId: params.terminalId,
                    esKey: params.esKey,
                    pos: {
                        trackKsn: params.trackKsn
                    },
                    ccAuthService: {
                        run: "true",
                        commerceIndicator: "internet"
                        // transType: params.transType || "verify" // "verify" for tokenization, "purchase" for payment
                    },
                    clientMetadata: params.clientMetadata,
                    hotelData: {
                        folioNumber: "",
                        expectedDuration: "",
                        checkinDate: "",
                        checkoutDate: "",
                        roomTax: "0.00"
                    },
                    tokenCreateService: {
                        run: "true",
                        ...(params.tokenCreateType && { type: params.tokenCreateType })
                    },
                    merchantReferenceCode: params.merchantReferenceCode || "",
                    purchaseTotals: {
                        chargeAmount: params.chargeAmount || "0.00"
                    }
                }
            };

            // Add ccCaptureService if explicitly enabled (not needed for tokenization)
            if (params.enableCapture) {
                payload.RequestMessage.ccCaptureService = {
                    run: "true"
                };
                // Also set commerceIndicator for capture
                payload.RequestMessage.ccAuthService.commerceIndicator = "internet";
            }

            // Add optional fields
            if (params.nameOnCard) {
                payload.RequestMessage.card = {
                    nameOnCard: params.nameOnCard
                };
            }

            if (params.invoiceNumber) {
                payload.RequestMessage.invoiceHeader = {
                    invoiceNumber: params.invoiceNumber
                };
            }

            if (params.items && params.items.length > 0) {
                payload.RequestMessage.items = params.items;
            }

            if (this.showLogging) {
                console.log('\n=== FreedomPayHPC - method: paymentRequest ===');
                console.log('Method: POST');
                console.log('URL:', url);
                console.log('Headers:', JSON.stringify(headers, null, 2));
                console.log('Request Payload:', JSON.stringify(payload, null, 2));
            }

            const apiResponse = await axios.post(url, payload, { headers });

            if (this.showLogging) {
                console.log('Response Status:', apiResponse.status);
                console.log('Response Headers:', JSON.stringify(apiResponse.headers, null, 2));
                console.log('Response Data:', JSON.stringify(apiResponse.data, null, 2));
                console.log('=== End paymentRequest ===\n');
            }

            if (apiResponse.data && apiResponse.data.FreewayResponse) {
                const freewayResponse = apiResponse.data.FreewayResponse;
                
                // Check if the transaction was successful
                // reasonCode can be string "100" or number 100
                const reasonCode = String(freewayResponse.reasonCode);
                const isSuccess = reasonCode === "100" || freewayResponse.decision === "ACCEPT";

                if (isSuccess) {
                    // Acknowledge the transaction
                    const acknowledgeResponse = await this.acknowledge({
                        posSyncId: payload.PosSyncId,
                        posSyncAttemptNum: payload.posSyncAttemptNum
                    });

                    if (!acknowledgeResponse.success) {
                        response.message = 'Warning: Payment successful but acknowledgement failed';
                        response.errors.push(acknowledgeResponse.errors);
                    }

                    response.success = true;
                    response.message = 'Payment request successful - token created';
                    response.data = {
                        decision: freewayResponse.decision,
                        reasonCode: freewayResponse.reasonCode,
                        requestID: freewayResponse.requestID,
                        merchantReferenceCode: freewayResponse.merchantReferenceCode,
                        tokenInformation: freewayResponse.tokenInformation || {},
                        ccAuthReply: freewayResponse.ccAuthReply,
                        tokenCreateReply: freewayResponse.tokenCreateReply,
                        acknowledged: acknowledgeResponse.success,
                        acknowledgeData: acknowledgeResponse.data
                    };
                } else {
                    response.message = 'Error: payment request failed';
                    response.errors.push(freewayResponse);
                }
            } else {
                response.message = 'Error: could not complete payment request';
                response.errors.push('Invalid response from server');
            }

            return response;
        } catch (error: any) {
            response.message = error.message || 'Internal Error: could not complete payment request';
            response.errors.push(error.response?.data || error.stack || {});
            return response;
        }
    }

    /**
     * Acknowledge a payment transaction
     * This method confirms receipt of the payment response and should be called
     * after a successful paymentRequest to complete the transaction workflow
     * 
     * SERVER-SIDE ONLY: Requires accessToken (bearer token)
     * 
     * @returns TokenizerResponse with acknowledgement status and data
     */
    async acknowledge(params: FreedomPayHpcAcknowledgeParams): Promise<TokenizerResponse> {
        let response: TokenizerResponse = {
            success: false,
            message: '',
            data: {},
            errors: []
        };

        try {
            const schemaValidation = validateAcknowledgePayload(params);
            if (!schemaValidation.ok) {
                response.message = 'Error: Schema Validation Failed';
                response.errors = schemaValidation.errors || [];
                return response;
            }

            if (!this.accessToken) {
                response.message = 'Error: accessToken is required for acknowledge method';
                response.errors.push('accessToken configuration is missing');
                return response;
            }

            const url = `${this.baseUrlHpc}${this.routes.acknowledge}`;
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.accessToken}`
            };

            const payload = {
                PosSyncId: params.posSyncId,
                PosSyncAttemptNum: params.posSyncAttemptNum
            };

            if (this.showLogging) {
                console.log('\n=== FreedomPayHPC - method: acknowledge ===');
                console.log('Method: POST');
                console.log('URL:', url);
                console.log('Headers:', JSON.stringify(headers, null, 2));
                console.log('Request Payload:', JSON.stringify(payload, null, 2));
            }

            const apiResponse = await axios.post(url, payload, { headers });

            if (this.showLogging) {
                console.log('Response Status:', apiResponse.status);
                console.log('Response Headers:', JSON.stringify(apiResponse.headers, null, 2));
                console.log('=== End acknowledge ===\n');
            }

            if (apiResponse.status === 204) {
                response.success = true;
                response.message = 'Transaction acknowledged successfully';
                response.data = apiResponse.data || { status: 'acknowledged' };
            } else {
                response.message = 'Error: could not acknowledge transaction';
                response.errors.push(apiResponse.data || 'Invalid response from server');
            }

            return response;
        } catch (error: any) {
            response.message = error.message || 'Internal Error: could not acknowledge transaction';
            response.errors.push(error.response?.data || error.stack || {});
            return response;
        }
    }
}

export default FreedomPayHpcTokenizer;
