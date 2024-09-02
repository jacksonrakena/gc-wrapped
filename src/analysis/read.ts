import { FileWithPath } from "react-dropzone";

const decoder = new TextDecoder();

export const readDroppedFile = <T>(data: FileWithPath) =>
  new Promise<T>((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onabort = () => {
        reject(reader.error ?? "aborted, unknown reason");
      };
      reader.onerror = () => {
        reject(reader.error ?? "unknown error");
      };
      reader.onload = () => {
        const data = JSON.parse(
          decoder.decode(reader.result as ArrayBuffer),

          /**
           * This fuckery is because Facebook encodes in Latin-1.
           */
          (_, v) =>
            typeof v === "string" || v instanceof String
              ? decodeURIComponent(escape(v.toString()))
              : v
        );

        resolve(data as T);
      };
      reader.readAsArrayBuffer(data);
    } catch (e) {
      reject(e);
    }
  });
