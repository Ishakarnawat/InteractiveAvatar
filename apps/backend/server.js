import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { openAIChain, parser } from "./modules/openAI.mjs";
import { lipSync } from "./modules/lip-sync.mjs";
import {
  sendDefaultMessages,
  defaultResponse,
} from "./modules/defaultMessages.mjs";
import { convertAudioToText } from "./modules/whisper.mjs";

dotenv.config();

const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-pro";
const GEMINI_BEARER_TOKEN =
  process.env.GEMINI_BEARER_TOKEN || process.env.GOOGLE_BEARER_TOKEN || null;
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;

const app = express();
app.use(express.json());
app.use(cors());
const port = 3000;

app.get("/voices", async (req, res) => {
  res.send(await voice.getVoices(elevenLabsApiKey));
});

app.post("/tts", async (req, res) => {
  const userMessage = await req.body.message;
  const defaultMessages = await sendDefaultMessages({ userMessage });
  if (defaultMessages) {
    res.send({ messages: defaultMessages });
    return;
  }
  let openAImessages;
  try {
    openAImessages = await openAIChain.invoke({
      question: userMessage,
      format_instructions: parser.getFormatInstructions(),
    });
  } catch (error) {
    const errText = error && error.message ? error.message : String(error);
    console.error("openAIChain.invoke error:", errText);
    // Provide guidance for common Gemini errors
    if (errText && errText.includes("Tried URLs:")) {
      console.error(
        `Gemini attempted URLs and failed. Check GEMINI_MODEL (currently=${GEMINI_MODEL}) and ensure you provided a valid API key or bearer token. Auth mode: ${
          GEMINI_BEARER_TOKEN ? "bearer" : GEMINI_API_KEY ? "key" : "none"
        }`
      );
    }
    openAImessages = defaultResponse;
  }
  // Log AI response for debugging
  try {
    const logMessages = Array.isArray(openAImessages)
      ? openAImessages
      : openAImessages && Array.isArray(openAImessages.messages)
      ? openAImessages.messages
      : [];
    console.log(
      `AI generated ${
        logMessages.length
      } message(s) at ${new Date().toISOString()}`
    );
    logMessages.forEach((m, i) =>
      console.log(`  [AI message ${i}] text=${String(m.text).slice(0, 200)}`)
    );
  } catch (e) {
    console.warn("Failed to log AI messages", e);
  }

  // Normalize different shapes: openAImessages may be an object with .messages or an array
  let messagesArray = [];
  if (Array.isArray(openAImessages)) {
    messagesArray = openAImessages;
  } else if (openAImessages && Array.isArray(openAImessages.messages)) {
    messagesArray = openAImessages.messages;
  } else if (defaultResponse && Array.isArray(defaultResponse.messages)) {
    messagesArray = defaultResponse.messages;
  }

  const enrichedMessages = await lipSync({ messages: messagesArray });
  res.send({ messages: enrichedMessages });
});

app.post("/sts", async (req, res) => {
  const base64Audio = req.body.audio;
  const audioData = Buffer.from(base64Audio, "base64");
  const userMessage = await convertAudioToText({ audioData });
  let openAImessages;
  try {
    openAImessages = await openAIChain.invoke({
      question: userMessage,
      format_instructions: parser.getFormatInstructions(),
    });
  } catch (error) {
    openAImessages = defaultResponse;
  }

  let messagesArray = [];
  if (Array.isArray(openAImessages)) {
    messagesArray = openAImessages;
  } else if (openAImessages && Array.isArray(openAImessages.messages)) {
    messagesArray = openAImessages.messages;
  } else if (defaultResponse && Array.isArray(defaultResponse.messages)) {
    messagesArray = defaultResponse.messages;
  }

  const enrichedMessages = await lipSync({ messages: messagesArray });
  res.send({ messages: enrichedMessages });
});

app.listen(port, () => {
  console.log(`Jack are listening on port ${port}`);
  console.log(`Gemini model configured: ${GEMINI_MODEL}`);
  console.log(
    `Gemini auth: ${
      GEMINI_BEARER_TOKEN ? "bearer token" : GEMINI_API_KEY ? "api key" : "none"
    }`
  );
});
