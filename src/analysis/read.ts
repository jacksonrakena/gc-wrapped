import { BlobWriter, Entry, Uint8ArrayWriter } from "@zip.js/zip.js";

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

export const readEntryAsJson = <T>(data: Entry) =>
  data.getData
    ? (data
        .getData(new Uint8ArrayWriter())
        .then((ab) => decoder.decode(ab))
        .then(fbAwareJsonParse) as Promise<T>)
    : (null as T);

export const createObjectUrl = async (entry: Entry) => {
  if (!entry.getData) return null;
  return URL.createObjectURL(await entry.getData(new BlobWriter()));
};
