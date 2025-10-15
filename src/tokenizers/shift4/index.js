import { globalConfig } from '../../lib/config.js'
import axios from 'axios'

class Shift4Tokenizer {
    constructor(environment, config = {}) {
        this.name = 'shift4'
        this.baseUrl = globalConfig.shift4[environment].baseUrl
        this.routes = globalConfig.shift4.common.routes
        this.environment = environment
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
            data: {}
        }

        const url = this.baseUrl + this.routes.add
        const headers = {
            AccessToken: this.accessToken,
            CompanyName: this.companyName,
            InterfaceName: this.interfaceName,
            InterfaceVersion: this.interfaceVersion,
            'Content-Type': 'application/json'
        }

        // expected payload
        // {
        //     "dateTime": "YYYY-MM-DDTHH:MM:SS.000-00:00",
        //     "card":{
        //         "expirationDate": MMYY, // number
        //         "number":"" // numerical string
        //      },
        //     "customer": {
        //         "firstName": "First",
        //         "lastName": "Last",
        //         "postalCode":"12345"
        //      }
        // }

        const payload = {
            dateTime: new Date().toISOString(),
            card: {
                expirationDate: expirationDate,
                number: cardNumber
            },
            customer: {
                firstName: firstName,
                lastName: lastName,
                postalCode: postalCode
            }
        }

        try {
            const shift4Req = await axios.post(url, payload, { headers })

            if (shift4Req && shift4Req.error) {
                response.message = shift4Req.data.error?.longText || 'Error: could not tokenize card using Shift4'
            }

            if (shift4Req && shift4Req.data.result) {
                response.success = true
                response.message = 'Card tokenized successfully using Shift4'
                response.data = shift4Req.data.result
            }

            return response

        } catch (error) {
            console.error('Error:', error);
            response.message = error.message || 'Error: could not tokenize card using Shift4'

            return response
        }
    }
}

export default Shift4Tokenizer