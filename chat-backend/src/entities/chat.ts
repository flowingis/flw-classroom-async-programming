export type ChatId = number;
export type ChatMessageId = string;
export type ConnectionId = string;

export type ChatMessageEntity = {
  id: ChatMessageId;
  message: ChatMessageId;
  createdAt: Date;
};
