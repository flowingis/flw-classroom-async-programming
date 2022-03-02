import { Static, Type } from "@sinclair/typebox";
import { FastifyPluginAsync } from "fastify";
import type { WebSocket } from "ws";

const ChatId = Type.Number();
type ChatId = Static<typeof ChatId>;

const ChatCreateDto = Type.Object({
  chatId: ChatId,
});
type ChatCreateDto = Static<typeof ChatCreateDto>;

const ChatParams = Type.Object({
  chatId: ChatId,
});
type ChatParams = Static<typeof ChatParams>;

const ChatMessages = Type.Array(Type.String());
type ChatMessages = Static<typeof ChatMessages>;

type ChatHistory = Record<number, string[]>;
const chatHistory: ChatHistory = {};

type ChatSockets = Record<number, WebSocket[]>;
const chatSockets: ChatSockets = {};

const roomsRoute: FastifyPluginAsync = async fastify => {
  fastify.get<{ Params: ChatParams }>(
    "/:chatId",
    {
      websocket: true,
      schema: {
        params: ChatParams,
      },
    },
    (connection, req) => {
      const { chatId } = req.params;
      if (!chatHistory[chatId]) {
        chatHistory[chatId] = [];
        chatSockets[chatId] = [];
      }
      chatSockets[chatId].push(connection.socket);
      connection.socket.on("message", message => {
        chatHistory[chatId].push(message.toString("utf-8"));
        chatSockets[chatId].forEach(c => {
          if (c.readyState === 1 && c !== connection.socket) {
            c.send(message.toString("utf-8"));
          }
        });
      });
    }
  );

  fastify.get<{ Params: ChatParams; Reply: ChatMessages }>(
    "/:chatId/history",
    {
      schema: {
        params: ChatParams,
        response: {
          200: ChatMessages,
        },
      },
    },
    (req, res) => {
      const { chatId } = req.params;
      res.send(chatHistory[chatId]);
    }
  );

  fastify.post<{ Reply: ChatCreateDto }>(
    "/",
    {
      schema: {
        response: {
          200: ChatCreateDto,
        },
      },
    },
    (_, res) => {
      const chatId = Date.now();
      fastify.log.info(chatId);
      res.send({ chatId });
    }
  );
};

export default roomsRoute;
