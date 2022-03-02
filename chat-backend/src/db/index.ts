import * as AWS from "aws-sdk";

let dbClientOptions: AWS.DynamoDB.Types.ClientConfiguration | undefined;

if (process.env.IS_OFFLINE) {
  dbClientOptions = {
    region: "localhost",
    endpoint: "http://localhost:8000",
    accessKeyId: "DEFAULT_ACCESS_KEY",
    secretAccessKey: "DEFAULT_SECRET",
  };
}

export const documentConnection = new AWS.DynamoDB.DocumentClient(
  dbClientOptions
);
