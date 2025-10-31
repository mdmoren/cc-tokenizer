declare module 'easy-soap-request' {
  interface SoapRequestOptions {
    url: string;
    headers: Record<string, string>;
    xml: string;
  }

  interface SoapResponse {
    response: {
      body: string;
      statusCode: number;
      headers: Record<string, string>;
    };
  }

  function soapRequest(options: SoapRequestOptions): Promise<SoapResponse>;
  export default soapRequest;
}