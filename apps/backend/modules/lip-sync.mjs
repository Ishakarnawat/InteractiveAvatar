import { convertTextToSpeech } from "./elevenLabs.mjs";
import { getPhonemes } from "./rhubarbLipSync.mjs";
import { readJsonTranscript, audioFileToBase64 } from "../utils/files.mjs";
import { promises as fs } from "fs";

const MAX_RETRIES = 10;
const RETRY_DELAY = 0;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const lipSync = async ({ messages } = {}) => {
  // Normalize: if messages is not provided or not an array, try to recover or return empty array.
  if (!messages) {
    console.warn("lipSync: no messages provided, returning empty array");
    return [];
  }

  if (!Array.isArray(messages)) {
    // If callers accidentally passed the whole response object, attempt to use its .messages property
    if (Array.isArray(messages.messages)) {
      messages = messages.messages;
    } else {
      console.warn("lipSync: messages is not an array, returning empty array");
      return [];
    }
  }

  await Promise.all(
    messages.map(async (message, index) => {
      const fileName = `audios/message_${index}.mp3`;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          await convertTextToSpeech({ text: message.text, fileName });
          // Verify audio file exists and log size
          try {
            const stat = await fs.stat(fileName);
            console.log(`TTS wrote ${fileName} size=${stat.size} bytes`);
            if (stat.size === 0)
              console.warn(`Warning: ${fileName} has 0 bytes`);
          } catch (e) {
            console.error(`TTS failed to produce ${fileName}:`, e);
          }
          await delay(RETRY_DELAY);
          break;
        } catch (error) {
          if (
            error.response &&
            error.response.status === 429 &&
            attempt < MAX_RETRIES - 1
          ) {
            await delay(RETRY_DELAY);
          } else {
            throw error;
          }
        }
      }
      console.log(`Message ${index} converted to speech`);
    })
  );

  await Promise.all(
    messages.map(async (message, index) => {
      const fileName = `audios/message_${index}.mp3`;

      console.log(
        `Running rhubarb for message ${index} on file audios/message_${index}.wav`
      );
      try {
        // Pass the original message text to enable forced-alignment in rhubarb
        await getPhonemes({ message: index, text: message.text });
        message.audio = await audioFileToBase64({ fileName });
        message.lipsync = await readJsonTranscript({
          fileName: `audios/message_${index}.json`,
        });
      } catch (error) {
        console.error(
          `Error while getting phonemes for message ${index}:`,
          error
        );
      }
    })
  );

  return messages;
};

export { lipSync };
