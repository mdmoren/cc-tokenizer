# TypeScript Support Guide

This package is written in TypeScript and provides comprehensive type definitions for all tokenizers and methods.

## Type-Safe Tokenizer Access

Each tokenizer has its own specific type definition and can only be used with its corresponding methods. This prevents errors at compile time:

```typescript
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
    },
    freedomPay: {
      enabled: true,
      fpStoreId: 'your-store-id',
      fpTerminalId: 'your-terminal-id',
      fpEskey: 'your-eskey',
      fpKsn: 'your-ksn',
      fpTokenType: 'your-token-type'
    },
    freedomPayHpc: {
      enabled: true,
      code: 'your-code',
      key: 'your-key',
      storeId: 'your-store-id',
      terminalId: 'your-terminal-id',
      esKey: 'your-eskey'
    }
  }
});

// Access tokenizers with type-safe methods
const shift4 = tokenizer.shift4(); // Returns IShift4Tokenizer | undefined
const freedomPay = tokenizer.freedomPay(); // Returns IFreedomPayTokenizer | undefined
const freedomPayHpc = tokenizer.freedomPayHpc(); // Returns IFreedomPayHpcTokenizer | undefined
```

## Type Safety Benefits

### 1. Method-Specific Type Checking

Each tokenizer only exposes its own methods:

```typescript
// ✅ Correct: Shift4 only has tokenize()
const shift4 = tokenizer.shift4();
if (shift4) {
  await shift4.tokenize({
    firstName: 'John',
    lastName: 'Doe',
    cardNumber: '4111111111111111',
    expirationDate: '1225'
  });
  
  // ❌ TypeScript Error: Property 'cardStorTokenize' does not exist
  // await shift4.cardStorTokenize({ ... });
}

// ✅ Correct: FreedomPay has cardStorTokenize(), freewayTokenize(), etc.
const freedomPay = tokenizer.freedomPay();
if (freedomPay) {
  await freedomPay.cardStorTokenize({
    cardNumber: '4111111111111111',
    expirationMonth: '12',
    expirationYear: '25',
    securityCode: '123'
  });
  
  await freedomPay.freewayTokenize({
    cardNumber: '4111111111111111',
    expirationMonth: '12',
    expirationYear: '25',
    securityCode: '123',
    firstName: 'John',
    lastName: 'Doe'
  });
  
  // ❌ TypeScript Error: Property 'tokenize' does not exist on IFreedomPayTokenizer
  // await freedomPay.tokenize({ ... });
}

// ✅ Correct: FreedomPayHPC has tokenize(), getAccessToken(), etc.
const freedomPayHpc = tokenizer.freedomPayHpc();
if (freedomPayHpc) {
  await freedomPayHpc.tokenize({
    cardNumber: '4111111111111111',
    expirationMonth: '12',
    expirationYear: '25',
    securityCode: '123'
  });
  
  await freedomPayHpc.getAccessToken({
    storeId: 'store-id',
    terminalId: 'terminal-id',
    esKey: 'es-key'
  });
  
  // ❌ TypeScript Error: Property 'cardStorTokenize' does not exist on IFreedomPayHpcTokenizer
  // await freedomPayHpc.cardStorTokenize({ ... });
}
```

### 2. Parameter Type Checking

Each method only accepts its specific parameter type:

```typescript
import type { 
  Shift4TokenizeParams,
  FreedomPayCardStorParams,
  FreedomPayHpcTokenizeParams
} from 'cc-tokenizer';

const shift4 = tokenizer.shift4();
if (shift4) {
  // ✅ Correct parameters for Shift4
  await shift4.tokenize({
    firstName: 'John',
    lastName: 'Doe',
    cardNumber: '4111111111111111',
    expirationDate: '1225' // MMYY format
  });
  
  // ❌ TypeScript Error: expirationMonth/expirationYear not valid for Shift4
  // await shift4.tokenize({
  //   cardNumber: '4111111111111111',
  //   expirationMonth: '12',
  //   expirationYear: '25'
  // });
}
```

## Installation

```bash
npm install cc-tokenizer
```

## Basic TypeScript Usage

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

// Use Shift4 tokenizer with type safety
const shift4Tokenizer = tokenizer.shift4();
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

// Use FreedomPay tokenizer with type safety
const freedomPayTokenizer = tokenizer.freedomPay();
if (freedomPayTokenizer) {
  const cardStorResult = await freedomPayTokenizer.cardStorTokenize({
    cardNumber: '4111111111111111',
    expirationMonth: '12',
    expirationYear: '25',
    securityCode: '123'
  });
  console.log(cardStorResult);
  
  // Traditional freeway tokenization
  const freewayResult = await freedomPayTokenizer.freewayTokenize({
    cardNumber: '4111111111111111',
    expirationMonth: '12',
    expirationYear: '25',
    securityCode: '123',
    firstName: 'John',
    lastName: 'Doe',
    merchantReferenceCode: 'ORDER_12345'
  });
  console.log(freewayResult);
}
```

## Complete Client-to-Server Workflow

### Step 1: Client-Side Encryption

```typescript
import { CCEncryptor, type FreedomPayEncryptParams, type EncryptorResponse } from 'cc-tokenizer';

const encryptor = new CCEncryptor({
  freedomPay: {
    fpRsa: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----`
  }
});

const freedomPayEncryptor = encryptor.freedomPay();
if (freedomPayEncryptor) {
  const encryptParams: FreedomPayEncryptParams = {
    cardNumber: '4111111111111111',
    expirationMonth: '12',
    expirationYear: '25',
    securityCode: '123'
  };

  const encryptResult: EncryptorResponse = await freedomPayEncryptor.encrypt(encryptParams);
  
  if (encryptResult.success) {
    const { trackeVal } = encryptResult.data;
    // Send trackeVal to your server...
  }
}
```

### Step 2: Server-Side Tokenization

```typescript
import { CCTokenizer, type FreedomPayFreewayWithTrackeParams } from 'cc-tokenizer';

const tokenizer = new CCTokenizer({
  environment: 'production',
  options: {
    freedomPay: {
      enabled: true,
      fpStoreId: 'store-id',
      fpTerminalId: 'terminal-id',
      fpEskey: 'eskey',
      fpKsn: 'ksn',
      fpRsa: 'rsa',
      fpTokenType: 'token-type'
    }
  }
});

const freedomPayTokenizer = tokenizer.freedomPay();
if (freedomPayTokenizer) {
  const tokenizeParams: FreedomPayFreewayWithTrackeParams = {
    tracke: 'encrypted_data_from_client',
    firstName: 'John',
    lastName: 'Doe',
    merchantReferenceCode: 'ORDER_12345'
  };

  const tokenResult = await freedomPayTokenizer.freewayTokenizeWithTracke(tokenizeParams);
  console.log(tokenResult);
}
```

## Client-Side Encryption

```typescript
import { CCEncryptor, type FreedomPayEncryptParams, type EncryptorResponse } from 'cc-tokenizer';

// Initialize the encryptor with FreedomPay RSA public key
const encryptor = new CCEncryptor({
  freedomPay: {
    fpRsa: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----`
  }
});

// Get the FreedomPay encryptor with type safety
const freedomPayEncryptor = encryptor.freedomPay();
if (freedomPayEncryptor) {
  const encryptParams: FreedomPayEncryptParams = {
    cardNumber: '4111111111111111',
    expirationMonth: '12',
    expirationYear: '25',
    securityCode: '123'
  };

  const encryptResult: EncryptorResponse = await freedomPayEncryptor.encrypt(encryptParams);
  console.log(encryptResult);
  
  // The encrypted trackeVal can be sent to your server for tokenization
  if (encryptResult.success) {
    const { trackeVal } = encryptResult.data;
    // Send trackeVal to your server...
  }
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

**Tokenization:**
- `CCTokenizer` - Main tokenizer class
- `CCTokenizerConstructorOptions` - Constructor options interface
- `Shift4Config` - Shift4 configuration interface
- `FreedomPayConfig` - FreedomPay configuration interface
- `Shift4TokenizeParams` - Parameters for Shift4 tokenization
- `FreedomPayCardStorParams` - Parameters for FreedomPay CardStor
- `FreedomPayFreewayParams` - Parameters for FreedomPay Freeway
- `FreedomPayFreewayWithTrackeParams` - Parameters for FreedomPay Freeway with pre-encrypted data
- `TokenizerResponse` - Standard response interface
- `IShift4Tokenizer` - Shift4 tokenizer interface
- `IFreedomPayTokenizer` - FreedomPay tokenizer interface

**Encryption:**
- `CCEncryptor` - Main encryptor class
- `EncryptorConfig` - Encryptor configuration interface
- `FreedomPayEncryptParams` - Parameters for FreedomPay encryption
- `EncryptorResponse` - Standard encryptor response interface
- `IEncryptor` - Base encryptor interface
- `IFreedomPayEncryptor` - FreedomPay encryptor interface