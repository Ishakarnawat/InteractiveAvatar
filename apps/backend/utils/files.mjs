import { exec } from "child_process";
import { promises as fs } from "fs";

const execCommand = ({ command }) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        // Attach stderr to the error message for better diagnostics in callers
        const msg = `${error.message}${stderr ? "\n" + stderr : ""}`;
        const err = new Error(msg);
        err.code = error.code;
        return reject(err);
      }
      resolve(stdout);
    });
  });
};

const readJsonTranscript = async ({ fileName }) => {
  const data = await fs.readFile(fileName, "utf8");
  return JSON.parse(data);
};

const audioFileToBase64 = async ({ fileName }) => {
  const data = await fs.readFile(fileName);
  return data.toString("base64");
};

export { execCommand, readJsonTranscript, audioFileToBase64 };
