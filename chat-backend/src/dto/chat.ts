import { TypeOf, z } from "zod";

export const IsoDate = z.preprocess(args => {
  const parse = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/)
    .safeParse(args);
  if (parse.success) {
    return new Date(parse.data);
  }
}, z.date());

export const ChatId = z.union([
  z.number(),
  z.string().regex(/^\d+$/).transform(Number),
]);
export type ChatId = TypeOf<typeof ChatId>;

export const ConnectionId = z.string();
export type ConnectionId = TypeOf<typeof ChatId>;

export const ChatMessageDto = z.string();
export type ChatMessageDto = TypeOf<typeof ChatMessageDto>;

export const PostChatMessageDto = z.object({
  message: ChatMessageDto,
});
export type PostChatMessageDto = TypeOf<typeof PostChatMessageDto>;

export const GetChatMessagesDto = z.array(
  z.object({
    message: ChatMessageDto,
    createdAt: z.date(),
  })
);
export type GetChatMessagesDto = TypeOf<typeof GetChatMessagesDto>;
