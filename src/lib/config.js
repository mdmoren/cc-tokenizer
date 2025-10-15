export const globalConfig = {
    shift4: {
        common: {
            routes: {
                add: "/api/rest/v1/tokens/add"
            }
        },
        production: {
            baseUrl: "https://utg.shift4api.net"
        },
        test: {
            baseUrl: "https://utgapi.shift4test.com"
        }
    },
    freedomPay: {
        common: {
            cardStorHost: "http://cardstor.freedompay.com/",
            freewayHost: "http://freeway.freedompay.com/"
        },
        production: {
            baseUrl: "https://cs.freedompay.us/CardStor/CardStorService.asmx"
        },
        test: {
            baseUrl: "https://cs.uat.freedompay.com/CardStor/CardStorService.asmx"
        }
    }
}