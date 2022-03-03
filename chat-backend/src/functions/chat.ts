import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ChatId, GetChatMessagesDto, PostChatMessageDto } from "../dto/chat";
import chatRepository from "../repository/chatRepository";

export const create = async (): Promise<APIGatewayProxyResult> => {
  try {
    return {
      statusCode: 201,
      body: JSON.stringify({ id: await chatRepository.create() }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};

export const sendMessage = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { id } = event.pathParameters!;
    const chatId = ChatId.parse(id);

    if (!(await chatRepository.exist(chatId))) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "chat not found" }),
      };
    }

    const { message } = PostChatMessageDto.parse(JSON.parse(event.body!));
    await chatRepository.saveMessage(chatId, message);
    return {
      statusCode: 201,
      body: "",
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};

export const getMessages = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { id } = event.pathParameters!;
    const chatId = ChatId.parse(id);

    if (!(await chatRepository.exist(chatId))) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "chat not found" }),
      };
    }

    const messageEntities = await chatRepository.getMessagesByChatId(chatId);
    console.log(messageEntities);
    const messages: GetChatMessagesDto =
      GetChatMessagesDto.parse(messageEntities);
    return {
      statusCode: 200,
      body: JSON.stringify(messages),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
