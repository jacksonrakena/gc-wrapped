import tokenize from "@stdlib/nlp-tokenize";
import { Message, MessageManifestFileFormat } from "../schema";
import { deepAdd, deepIncrement } from "../util/objects";

const IGNORE_REGEX = /[rR]eacted (.+) to your message/;

export async function analyse(files: MessageManifestFileFormat[]) {
  try {
    const t0 = Date.now();
    const participants = Array.from(
      new Set<string>(files.flatMap((e) => e.participants.map((e) => e.name)))
    );

    const messages = files
      .flatMap((e) => e.messages)
      .filter((a) => !IGNORE_REGEX.test(a.content ?? ""));

    const totalMessagesByAuthor: { [authorName: string]: number } = {};
    const totalCharactersByAuthor: { [authorName: string]: number } = {};
    const totalReactionsByEmoji: { [reactionName: string]: number } = {};
    const totalReactionsByUser: {
      [reactor: string]: {
        [emoji: string]: number;
      };
    } = {};
    const reactionsReceivedByAuthor: {
      [recipient: string]: { [emoji: string]: number };
    } = {};

    const messagesByMonth: { [monthBin: string]: number } = {};
    const messagesByMonthAndAuthor: {
      [monthBin: string]: { [authorName: string]: number };
    } = {};
    const totalCountByWord: { [word: string]: number } = {};
    const totalMentionsByUser: { [userName: string]: number } = {};

    const allReactionsByReactor: {
      [reactor: string]: {
        [reactedMessageAuthor: string]: { [emoji: string]: number };
      };
    } = {};
    const mostReactedMessageByEmoji: {
      [emoji: string]: Message & { count: number };
    } = {};

    for (const message of messages) {
      deepIncrement(totalMessagesByAuthor, message.sender_name);

      deepAdd(
        totalCharactersByAuthor,
        message.content?.length ?? 0,
        message.sender_name
      );

      const reactions: { [reaction: string]: number } = {};
      for (const r of message.reactions ?? []) {
        deepIncrement(reactions, r.reaction);
        deepIncrement(totalReactionsByEmoji, r.reaction);
        deepIncrement(
          reactionsReceivedByAuthor,
          message.sender_name,
          r.reaction
        );
        deepIncrement(
          allReactionsByReactor,
          r.actor,
          message.sender_name,
          r.reaction
        );
        deepIncrement(totalReactionsByUser, r.actor, r.reaction);
      }
      for (const rxn of Object.keys(reactions)) {
        const count = reactions[rxn];
        if (
          !mostReactedMessageByEmoji[rxn] ||
          count > mostReactedMessageByEmoji[rxn].count
        ) {
          mostReactedMessageByEmoji[rxn] = { ...message, count };
        }
      }
      const d = new Date(message.timestamp_ms);
      const bin = `${d.getFullYear()}-${d.getMonth() + 1}`;
      deepIncrement(messagesByMonth, bin);
      deepIncrement(messagesByMonthAndAuthor, bin, message.sender_name);

      if (message.content) {
        for (const word of tokenize(message.content.toLowerCase())) {
          deepIncrement(totalCountByWord, word);
        }
        for (const p of participants) {
          if (message.content.includes(p)) {
            deepIncrement(totalMentionsByUser, p);
          }
        }
      }
    }

    const topRxn =
      Object.entries(totalReactionsByEmoji).length > 0
        ? Object.entries(totalReactionsByEmoji).sort(
            (b, a) => a[1] - b[1]
          )[0][0]
        : null;
    const mostLikedUser = topRxn
      ? Object.fromEntries(
          participants.map((e) => [
            e,
            (() => {
              try {
                return (
                  reactionsReceivedByAuthor[e][topRxn] /
                  totalMessagesByAuthor[e]
                );
              } catch {
                return 0;
              }
            })(),
          ])
        )
      : null;

    const totalTime = Date.now() - t0;

    console.log(`Processed ${messages.length} messages in ${totalTime}ms`);
    return {
      participants: participants,
      messages: messages,
      pToCharacters: totalCharactersByAuthor,
      pToMessages: totalMessagesByAuthor,
      totalReactions: totalReactionsByEmoji,
      reactionsReceivedByAuthor,
      mostLikedUser,
      topRxn,
      messagesByMonth,
      wordCount: totalCountByWord,
      mentions: totalMentionsByUser,
      topEmojiTargets: allReactionsByReactor,
      totalReactionsByUser,
      mostReactedMessages: mostReactedMessageByEmoji,
      totalTime,
      messagseByMonthAndUser: messagesByMonthAndAuthor,
    };
  } catch (e) {
    console.log("Error processing: ", e);
    throw e;
  }
}
