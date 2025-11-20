# cc-tokenizer

A unified interface for tokenizing credit cards using Shift4 and FreedomPay, with client-side encryption capabilities.

## 🎉 Now with Full TypeScript Support!

This package is now written in TypeScript and includes comprehensive type definitions for better development experience and type safety.

---

## Features

- **TypeScript Support**: Full type definitions and IntelliSense support
- **Shift4 Tokenizer**: Tokenize cards with Shift4 Universal Token service using secure credentials.
- **FreedomPay Tokenizers**:
  - CardStor: SOAP-based tokenization via FreedomPay CardStore service.
  - Freeway: SOAP-based tokenization via FreedomPay Freeway service.
  - **HPC Mobile Direct**: Client-side tokenization using FreedomPay HPC for mobile applications.
- **FreedomPay Encryptor**: Client-side encryption for secure server-to-server tokenization.
- Consistent response format for all providers.
- **Possibly more tokenizers in the future!**

---

## Installation

```bash
npm install cc-tokenizer
```

---

## TypeScript Support

This package now includes full TypeScript support with comprehensive type definitions. See [TYPESCRIPT.md](./TYPESCRIPT.md) for detailed TypeScript usage examples and available types.

---

## Usage (JavaScript/TypeScript)

```ts
import { CCTokenizer } from 'cc-tokenizer';

const myTokenizer = new CCTokenizer({
  environment: 'test', // or 'production'
  options: {
    // ask your Shift4 rep to get these values
    shift4: {
      enabled: true,
      accessToken: 'shift4-access-token',
      companyName: 'company-name',
      interfaceName: 'interface-name',
      interfaceVersion: 'interface-version',
    },
    // ask your FreedomPay rep to get these values
    freedomPay: {
      enabled: true,
      fpStoreId: 'store-id',
      fpTerminalId: 'terminal-id',
      fpEskey: 'eskey',              // CardStor only
      fpKsn: 'key-serial-number',
      fpRsa: 'rsa-public-key',       // Required for freewayTokenize, optional for freewayTokenizeWithTracke
      fpTokenType: 'token-type'
    },
    // ask your FreedomPay rep to get these values for HPC Mobile Direct
    freedomPayHpc: {
      enabled: true,
      code: 'your-code',
      key: 'your-key',
      storeId: 'your-store-id',
      terminalId: 'your-terminal-id',
      esKey: 'your-eskey'
      // accessToken: 'optional-if-you-already-have-one'  // Can be obtained via getAccessToken()
    },
  }
});
```

---

## Client-Side Encryption (CCEncryptor)

For scenarios where FreedomPay requires server-to-server tokenization, you can use the `CCEncryptor` class to encrypt sensitive card data on the client side before sending it to your server.

```ts
import { CCEncryptor } from 'cc-tokenizer';

const encryptor = new CCEncryptor({
  freedomPay: {
    fpRsa: 'your-rsa-public-key' // RSA public key from FreedomPay
  }
});

const freedomPayEncryptor = encryptor.freedomPay();

const encryptedData = await freedomPayEncryptor.encrypt({
  cardNumber: '1111222233334444',
  expirationMonth: '10', // MM format
  expirationYear: '26',  // YY format
  securityCode: '123'
});

console.log('Encrypted data:', JSON.stringify(encryptedData, null, 2));
```

#### Example Encryption Response

```json
{
  "success": true,
  "message": "Card data successfully encrypted",
  "data": {
    "trackeVal": "abcdefghijklmnop1234567890..."
  },
  "errors": []
}
```

The encrypted `trackeVal` can then be safely transmitted to your server for FreedomPay tokenization.

---

## Complete Client-to-Server Workflow

For maximum security, you can combine client-side encryption with server-side tokenization:

### 1. Client-Side (Browser/Frontend)

```ts
import { CCEncryptor } from 'cc-tokenizer';

// Encrypt card data on client-side
const encryptor = new CCEncryptor({
  freedomPay: { fpRsa: 'your-rsa-public-key' }
});

const freedomPayEncryptor = encryptor.freedomPay();
const encryptResult = await freedomPayEncryptor.encrypt({
  cardNumber: '1111222233334444',
  expirationMonth: '10',
  expirationYear: '26',
  securityCode: '123'
});

// Send encrypted trackeVal to your server
const { trackeVal } = encryptResult.data;
```

### 2. Server-Side (Backend)

```ts
import { CCTokenizer } from 'cc-tokenizer';

// Tokenize using pre-encrypted data
const tokenizer = new CCTokenizer({
  environment: 'production',
  options: {
    freedomPay: {
      enabled: true,
      fpStoreId: 'store-id',
      fpTerminalId: 'terminal-id',
      fpEskey: 'eskey',
      fpKsn: 'ksn',
      // fpRsa: NOT REQUIRED for freewayTokenizeWithTracke
      fpTokenType: 'token-type'
    }
  }
});

const freedomPay = tokenizer.freedomPay();
const tokenResult = await freedomPay.freewayTokenizeWithTracke({
  tracke: trackeVal, // From client-side encryption
  firstName: 'Joe',
  lastName: 'Schmoe',
  merchantReferenceCode: 'ORDER_12345'
});
```

**Benefits:**
- ✅ No raw card data on your server
- ✅ Reduced PCI compliance scope
- ✅ Enhanced security
- ✅ Same tokenization result

---

## Available Tokenizers

### Shift4

```ts
const shift4 = myTokenizer.shift4();

const shift4tokenize = await shift4.tokenize({
  firstName: 'Joe',
  lastName: 'Schmoe',
  postalCode: '12345',
  cardNumber: '1111222233334444',
  expirationDate: '1026' // MMYY format
});

console.log('[TEST] shift4 tokenizer method:', JSON.stringify(shift4tokenize, null, 2));
```

#### Example Success Response

```json
{
  "success": true,
  "message": "Card tokenized successfully using Shift4",
  "data": [
    {
      "dateTime": "2025-10-15T16:02:16.000-07:00",
      "receiptColumns": 30,
      "card": {
        "type": "VS",
        "number": "XXXXXXXXXXXXX4444",
        "token": {
          "value": "4444sampl3t0k3n"
        }
      },
      "customer": {
        "firstName": "Joe",
        "lastName": "Schmoe",
        "postalCode": "12345"
      },
      "merchant": {
        "mid": 0
      },
      "server": {
        "name": "Shift4 Tokenization Server"
      },
      "universalToken": {
        "value": "111100-0000000--000000-00000000-00000000000"
      }
    }
  ],
  "errors": []
}
```

---

### FreedomPay

Retrieve the FreedomPay tokenizer:

```ts
const freedomPay = myTokenizer.freedomPay();
```

You can tokenize using either CardStor or Freeway.

#### CardStor

```ts
const cardStorResult = await freedomPay.cardStorTokenize({
  cardNumber: '1111222233334444',
  expirationMonth: '10', // MM format
  expirationYear: '26',  // YY format
  securityCode: '123'
});

console.log('[TEST] FreedomPay CardStor:', JSON.stringify(cardStorResult, null, 2));
```

#### Freeway

```ts
const freewayResult = await freedomPay.freewayTokenize({
  cardNumber: '1111222233334444',
  expirationMonth: '10', // MM format
  expirationYear: '26',  // YY format
  securityCode: '123',
  firstName: 'Joe',
  lastName: 'Schmoe',
  merchantReferenceCode: 'your-internal-ref-123' // optional
});

console.log('[TEST] FreedomPay Freeway:', JSON.stringify(freewayResult, null, 2));
```

#### Freeway with Pre-Encrypted Data (Server-Side)

For enhanced security when you need to separate client-side encryption from server-side tokenization:

```ts
// Use this on your server after receiving encrypted tracke from client
const freewayWithTrackeResult = await freedomPay.freewayTokenizeWithTracke({
  tracke: 'encrypted_data_from_client_side', // From CCEncryptor
  firstName: 'Joe',
  lastName: 'Schmoe',
  merchantReferenceCode: 'your-internal-ref-123' // optional
});

console.log('[TEST] FreedomPay Freeway with Tracke:', JSON.stringify(freewayWithTrackeResult, null, 2));
```

#### Example Success Response (CardStor/Freeway)

```json
{
  "success": true,
  "message": "Card tokenized successfully using FreedomPay CardStor",
  "data": {
    "requestId": "ABCD1234EFGH5678IJKL9012MNOP3456",
    "decision": "ACCEPT",
    "reasonCode": 100,
    "tokenInformation": {
      "accountNumberMasked": "111122XXXXXX4444",
      "token": 0,
      "cardExpirationMonth": 10,
      "cardExpirationYear": 26,
      "tokenExpiration": "2027-10-15T00:00:00.0000000Z",
      "brand": "VS"
    }
  },
  "errors": []
}
```

Notes:
- The message will reference CardStor or Freeway depending on the method used.
- Data shape may vary slightly based on FreedomPay response.

---

### FreedomPay HPC

The HPC tokenizer is designed for mobile applications that need to tokenize cards directly from the client side using FreedomPay's Mobile Direct integration.

#### Simple One-Method Tokenization

The easiest way to tokenize a card is using the `tokenize()` method which handles all steps internally:

```ts
const hpcTokenizer = myTokenizer.freedomPayHpc();

const response = await hpcTokenizer.tokenize({
  cardNumber: '4321000000005678',
  expirationMonth: '12',
  expirationYear: '26',
  securityCode: '123',
  nameOnCard: 'John Doe',
  merchantReferenceCode: 'order-123', // Optional
  chargeAmount: '0.00', // Zero amount for tokenization
  transType: 'verify', // Use "verify" for tokenization (default)
  tokenCreateType: '6', // FreedomPay default token type (optional)
  clientMetadata: { // Optional
    sellingSystemName: 'MyApp',
    sellingSystemVersion: '1.0.0'
  }
});

if (response.success) {
  console.log('Token:', response.data.tokenInformation.token);
  console.log('Masked Card:', response.data.tokenInformation.accountNumberMasked);
}
```

#### Step-by-Step Workflow (Advanced)

For more control or debugging, you can use individual methods for each step:

The HPC tokenization process involves five steps:

1. **Get Access Token**: Initialize HPC session and retrieve bearer token (expires in 30 minutes)
2. **Get RSA Public Key**: Retrieve the RSA public key from FreedomPay Enterprise Services
3. **Encrypt Card Data**: Encrypt card data using the RSA public key
4. **Get Payment Key**: Exchange encrypted card data for a payment key
5. **Payment Request**: Use the payment key to create a token (zero-dollar authorization)

```ts
const hpcTokenizer = myTokenizer.freedomPayHpc();

// Step 1: Get Access Token (Session Initialization)
const tokenResponse = await hpcTokenizer.getAccessToken({
  storeId: 'your-store-id',
  terminalId: 'your-terminal-id',
  esKey: 'your-eskey'
});

const { accessToken, trackKsn: sessionTrackKsn } = tokenResponse.data;

// Step 2: Get RSA Public Key
const rsaResponse = await hpcTokenizer.getRsaPublicKey({
  code: 'your-code',
  key: 'your-key'
});

const { publicKey, trackKsn } = rsaResponse.data;

// Step 3: Encrypt card data using CCEncryptor
const encryptor = new CCEncryptor({
  freedomPay: { fpRsa: publicKey }
});

const freedomPayEncryptor = encryptor.freedomPay();
const encryptionResponse = await freedomPayEncryptor.encrypt({
  cardNumber: '4321000000005678',
  expirationMonth: '12',
  expirationYear: '26',
  securityCode: '123'
});

const encryptedCardData = encryptionResponse.data.trackeVal;

// Step 4: Get Payment Key
const paymentKeyResponse = await hpcTokenizer.getPaymentKey({
  cardData: encryptedCardData,
  paymentType: 1, // 1 = Card
  attributes: { // Optional
    CardIssuer: 'Visa',
    MaskedCardNumber: '432100xxxxxx5678',
    ExpirationDate: '12/26'
  }
});

const paymentKey = paymentKeyResponse.data.paymentKeys[0];

// Step 5: Make Payment Request
const paymentResponse = await hpcTokenizer.paymentRequest({
  paymentKey: paymentKey,
  paymentType: 1,
  storeId: 'your-store-id',
  terminalId: 'your-terminal-id',
  esKey: 'your-eskey',
  trackKsn: trackKsn,
  nameOnCard: 'John Doe',
  merchantReferenceCode: '', // Optional
  chargeAmount: '0.00', // Zero amount for tokenization
  transType: 'verify', // Use "verify" for tokenization
  tokenCreateType: '6' // FreedomPay default token type
});

console.log('Token:', paymentResponse.data.tokenInformation.token);
```

#### Example Success Response (Payment Request)

```json
{
  "success": true,
  "message": "Payment request successful - token created",
  "data": {
    "decision": "ACCEPT",
    "reasonCode": "100",
    "requestID": "1234567890",
    "merchantReferenceCode": "1234567890",
    "tokenInformation": {
      "token": "1234567890",
      "accountNumberMasked": "432100xxxxxx5678",
      "cardExpirationMonth": "12",
      "cardExpirationYear": "26",
      "brand": "VS",
      "tokenExpiration": "2029-11-11T00:00:00.0000000Z"
    },
    "ccAuthReply": {
      "authorizationCode": "348044",
      "authorizedDateTime": "2025-11-11T13:55:08.1896324Z",
      "amount": "0.00",
      "processorResponseCode": "100",
      "processorResponseMessage": "APPROVED"
    }
  },
  "errors": []
}
```

**Benefits of HPC Mobile Direct:**
- ✅ **Simple one-method tokenization** with `tokenize()` for quick integration
- ✅ Step-by-step methods available for advanced workflows
- ✅ Client-side tokenization for mobile apps
- ✅ No PCI data touches your servers
- ✅ Direct communication with FreedomPay
- ✅ Secure RSA encryption
- ✅ Session-based access tokens (30-minute expiration)

**Important Notes:**
- The access token expires after 1800 seconds (30 minutes)
- For simple integration, use `tokenize()` method which handles all steps automatically
- For advanced workflows, use individual methods (getAccessToken, getRsaPublicKey, etc.)
- Use `transType: "verify"` for tokenization without charging (default)
- Use `tokenCreateType: "6"` for FreedomPay's default token type
- Alternatively, you can provide a pre-existing `accessToken` in the config

---

## Error Handling

Both tokenizers return a consistent error format:

```json
{
  "success": false,
  "message": "Error: could not tokenize card using <Provider>",
  "data": {},
  "errors": [
    "Detailed error message or validation errors"
  ]
}
```

---

## TypeScript Notes

- Package can be consumed in TypeScript projects. Typical usage:

```ts
import { CCTokenizer, CCEncryptor } from 'cc-tokenizer';
```

- Suggested interface shapes for payloads:

```ts
interface Shift4TokenizeArgs {
  firstName: string;
  lastName: string;
  postalCode: string;
  cardNumber: string;
  expirationDate: string; // MMYY
}

interface FreedomPayCardStorArgs {
  cardNumber: string;
  expirationMonth: string; // MM
  expirationYear: string;  // YY
  securityCode: string;
}

interface FreedomPayFreeWayArgs extends FreedomPayCardStorArgs {
  firstName: string;
  lastName: string;
  merchantReferenceCode?: string | null;
}

interface FreedomPayFreewayWithTrackeArgs {
  tracke: string;
  firstName: string;
  lastName: string;
  merchantReferenceCode?: string | null;
}

interface FreedomPayEncryptParams {
  cardNumber: string;
  expirationMonth: string; // MM
  expirationYear: string;  // YY
  securityCode: string;
}

interface TokenizeResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  errors: unknown[];
}

interface EncryptorResponse {
  success: boolean;
  message: string;
  data: {
    trackeVal: string;
  };
  errors: unknown[];
}
```

---

## What's New in Version 1.4.1

### Automatic Transaction Acknowledgement

Starting in version 1.4.1, FreedomPay HPC transactions are automatically acknowledged after successful payment requests. The `acknowledge` method is now called internally within `paymentRequest()` to complete the transaction workflow according to FreedomPay's requirements.

**Key Points:**
- ✅ No code changes required when upgrading from 1.4.0
- ✅ Automatic acknowledgement for successful transactions
- ✅ Acknowledgement status included in response data
- ✅ Backward compatible with existing implementations

**Response Enhancement:**
```ts
const paymentResponse = await hpcTokenizer.paymentRequest({...});

console.log(paymentResponse.data);
// Now includes:
// {
//   decision: "ACCEPT",
//   reasonCode: "100",
//   tokenInformation: {...},
//   acknowledged: true,           // ← New acknowledgement status
//   acknowledgeData: {...}        // ← New acknowledgement response
// }
```

The `acknowledge()` method is also available as a standalone method if you need to manually acknowledge a transaction for edge cases or retry scenarios.

### Optional Request/Response Logging

Version 1.4.1 introduces optional debugging logs for both FreedomPay HPC and FreedomPay Encryptor.

**Enable logging for FreedomPay HPC:**
```ts
const tokenizer = new CCTokenizer({
  environment: 'test',
  options: {
    freedomPayHpc: {
      enabled: true,
      storeId: 'your-store-id',
      terminalId: 'your-terminal-id',
      esKey: 'your-eskey',
      code: 'your-code',
      key: 'your-key',
      showLogging: true  // ← Enable detailed logging
    }
  }
});
```

**Enable logging for FreedomPay Encryptor:**
```ts
const encryptor = new CCEncryptor({
  freedomPay: {
    fpRsa: 'your-rsa-public-key',
    showLogging: true  // ← Enable encryption logging
  }
});
```

**What gets logged:**
- HTTP method (GET/POST)
- Full request URL
- Request headers (with masked bearer tokens)
- Request payload
- Response status
- Response headers
- Response data

**Example log output:**
```
=== FreedomPayHPC - method: paymentRequest ===
Method: POST
URL: https://hpc.uat.freedompay.com/api/v2.0/payments
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbG..."
}
Request Payload: {
  "PaymentKey": "...",
  "PaymentType": 1,
  ...
}
Response Status: 200
Response Data: {
  "FreewayResponse": {...}
}
=== End paymentRequest ===
```

**Use Cases:**
- 🔍 Debugging integration issues
- 📝 Understanding API request/response flow
- 🐛 Troubleshooting failed transactions
- 📊 Monitoring API behavior

**Important:** Only enable logging in development/testing environments. Never log sensitive data in production.

---

## Notes

- Obtain credentials and configuration values from your Shift4 and FreedomPay representatives.
- Always use secure storage for sensitive keys and tokens.
- The API is asynchronous; use `await` or `.then()` for responses.

---

## License

MIT

---

## Support

For issues or feature requests, please open a GitHub issue.