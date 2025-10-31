# TypeScript Support Example

## Installation

```bash
npm install cc-tokenizer
```

## TypeScript Usage

```typescript
import { CCTokenizer, type Shift4TokenizeParams, type TokenizerResponse } from 'cc-tokenizer';

// Initialize the tokenizer
const tokenizer = new CCTokenizer({
  environment: 'test', // or 'production'
  options: {
    shift4: {
      enabled: true,
      accessToken: 'your-access-token',
      companyName: 'Your Company',
      interfaceName: 'Your Interface',
      interfaceVersion: '1.0.0'
    },
    freedomPay: {
      enabled: true,
      fpStoreId: 'your-store-id',
      fpTerminalId: 'your-terminal-id',
      fpEskey: 'your-eskey',
      fpKsn: 'your-ksn',
      fpRsa: 'your-rsa',
      fpTokenType: 'your-token-type'
    }
  }
});

// Use Shift4 tokenizer
const shift4Tokenizer = tokenizer.getTokenizer('shift4');
if (shift4Tokenizer) {
  const shift4Params: Shift4TokenizeParams = {
    firstName: 'John',
    lastName: 'Doe',
    postalCode: '12345',
    cardNumber: '4111111111111111',
    expirationDate: '1225'
  };

  const result: TokenizerResponse = await shift4Tokenizer.tokenize(shift4Params);
  console.log(result);
}

// Use FreedomPay tokenizer
const freedomPayTokenizer = tokenizer.getTokenizer('freedomPay');
if (freedomPayTokenizer) {
  const cardStorResult = await freedomPayTokenizer.cardStorTokenize({
    cardNumber: '4111111111111111',
    expirationMonth: '12',
    expirationYear: '25',
    securityCode: '123'
  });
  console.log(cardStorResult);
}
```

## JavaScript Usage (Still Supported)

```javascript
import { CCTokenizer } from 'cc-tokenizer';

const tokenizer = new CCTokenizer({
  environment: 'test',
  options: {
    shift4: {
      enabled: true,
      accessToken: 'your-access-token',
      companyName: 'Your Company',
      interfaceName: 'Your Interface',
      interfaceVersion: '1.0.0'
    }
  }
});

// Rest works the same as before
```

## Available Types

The package now exports comprehensive TypeScript types:

- `CCTokenizer` - Main tokenizer class
- `CCTokenizerConstructorOptions` - Constructor options interface
- `Shift4Config` - Shift4 configuration interface
- `FreedomPayConfig` - FreedomPay configuration interface
- `Shift4TokenizeParams` - Parameters for Shift4 tokenization
- `FreedomPayCardStorParams` - Parameters for FreedomPay CardStor
- `FreedomPayFreewayParams` - Parameters for FreedomPay Freeway
- `TokenizerResponse` - Standard response interface
- `IShift4Tokenizer` - Shift4 tokenizer interface
- `IFreedomPayTokenizer` - FreedomPay tokenizer interface