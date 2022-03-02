import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AWS from "aws-sdk";
import { ChatId, ChatMessageDto, ConnectionId } from "../dto/chat";
import chatRepository from "../repository/chatRepository";

const apig = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.API_GATEWAY_ENDPOINT,
});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const {
    headers,
    body,
    requestContext: { connectionId, routeKey },
  } = event;

  const connId = ConnectionId.parse(connectionId);

  switch (routeKey) {
    case "$connect":
      {
        try {
          const chatId = ChatId.parse(headers["x-chat-id"]);
          if (!(await chatRepository.exist(chatId))) {
            return {
              statusCode: 404,
              body: JSON.stringify({ error: "chat not found" }),
            };
          }
          await chatRepository.addConnection(chatId, connId);
          const connections = await chatRepository.geChatConnections(chatId);
          // await Promise.all(
          //   connections
          //     .filter(id => id !== connId)
          //     .map(async id => {
          //       await apig
          //         .postToConnection({
          //           ConnectionId: id,
          //           Data: `A new connection has been established`,
          //         })
          //         .promise();
          //     })
          // );
        } catch (error) {
          console.log(error);
          return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" }),
          };
        }
      }
      break;

    case "$disconnect":
      await chatRepository.removeConnection(connId);
      break;

    case "$default":
    default:
      {
        try {
          const chatId = await chatRepository.getChatByConnectionId(connId);
          const message = ChatMessageDto.parse(body);
          await chatRepository.saveMessage(chatId, message);
          const connections = await chatRepository.geChatConnections(chatId);
          // await Promise.all(
          //   connections
          //     .filter(id => id !== connId)
          //     .map(async id => {
          //       await apig
          //         .postToConnection({
          //           ConnectionId: id,
          //           Data: message,
          //         })
          //         .promise();
          //     })
          // );
        } catch (error) {
          console.error(error);
          return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" }),
          };
        }
      }
      break;
  }

  return { statusCode: 200, body: "" };
};
