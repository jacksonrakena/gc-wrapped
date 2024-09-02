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
  name: string;
}
export interface Message {
  sender_name: string;
  timestamp_ms: number;
  content?: string;
  reactions?: MessageReaction[];
  is_geoblocked_for_viewer: boolean;
  photos?: ImageReference[];
  gifs?: MessageGif[];
  share?: ContentShareInfo;
}
export interface MessageReaction {
  reaction: string;
  actor: string;
}
export interface MessageGif {
  uri: string;
}
export interface ContentShareInfo {
  link: string;
  share_text: string;
}
export interface MagicWord {
  magic_word: string;
  creation_timestamp_ms: number;
  animation_emoji: string;
}
export interface ImageReference {
  uri: string;
  creation_timestamp: number;
}
export interface JoinableMode {
  mode: number;
  link: string;
}
