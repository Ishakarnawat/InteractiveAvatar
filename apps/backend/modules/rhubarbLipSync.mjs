import { execCommand } from "../utils/files.mjs";
import { promises as fs } from "fs";
import path from "path";

const fileExists = async (p) => {
  try {
    await fs.access(p);
    return true;
  } catch (e) {
    return false;
  }
};

const checkDependencies = async () => {
  // Check ffmpeg is available on PATH
  try {
    await execCommand({ command: "ffmpeg -version" });
  } catch (e) {
    throw new Error(
      "ffmpeg not found. Please install ffmpeg and ensure it's on your PATH. On Debian/Ubuntu: sudo apt install ffmpeg; macOS: brew install ffmpeg"
    );
  }

  // Determine rhubarb path: RHUBARB_PATH env var, ./bin/rhubarb under cwd, or system `rhubarb` via which
  const envRhubarb = process.env.RHUBARB_PATH;
  const defaultLocal = path.resolve(process.cwd(), "./bin/rhubarb");
  let rhubarbPath = envRhubarb || defaultLocal;

  if (!(await fileExists(rhubarbPath))) {
    // Try system `which rhubarb`
    try {
      const whichResult = await execCommand({ command: "which rhubarb" });
      const whichPath = whichResult.trim();
      if (whichPath) {
        rhubarbPath = whichPath;
      }
    } catch (e) {
      // which not found or rhubarb not installed
    }
  }

  if (!(await fileExists(rhubarbPath))) {
    throw new Error(
      `Rhubarb binary not found. Tried paths: ${
        envRhubarb || "RHUBARB_PATH not set"
      }, ${defaultLocal}, and system PATH.\n` +
        `Download Rhubarb Lip-Sync from https://github.com/DanielSWolf/rhubarb-lip-sync/releases and place the executable in backend/bin as 'rhubarb', or install it system-wide and ensure it's on PATH. You can also set RHUBARB_PATH to the executable location.`
    );
  }

  // Return the resolved path so caller can use it if needed
  return rhubarbPath;
};

const getPhonemes = async ({ message, text } = {}) => {
  try {
    const time = new Date().getTime();
    console.log(`Starting conversion for message ${message}`);

    // Validate dependencies before conversion
    await checkDependencies();

    await execCommand({
      command: `ffmpeg -y -i audios/message_${message}.mp3 audios/message_${message}.wav`,
    });
    console.log(`Conversion done in ${new Date().getTime() - time}ms`);
    const rhubarbPath = await checkDependencies();

    // If caller provided text, write a transcript file and ask rhubarb to use it for alignment.
    // This avoids relying on PocketSphinx for speech recognition.
    let transcriptArg = "";
    if (text && typeof text === "string" && text.trim().length > 0) {
      const transcriptPath = `audios/message_${message}.txt`;
      try {
        await fs.writeFile(transcriptPath, text, "utf8");
        // Quote the path to be safe on Windows when passed to child processes
        const quoted = `"${transcriptPath.replace(/"/g, '\\"')}"`;
        transcriptArg = ` -t ${quoted}`;
      } catch (writeErr) {
        console.warn(`Could not write transcript ${transcriptPath}:`, writeErr);
        // fall through and let rhubarb try without transcript
      }
    }

    // Prefer using phonetic alignment when possible (faster), but if transcript is present
    // force alignment with the transcript to avoid speech-recognition dependencies.
    const baseCmd = `${rhubarbPath} -f json -o audios/message_${message}.json audios/message_${message}.wav`;
    const cmdWithTranscript = transcriptArg ? `${rhubarbPath} -f json -o audios/message_${message}.json audios/message_${message}.wav${transcriptArg}` : `${baseCmd} -r phonetic`;

    // Log the exact command for diagnostics (helps on Windows to see quoting)
    console.log(`Running Rhubarb command: ${cmdWithTranscript}`);

    try {
      await execCommand({ command: cmdWithTranscript });
    } catch (err) {
      const errMsg = String(err.message || err);
      // If rhubarb fails due to missing PocketSphinx resources and we didn't already try without phonetic,
      // retry without '-r phonetic' which avoids PocketSphinx. If transcript was provided, we've already used it
      // so this fallback shouldn't be necessary, but keep it for safety.
      if (/PocketSphinx|cmudict|speech recognition/i.test(errMsg)) {
        console.warn(
          "Rhubarb failed due to missing PocketSphinx resources; retrying without '-r phonetic' (slower, but avoids PocketSphinx)"
        );
        try {
          await execCommand({ command: baseCmd });
        } catch (err2) {
          console.error(`Rhubarb fallback also failed for message ${message}:`, err2);
          throw err2;
        }
      } else {
        throw err;
      }
    }
    // -r phonetic is faster but less accurate
    console.log(`Lip sync done in ${new Date().getTime() - time}ms`);
  } catch (error) {
    console.error(
      `Error while getting phonemes for message ${message}:`,
      error
    );
    throw error;
  }
};

export { getPhonemes };
