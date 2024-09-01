export type TheNameSchema = string;
export type TheParticipantsSchema = Participant[];
export type TheSenderNameSchema = string;
export type TheTimestampMsSchema = number;
export type TheContentSchema = string;
export type TheReactionSchema = string;
export type TheActorSchema = string;
export type TheReactionsSchema = ASchema2[];
export type TheIsGeoblockedForViewerSchema = boolean;
export type TheUriSchema = string;
export type TheCreationTimestampSchema = number;
export type ThePhotosSchema = ASchema3[];
export type TheUriSchema1 = string;
export type TheGifsSchema = ASchema4[];
export type TheLinkSchema = string;
export type TheShareTextSchema = string;
export type TheTitleSchema = string;
export type TheIsStillParticipantSchema = boolean;
export type TheThreadPathSchema = string;
export type TheMagicWordSchema = string;
export type TheCreationTimestampMsSchema = number;
export type TheAnimationEmojiSchema = string;
export type TheMagicWordsSchema = ASchema5[];
export type TheUriSchema2 = string;
export type TheCreationTimestampSchema1 = number;
export type TheModeSchema = number;
export type TheLinkSchema1 = string;

export interface RootSchema {
  participants: Participant[];
  messages: Message[];
  title: TheTitleSchema;
  is_still_participant: TheIsStillParticipantSchema;
  thread_path: TheThreadPathSchema;
  magic_words: TheMagicWordsSchema;
  image: TheImageSchema;
  joinable_mode: TheJoinableModeSchema;
  [k: string]: unknown;
}
export interface Participant {
  name: TheNameSchema;
}
export interface Message {
  sender_name: TheSenderNameSchema;
  timestamp_ms: TheTimestampMsSchema;
  content: TheContentSchema;
  reactions: TheReactionsSchema;
  is_geoblocked_for_viewer: TheIsGeoblockedForViewerSchema;
  photos: ThePhotosSchema;
  gifs: TheGifsSchema;
  share: TheShareSchema;
}
export interface ASchema2 {
  reaction: TheReactionSchema;
  actor: TheActorSchema;
  [k: string]: unknown;
}
export interface ASchema3 {
  uri: TheUriSchema;
  creation_timestamp: TheCreationTimestampSchema;
  [k: string]: unknown;
}
export interface ASchema4 {
  uri: TheUriSchema1;
  [k: string]: unknown;
}
export interface TheShareSchema {
  link: TheLinkSchema;
  share_text: TheShareTextSchema;
  [k: string]: unknown;
}
export interface ASchema5 {
  magic_word: TheMagicWordSchema;
  creation_timestamp_ms: TheCreationTimestampMsSchema;
  animation_emoji: TheAnimationEmojiSchema;
  [k: string]: unknown;
}
export interface TheImageSchema {
  uri: TheUriSchema2;
  creation_timestamp: TheCreationTimestampSchema1;
  [k: string]: unknown;
}
export interface TheJoinableModeSchema {
  mode: TheModeSchema;
  link: TheLinkSchema1;
  [k: string]: unknown;
}
