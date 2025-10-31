# cc-tokenizer

A unified interface for tokenizing credit cards using Shift4 and FreedomPay.

---

## Features

- **Shift4 Tokenizer**: Tokenize cards with Shift4 Universal Token service using secure credentials.
- **FreedomPay Tokenizers**:
  - CardStor: SOAP-based tokenization via FreedomPay CardStore service.
  - Freeway: SOAP-based tokenization via FreedomPay Freeway service.
- Consistent response format for all providers.
- **Possibly more tokenizers in the future!**

---

## Installation

```bash
npm install cc-tokenizer
```

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
      fpRsa: 'rsa-public-key',
      fpTokenType: 'token-type'
    },
  }
});
```

---

## Available Tokenizers

### Shift4

```ts
const shift4 = myTokenizer.getTokenizer('shift4');

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
const freedomPay = myTokenizer.getTokenizer('freedomPay');
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
const freeWayResult = await freedomPay.freeWayTokenize({
  cardNumber: '1111222233334444',
  expirationMonth: '10', // MM format
  expirationYear: '26',  // YY format
  securityCode: '123',
  firstName: 'Joe',
  lastName: 'Schmoe',
  merchantReferenceCode: 'your-internal-ref-123' // optional
});

console.log('[TEST] FreedomPay Freeway:', JSON.stringify(freeWayResult, null, 2));
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
import { CCTokenizer } from 'cc-tokenizer';
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

interface TokenizeResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  errors: unknown[];
}
```

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