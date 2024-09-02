export type TheNameSchema = string;
export type TheParticipantsSchema = Participant[];
export type TheSenderNameSchema = string;
export type TheTimestampMsSchema = number;
export type TheContentSchema = string;
export type TheReactionSchema = string;
export type TheActorSchema = string;
export type TheUriSchema = string;
export type TheCreationTimestampSchema = number;
export type TheLinkSchema = string;
export type TheShareTextSchema = string;
export type TheThreadPathSchema = string;
export type TheMagicWordSchema = string;
export type TheCreationTimestampMsSchema = number;
export type TheAnimationEmojiSchema = string;
export type TheUriSchema2 = string;
export type TheCreationTimestampSchema1 = number;

export interface MessageManifestFileFormat {
  participants: Participant[];
  messages: Message[];
  title: string;
  is_still_participant: boolean;
  thread_path: string;
  magic_words: MagicWord[];
  image: ImageReference;
  joinable_mode: JoinableMode;
}
export interface Participant {
  name: TheNameSchema;
}
export interface Message {
  sender_name: TheSenderNameSchema;
  timestamp_ms: TheTimestampMsSchema;
  content: TheContentSchema;
  reactions?: MessageReaction[];
  is_geoblocked_for_viewer: boolean;
  photos?: ImageReference[];
  gifs?: MessageGif[];
  share?: TheShareSchema;
}
export interface MessageReaction {
  reaction: string;
  actor: string;
}
export interface MessageGif {
  uri: string;
}
export interface TheShareSchema {
  link: TheLinkSchema;
  share_text: TheShareTextSchema;
}
export interface MagicWord {
  magic_word: TheMagicWordSchema;
  creation_timestamp_ms: TheCreationTimestampMsSchema;
  animation_emoji: TheAnimationEmojiSchema;
}
export interface ImageReference {
  uri: string;
  creation_timestamp: number;
}
export interface JoinableMode {
  mode: number;
  link: string;
}
