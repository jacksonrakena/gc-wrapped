import tokenize from "@stdlib/nlp-tokenize";
import { MessageManifestFileFormat } from "../schema";

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

    let pToMessages: { [x: string]: number } = {};
    let pToCharacters: { [x: string]: number } = {};
    let totalReactions: { [x: string]: number } = {};
    let reactionsReceivedByAuthor: {
      [recipient: string]: { [emoji: string]: number };
    } = {};
    let totalReactionsCount = 0;
    let messagesByMonth: { [x: string]: number } = {};
    let messagseByMonthAndUser: {
      [monthBin: string]: { [actor: string]: number };
    } = {};
    let wordCount: { [x: string]: number } = {};
    let mentions: { [x: string]: number } = {};
    let totalReactionsByUser: {
      [reactor: string]: {
        [emoji: string]: number;
      };
    } = {};

    let topEmojiTargets: {
      [reactor: string]: {
        [reactedMessageAuthor: string]: { [emoji: string]: number };
      };
    } = {};
    let mostReactedMessages: {
      [emoji: string]: Message & { count: number };
    } = {};

    for (const message of messages) {
      pToMessages[message.sender_name] =
        (pToMessages[message.sender_name] ?? 0) + 1;

      pToCharacters[message.sender_name] =
        (pToCharacters[message.sender_name] ?? 0) +
        (message.content?.length ?? 0);

      var reactions: { [reaction: string]: number } = {};
      for (const r of message.reactions ?? []) {
        reactions[r.reaction] = (reactions[r.reaction] ?? 0) + 1;
        totalReactions[r.reaction] = (totalReactions[r.reaction] ?? 0) + 1;
        if (!reactionsReceivedByAuthor[message.sender_name])
          reactionsReceivedByAuthor[message.sender_name] = {};

        reactionsReceivedByAuthor[message.sender_name][r.reaction] =
          (reactionsReceivedByAuthor[message.sender_name][r.reaction] ?? 0) + 1;

        if (!topEmojiTargets[r.actor]) topEmojiTargets[r.actor] = {};
        if (!topEmojiTargets[r.actor][message.sender_name])
          topEmojiTargets[r.actor][message.sender_name] = {};
        topEmojiTargets[r.actor][message.sender_name][r.reaction] =
          (topEmojiTargets[r.actor][message.sender_name][r.reaction] ?? 0) + 1;

        if (!totalReactionsByUser[r.actor]) totalReactionsByUser[r.actor] = {};
        totalReactionsByUser[r.actor][r.reaction] =
          (totalReactionsByUser[r.actor][r.reaction] ?? 0) + 1;
      }
      for (const rxn of Object.keys(reactions)) {
        const count = reactions[rxn];
        if (
          !mostReactedMessages[rxn] ||
          count > mostReactedMessages[rxn].count
        ) {
          mostReactedMessages[rxn] = { ...message, count };
        }
      }
      var d = new Date(message.timestamp_ms);
      var bin = `${d.getFullYear()}-${d.getMonth() + 1}`;
      messagesByMonth[bin] = (messagesByMonth[bin] ?? 0) + 1;
      if (!messagseByMonthAndUser[bin]) messagseByMonthAndUser[bin] = {};
      messagseByMonthAndUser[bin][message.sender_name] =
        (messagseByMonthAndUser[bin][message.sender_name] ?? 0) + 1;

      if (message.content) {
        for (const word of tokenize(message.content.toLowerCase())) {
          wordCount[word] = (wordCount[word] ?? 0) + 1;
        }
        for (let p of participants) {
          if (message.content.includes(p)) {
            mentions[p] = (mentions[p] ?? 0) + 1;
          }
        }
      }
    }

    let topRxn = Object.entries(totalReactions).sort(
      (b, a) => a[1] - b[1]
    )[0][0];
    let mostLikedUser = Object.fromEntries(
      participants.map((e) => [
        e,
        (() => {
          try {
            return reactionsReceivedByAuthor[e][topRxn] / pToMessages[e];
          } catch (e) {
            return 0;
          }
        })(),
      ])
    );

    const totalTime = Date.now() - t0;

    console.log(`Processed ${messages.length} messages in ${totalTime}ms`);
    return {
      participants: participants,
      messages: messages,
      pToCharacters,
      pToMessages,
      totalReactions,
      reactionsReceivedByAuthor,
      mostLikedUser,
      topRxn,
      messagesByMonth,
      wordCount,
      mentions,
      topEmojiTargets,
      totalReactionsByUser,
      mostReactedMessages,
      totalTime,
      messagseByMonthAndUser,
    };
  } catch (e) {
    console.log("Error processing: ", e);
    throw e;
  }
}
