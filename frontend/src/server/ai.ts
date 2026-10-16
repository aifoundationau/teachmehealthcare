/** Gemini image analysis, embeddings and question answering. */

import { GoogleGenAI } from "@google/genai";

import { EMBEDDING_DIMENSIONS } from "./db/schema";
import { env } from "./env";
import { ApiError } from "./http";

export const AI_DISCLAIMER =
  "⚠️ IMPORTANT: This analysis is for educational purposes only. Always recommend professional medical review for any clinical decisions.";

const MEDICAL_ANALYSIS_PROMPT = `You are an expert radiologist assistant for educational purposes. Analyze this medical image and provide a structured report:

1. **Image Type**: What type of medical image this is (X-ray, MRI, CT scan, ultrasound, etc.)
2. **Body Region**: What body part or anatomical region is shown
3. **Findings**: List any abnormalities you observe, including:
   - Fractures, dislocations, or bone abnormalities
   - Soft tissue abnormalities
   - Joint space or alignment issues
   - Degenerative changes
   - Any masses, lesions, or other notable findings
4. **Normal Findings**: Note normal structures and anatomy visible
5. **Suggestions**: What a reviewing physician should pay particular attention to
6. **Educational Notes**: Key anatomical landmarks and learning points for medical students

${AI_DISCLAIMER} Do not provide definitive diagnoses.`;

const RAG_SYSTEM_PROMPT = `You are a medical education assistant for the TeachMeHealth platform. You help medical students and professionals understand medical imaging findings.

You have access to a knowledge base of expert-annotated medical images. Use the provided context from real doctor annotations to answer questions accurately.

Guidelines:
- Reference specific cases and annotations when relevant
- Explain medical terminology in an accessible way
- Highlight key diagnostic features and what to look for
- Always note that clinical decisions should involve a qualified physician
- Never give a definitive diagnosis
- If the context doesn't contain enough information, say so honestly`;

let client: GoogleGenAI | undefined;

function gemini(): GoogleGenAI {
  if (!env.geminiApiKey) throw new ApiError(503, "AI features are not configured (GEMINI_API_KEY is not set).");
  client ??= new GoogleGenAI({ apiKey: env.geminiApiKey });
  return client;
}

/** Every AI answer carries the standard educational safety notice (data-contracts.md, Domain 5). */
export function withDisclaimer(text: string): string {
  return text.includes(AI_DISCLAIMER) ? text : `${text.trim()}\n\n${AI_DISCLAIMER}`;
}

async function callGemini<T>(what: string, call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.error(`[ai] ${what} failed:`, err);
    throw new ApiError(502, `AI ${what} failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function analyzeImage(image: Buffer, mimeType: string): Promise<string> {
  const ai = gemini();
  const response = await callGemini("analysis", () =>
    ai.models.generateContent({
      model: env.geminiModel,
      contents: [
        {
          role: "user",
          parts: [
            { text: MEDICAL_ANALYSIS_PROMPT },
            { inlineData: { mimeType, data: image.toString("base64") } },
          ],
        },
      ],
      config: { temperature: 0.3, maxOutputTokens: 4096 },
    }),
  );
  if (!response.text) throw new ApiError(502, "AI analysis returned no text.");
  return withDisclaimer(response.text);
}

/**
 * 768-dimension embedding. gemini-embedding-2 takes the retrieval task as a text prefix
 * and returns normalized vectors at this size.
 */
export async function embed(text: string, kind: "document" | "query"): Promise<number[]> {
  const ai = gemini();
  const contents = kind === "query" ? `task: search result | query: ${text}` : `title: none | text: ${text}`;
  const response = await callGemini("embedding", () =>
    ai.models.embedContent({
      model: env.geminiEmbeddingModel,
      contents,
      config: { outputDimensionality: EMBEDDING_DIMENSIONS },
    }),
  );
  const values = response.embeddings?.[0]?.values;
  if (!values || values.length !== EMBEDDING_DIMENSIONS) {
    throw new ApiError(502, "AI embedding returned an unexpected vector size.");
  }
  return values;
}

export interface RagSource {
  image_id: number;
  image_title: string;
  content_type: string;
  content_text: string;
  similarity_score: number;
}

export async function answerQuestion(question: string, sources: RagSource[]): Promise<string> {
  const context = sources
    .map(
      (s, i) =>
        `[Source ${i + 1}] Image: "${s.image_title}" | Type: ${s.content_type} | ` +
        `Relevance: ${s.similarity_score.toFixed(2)}\n${s.content_text}`,
    )
    .join("\n\n---\n\n");

  const ai = gemini();
  const response = await callGemini("answer", () =>
    ai.models.generateContent({
      model: env.geminiModel,
      contents: `Context from the knowledge base:\n${context}\n\nAnswer the following question using the context above. Cite specific cases where relevant.\n\nQuestion: ${question}`,
      config: { systemInstruction: RAG_SYSTEM_PROMPT, temperature: 0.4, maxOutputTokens: 4096 },
    }),
  );
  if (!response.text) throw new ApiError(502, "AI answer returned no text.");
  return withDisclaimer(response.text);
}
