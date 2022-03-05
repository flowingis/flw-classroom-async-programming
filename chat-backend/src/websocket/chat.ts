import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { createApiGateway } from "../apiGateway";
import { ChatId, ChatMessageDto, ConnectionId } from "../dto/chat";
import chatRepository from "../repository/chatRepository";

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
          const apig = createApiGateway();
          const connections = await chatRepository.geChatConnections(chatId);
          connections.filter(id => id !== connId).map(id => {
              apig.postToConnection({
                  ConnectionId: id,
                  Data: JSON.stringify({
                    from: connId, 
                    type: 'info',
                    message: `joined the chat`
                  }, null, 2),
              }).send();
          });
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
      {
        try {
          const apig = createApiGateway();
          const chatId = await chatRepository.getChatByConnectionId(connId);
          await chatRepository.removeConnection(connId);
          const connections = await chatRepository.geChatConnections(chatId);
          connections.filter(id => id !== connId).map(id => {
              apig.postToConnection({
                  ConnectionId: id,
                  Data: JSON.stringify({
                    from: connId, 
                    type: 'info',
                    message: `left the chat`
                  }, null, 2),
              }).send();
          });
        } catch(error) {
          console.error(error);
          return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" }),
          };
        }
      }
      break;

    case "$default":
    default:
      {
        try {
          const chatId = await chatRepository.getChatByConnectionId(connId);
          const message = ChatMessageDto.parse(body);
          await chatRepository.saveMessage(chatId, message);
          const apig = createApiGateway();
          const connections = await chatRepository.geChatConnections(chatId);
          connections.filter(id => id !== connId).map(id => {
              apig.postToConnection({
                  ConnectionId: id,
                  Data: JSON.stringify({
                    from: connId,
                    type: 'message',
                    message
                  }, null, 2),
              }).send();
          });
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
