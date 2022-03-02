import * as AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import { TypeOf, z } from "zod";
import { documentConnection } from "../db";
import { ChatId, ChatMessageEntity, ConnectionId } from "../entities/chat";
import {
  ChatConnectionTable,
  ChatMessageTable,
  ChatTable,
} from "../tables/chat";

const Tables = z.object({
  CHAT_TABLE: z.string(),
  CHAT_MESSAGE_TABLE: z.string(),
  CHAT_CONNECTION_TABLE: z.string(),
});
type Tables = TypeOf<typeof Tables>;

const loadTables = (): Tables => Tables.parse(process.env);
export const TABLES = loadTables();

export interface IChatRepository {
  create(): Promise<ChatId>;
  exist(id: ChatId): Promise<boolean>;
  saveMessage(id: ChatId, message: string): Promise<void>;
  getMessagesByChatId(id: ChatId): Promise<ChatMessageEntity[]>;
  getChatByConnectionId(connectionId: string): Promise<ChatId>;
  geChatConnections(id: ChatId): Promise<string[]>;
  addConnection(id: ChatId, connectionId: string): Promise<void>;
  removeConnection(connectionId: string): Promise<void>;
}

const chatRepository: IChatRepository = {
  async create(): Promise<ChatId> {
    const Item: ChatTable = {
      id: Date.now(),
      created_at: new Date().toISOString(),
    };
    const params: AWS.DynamoDB.DocumentClient.Put = {
      TableName: TABLES.CHAT_TABLE,
      Item,
    };
    await documentConnection.put(params).promise();
    return Item.id;
  },
  async exist(id: ChatId): Promise<boolean> {
    const params: AWS.DynamoDB.DocumentClient.GetItemInput = {
      TableName: TABLES.CHAT_TABLE,
      Key: {
        id,
      },
    };
    const chat = await documentConnection.get(params).promise();
    return !!chat.Item;
  },
  async saveMessage(id: ChatId, message: string): Promise<void> {
    const Item: ChatMessageTable = {
      id: uuidv4(),
      chat_id: id,
      message,
      created_at: new Date().toISOString(),
    };
    const params: AWS.DynamoDB.DocumentClient.Put = {
      TableName: TABLES.CHAT_MESSAGE_TABLE,
      Item,
    };
    await documentConnection.put(params).promise();
  },
  async getMessagesByChatId(id: ChatId): Promise<ChatMessageEntity[]> {
    const params: AWS.DynamoDB.DocumentClient.ScanInput = {
      TableName: TABLES.CHAT_MESSAGE_TABLE,
      ProjectionExpression: "id, message, created_at",
      FilterExpression: "chat_id = :chat_id",
      ExpressionAttributeValues: {
        ":chat_id": id,
      },
    };
    const chats = await documentConnection.scan(params).promise();
    return (chats.Items || []).map(
      ({ id: messageId, message, created_at }) => ({
        id: messageId,
        message,
        createdAt: new Date(created_at),
      })
    );
  },
  async getChatByConnectionId(connectionId: ConnectionId): Promise<ChatId> {
    const params: AWS.DynamoDB.DocumentClient.GetItemInput = {
      TableName: TABLES.CHAT_CONNECTION_TABLE,
      Key: {
        connection_id: connectionId,
      },
    };
    const chat = await documentConnection.get(params).promise();
    if (!chat.Item) throw new Error("Chat not found");
    return chat.Item.chat_id;
  },
  async geChatConnections(chatId: ChatId): Promise<ConnectionId[]> {
    const params: AWS.DynamoDB.DocumentClient.ScanInput = {
      TableName: TABLES.CHAT_CONNECTION_TABLE,
      ProjectionExpression: "connection_id",
      FilterExpression: "chat_id = :chat_id",
      ExpressionAttributeValues: {
        ":chat_id": chatId,
      },
    };
    const chats = await documentConnection.scan(params).promise();
    return (chats.Items || []).map(chat => chat.connection_id);
  },
  async addConnection(chatId: ChatId, connectionId: string): Promise<void> {
    const Item: ChatConnectionTable = {
      connection_id: connectionId,
      chat_id: chatId,
      created_at: new Date().toISOString(),
    };
    const params: AWS.DynamoDB.DocumentClient.Put = {
      TableName: TABLES.CHAT_CONNECTION_TABLE,
      Item,
    };
    await documentConnection.put(params).promise();
  },
  async removeConnection(connectionId: string): Promise<void> {
    const params: AWS.DynamoDB.DocumentClient.Delete = {
      TableName: TABLES.CHAT_CONNECTION_TABLE,
      Key: {
        connection_id: connectionId,
      },
    };
    await documentConnection.delete(params).promise();
  },
};

export default chatRepository;
