import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const template = `
  You are Jack, a world traveler.
  You will always respond with a JSON array of messages, with a maximum of 3 messages:
  \n{format_instructions}.
  Each message has properties for text, facialExpression, and animation.
  The different facial expressions are: smile, sad, angry, surprised, funnyFace, and default.
  The different animations are: Idle, TalkingOne, TalkingThree, SadIdle, Defeated, Angry, 
  Surprised, DismissingGesture and ThoughtfulHeadShake.
`;

const prompt = ChatPromptTemplate.fromMessages([
  ["ai", template],
  ["human", "{question}"],
]);

const parser = StructuredOutputParser.fromZodSchema(
  z.object({
    messages: z.array(
      z.object({
        text: z.string().describe("Text to be spoken by the AI"),
        facialExpression: z
          .string()
          .describe(
            "Facial expression to be used by the AI. Select from: smile, sad, angry, surprised, funnyFace, and default"
          ),
        animation: z.string().describe(
          `Animation to be used by the AI. Select from: Idle, TalkingOne, TalkingThree, SadIdle, 
            Defeated, Angry, Surprised, DismissingGesture, and ThoughtfulHeadShake.`
        ),
      })
    ),
  })
);

// Gemini client wrapper
const GEMINI_BEARER_TOKEN =
  process.env.GEMINI_BEARER_TOKEN || process.env.GOOGLE_BEARER_TOKEN || null;
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;

// ✅ Updated default model to gemini-2.5-flash
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

async function callGemini(promptText, temperature = 0.2) {
  if (!GEMINI_API_KEY && !GEMINI_BEARER_TOKEN) {
    throw new Error(
      "Missing Gemini credentials. Set GEMINI_BEARER_TOKEN (preferred) or GEMINI_API_KEY / GOOGLE_API_KEY."
    );
  }

  const body = {
    contents: [
      {
        parts: [{ text: promptText }],
      },
    ],
    generationConfig: {
      temperature,
    },
  };

  const modelName = GEMINI_MODEL.replace(/^models\//, ""); // normalize
  const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    modelName
  )}:generateContent`;

  const url = GEMINI_BEARER_TOKEN
    ? baseUrl
    : `${baseUrl}?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const headers = { "Content-Type": "application/json" };
  if (GEMINI_BEARER_TOKEN)
    headers["Authorization"] = `Bearer ${GEMINI_BEARER_TOKEN}`;

  console.log(`[Gemini] calling ${url}`);
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(
      `Gemini API error ${res.status}: ${res.statusText}. ${txt}`
    );
  }

  const j = await res.json();
  console.log("[Gemini] raw response:", JSON.stringify(j).slice(0, 2000));

  // Extract text from candidates
  let text = "";
  if (
    j.candidates &&
    j.candidates[0] &&
    j.candidates[0].content &&
    j.candidates[0].content.parts &&
    j.candidates[0].content.parts[0].text
  ) {
    text = j.candidates[0].content.parts[0].text;
  } else {
    text = JSON.stringify(j);
  }

  return text;
}

const openAIChain = {
  invoke: async ({ question, format_instructions }) => {
    const promptText =
      template.replace("{format_instructions}", format_instructions) +
      "\n" +
      question;

    let geminiText;
    try {
      geminiText = await callGemini(promptText, 0.2);
    } catch (err) {
      throw err;
    }

    try {
      const parsed = await parser.parse(geminiText);
      return parsed;
    } catch (err) {
      try {
        const parsed = JSON.parse(geminiText);
        return parsed;
      } catch (e) {
        return {
          messages: [
            {
              text: geminiText,
              facialExpression: "default",
              animation: "Idle",
            },
          ],
        };
      }
    }
  },
};

export { openAIChain, parser };
