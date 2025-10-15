import { globalConfig } from '../../lib/config.js'
import { validateShift4Payload } from './helpers/validation.js'
import axios from 'axios'

class Shift4Tokenizer {
    constructor(environment, config = {}) {
        this.name = 'shift4'
        this.baseUrl = globalConfig.shift4[environment].baseUrl
        this.routes = globalConfig.shift4.common.routes
        this.accessToken = config.accessToken
        this.companyName = config.companyName
        this.interfaceName = config.interfaceName
        this.interfaceVersion = config.interfaceVersion
    }
    
    async tokenize({
        firstName,
        lastName,
        postalCode,
        cardNumber,
        expirationDate
    }) {
        let response = {
            success: false,
            message: '',
            data: {},
            errors: []
        }

        const url = this.baseUrl + this.routes.add
        const headers = {
            AccessToken: this.accessToken,
            CompanyName: this.companyName,
            InterfaceName: this.interfaceName,
            InterfaceVersion: this.interfaceVersion,
            'Content-Type': 'application/json'
        }

        const payload = {
            dateTime: new Date().toISOString(),
            card: {
                expirationDate: expirationDate,
                number: cardNumber
            },
            customer: {
                firstName: firstName,
                lastName: lastName,
                postalCode: postalCode || ''
            }
        }

        try {
            const schemaValidation = validateShift4Payload(payload)
            if (!schemaValidation.ok) {
                response.message = 'Error: Schema Validation Failed'
                response.errors = schemaValidation.errors
                return response
            }

            const shift4Req = await axios.post(url, payload, { headers })

            if (shift4Req.data.result.error) {
                response.message = 'Error: could not tokenize card using Shift4'
                response.errors.push(shift4Req.data.result.error || {})
            }

            if (shift4Req.data.result) {
                response.success = true
                response.message = 'Card tokenized successfully using Shift4'
                response.data = shift4Req.data.result
            }

            return response

        } catch (error) {
            response.message = error.message || 'Internal Error: could not tokenize card using Shift4'
            response.errors.push(error.stack || {})

            return response
        }
    }
}

export default Shift4Tokenizer