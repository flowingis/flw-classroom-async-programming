import { ChatId, ChatMessageId } from "../entities/chat";

type IsoDate = string;

export type ChatTable = {
  id: ChatId;
  created_at: IsoDate;
};

export type ChatMessageTable = {
  id: ChatMessageId;
  chat_id: ChatId;
  created_at: IsoDate;
  message: string;
};

export type ChatConnectionTable = {
  connection_id: string;
  chat_id: ChatId;
  created_at: IsoDate;
};
