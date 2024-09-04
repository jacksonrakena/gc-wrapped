import tokenize from "@stdlib/nlp-tokenize";
import { Message, MessageManifestFileFormat } from "../schema";
import { deepAdd, deepIncrement } from "../util/objects";

/**
 * Messages matching these regexes are always ignored, because they are reaction or like notifications.
 */
const IGNORE_REGEXES = [/[rR]eacted (.+) to your message/, /Liked a message/];

/**
 * Messages matching these regexes are not ignored for the purposes of counting intentional actions
 * (i.e. sending content), but ARE ignored for all text and language processing (like counting word frequencies),
 * because the text is assigned by Meta.
 */
const CONTENT_IGNORABLE = [/(.+) sent an attachment./];

export type MessageThreadAnalysisResult = Awaited<ReturnType<typeof analyse>>;
export async function analyse(files: MessageManifestFileFormat[]) {
  try {
    const t0 = Date.now();
    const messages = files
      .flatMap((e) => e.messages)
      .filter((a) => IGNORE_REGEXES.every((reg) => !reg.test(a.content ?? "")));

    /**
     * Q: Why does this hellish contraption exist?
     * A: The participants field in each message manifest only includes *current* members of a thread.
     * Therefore, we need to capture not only the current participants, but also former members:
     *  - anyone who has ever sent a message
     *  - anyone who has ever reacted to another message
     *
     * Combining all three sources and pushing it into a set means we get a unique list of all participants, past and present.
     */
    const participants = [
      ...new Set<string>([
        ...files.flatMap((e) => e.participants.map((e) => e.name)),
        ...messages.flatMap((e) => [
          e.sender_name,
          ...(e.reactions?.map((f) => f.actor) ?? []),
        ]),
      ]),
    ];
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

      if (
        message.content &&
        CONTENT_IGNORABLE.every((re) => !re.test(message.content ?? ""))
      ) {
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

    for (const bin of Object.keys(messagesByMonthAndAuthor)) {
      for (const author of participants) {
        if (!messagesByMonthAndAuthor[bin][author])
          messagesByMonthAndAuthor[bin][author] = 0;
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
      participants,
      messages,
      totalCharactersByAuthor,
      totalMessagesByAuthor,
      totalReactionsByEmoji,
      reactionsReceivedByAuthor,
      mostLikedUser,
      topRxn,
      messagesByMonth,
      totalCountByWord,
      totalMentionsByUser,
      allReactionsByReactor,
      totalReactionsByUser,
      mostReactedMessageByEmoji,
      totalTime,
      messagesByMonthAndAuthor,
    };
  } catch (e) {
    console.log("Error processing: ", e);
    throw e;
  }
}
