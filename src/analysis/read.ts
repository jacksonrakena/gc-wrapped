import { FileWithPath } from "react-dropzone";

/**
 * This fuckery is because Facebook encodes in Latin-1.
 */
const fbAwareJsonParse = (text: string) => {
  return JSON.parse(text, (_, v) =>
    typeof v === "string" || v instanceof String
      ? decodeURIComponent(escape(v.toString()))
      : v
  );
};

const decoder = new TextDecoder();

export const readDroppedFileJson = <T>(data: FileWithPath) =>
  data
    .arrayBuffer()
    .then((ab) => decoder.decode(ab))
    .then(fbAwareJsonParse) as Promise<T>;
