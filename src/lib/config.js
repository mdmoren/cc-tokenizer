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
            baseUrlCardStor: "https://cs.freedompay.us/CardStor/CardStorService.asmx",
            baseUrlFreeway: "https://cs.uat.freedompay.com/Freeway/Service.asmx",
        },
        test: {
            baseUrlCardStor: "https://cs.uat.freedompay.com/CardStor/CardStorService.asmx",
            baseUrlFreeway: "https://cs.uat.freedompay.com/Freeway/Service.asmx",
        }
    }
}