import {
  BlobReader,
  BlobWriter,
  Entry,
  TextWriter,
  ZipReader,
} from "@zip.js/zip.js";
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

export const readZipFiles = async (files: FileWithPath[]) => {
  let entries: Entry[] = [];
  for (const file of files) {
    if (file.type !== "application/zip") {
      throw `file ${file.name}: expected a ZIP file, like 'facebook-your_username-02_09_2024-jKOnRXtv.zip'.`;
    }
    try {
      const zr = new ZipReader(new BlobReader(file));
      entries = entries.concat(await zr.getEntries());
    } catch (e) {
      throw `file ${file.name}: ${e}`;
    }
  }
  return entries;
};

export const readEntryAsJson = <T>(data: Entry) =>
  data.getData
    ? (data.getData(new TextWriter()).then(fbAwareJsonParse) as Promise<T>)
    : (null as T);

export const createObjectUrl = async (entry: Entry) => {
  if (!entry.getData) return null;
  return URL.createObjectURL(await entry.getData(new BlobWriter()));
};
