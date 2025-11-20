export interface RouteConfig {
    add: string;
}

export interface CommonShift4Config {
    routes: RouteConfig;
}

export interface EnvironmentShift4Config {
    baseUrl: string;
}

export interface CommonFreedomPayConfig {
    cardStorHost: string;
    freewayHost: string;
}

export interface EnvironmentFreedomPayConfig {
    baseUrlCardStor: string;
    baseUrlFreeway: string;
}

export interface Shift4Config {
    common: CommonShift4Config;
    production: EnvironmentShift4Config;
    test: EnvironmentShift4Config;
}

export interface FreedomPayConfig {
    common: CommonFreedomPayConfig;
    production: EnvironmentFreedomPayConfig;
    test: EnvironmentFreedomPayConfig;
}

export interface CommonFreedomPayHpcConfig {
    routes: {
        sessionInitialize: string;
        rsaKeys: string;
        paymentKey: string;
        payments: string;
        acknowledge: string;
    };
}

export interface EnvironmentFreedomPayHpcConfig {
    baseUrlEnterpriseServices: string;
    baseUrlHpc: string;
}

export interface FreedomPayHpcConfig {
    common: CommonFreedomPayHpcConfig;
    production: EnvironmentFreedomPayHpcConfig;
    test: EnvironmentFreedomPayHpcConfig;
}

export interface GlobalConfig {
    shift4: Shift4Config;
    freedomPay: FreedomPayConfig;
    freedomPayHpc: FreedomPayHpcConfig;
}

export const globalConfig: GlobalConfig = {
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
    },
    freedomPayHpc: {
        common: {
            routes: {
                sessionInitialize: "/api/v2.0/session/initialize",
                rsaKeys: "/dmpservice/api/v3/keys",
                paymentKey: "/api/v2.0/payments/key",
                payments: "/api/v2.0/payments",
                acknowledge: "/api/v2.0/payments/acknowledge"
            }
        },
        production: {
            baseUrlEnterpriseServices: "https://enterprise-services.freedompay.com",
            baseUrlHpc: "https://hpc.freedompay.com"
        },
        test: {
            baseUrlEnterpriseServices: "https://enterprise-services.uat.freedompay.com",
            baseUrlHpc: "https://hpc.uat.freedompay.com"
        }
    }
};