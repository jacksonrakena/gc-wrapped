export interface MessageManifestFileFormat {
  participants: Participant[];
  messages: Message[];
  title: string;
  is_still_participant: boolean;
  thread_path: string;
  magic_words: MagicWord[];
  image?: Image;
  joinable_mode: JoinableMode;
}

export interface Image {
  uri: string;
  creation_timestamp: number;
}

export interface JoinableMode {
  mode: number;
  link: string;
}

export interface MagicWord {
  magic_word: string;
  creation_timestamp_ms: number;
  animation_emoji: string;
}

export interface Message {
  sender_name: string;
  timestamp_ms: number;
  content?: string;
  reactions?: ReactionElement[];
  is_geoblocked_for_viewer: boolean;
  photos?: Image[];
  gifs?: GIF[];
  share?: Share;
  is_unsent?: boolean;
  videos?: Image[];
  call_duration?: number;
  sticker?: Sticker;
  bumped_message_metadata?: BumpedMessageMetadata;
  files?: Image[];
}

export interface BumpedMessageMetadata {
  is_bumped: boolean;
}

export interface GIF {
  uri: string;
}

export interface ReactionElement {
  reaction: string;
  actor: string;
}

export interface Share {
  link: string;
  share_text?: string;
}

export interface Sticker {
  uri: string;
  ai_stickers: unknown[];
}

export interface Participant {
  name: string;
}
