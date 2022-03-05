import * as AWS from "aws-sdk";

let apiClientOptions: AWS.ApiGatewayManagementApi.ClientConfiguration | undefined;

if (process.env.IS_OFFLINE) {
  apiClientOptions = {
    apiVersion: '2018-11-29',
    accessKeyId: "DEFAULT_ACCESS_KEY",
    secretAccessKey: "DEFAULT_SECRET",
    endpoint: `http://localhost:3001`
  };
}

export function createApiGateway(): AWS.ApiGatewayManagementApi {
  return new AWS.ApiGatewayManagementApi(apiClientOptions);
}