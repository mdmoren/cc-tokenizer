# cc-tokenizer

## Usage
```javascript
import RRTokenizer from 'redroof-tokenizer'

const myTokenizer = new RRTokenizer({
    environment: 'test',
    options: {
        shift4: true,
        freedomPay: true
    }
})

// Access specific tokenizers
const shift4 = myTokenizer.getTokenizer('shift4');
shift4.tokenize({ accessToken: 'token123', ... });
```