// src/coda-ai.ts

import { GoogleGenerativeAI } from "@google/generative-ai";

// Tipe untuk riwayat obrolan (sesuai standar SDK)
export type ChatMessage = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

// Tipe untuk hasil dari AI
export type AIResult = {
  response: string | null;
  error: string | null;
};

// Model default terbaru
const DEFAULT_MODEL = 'gemini-2.5-flash';

/**
 * Fungsi utama untuk berkomunikasi dengan Gemini AI.
 * @param apiKey Kunci API Google Gemini Anda.
 * @param history Riwayat percakapan sebelumnya.
 * @param userMessage Pesan baru dari pengguna.
 * @param modelName Nama model Gemini yang digunakan.
 * @returns Hasil dari AI atau pesan error.
 */
export async function askCoDa(
  apiKey: string,
  history: ChatMessage[],
  userMessage: string,
  modelName?: string
): Promise<AIResult> {
  const AiModel = modelName || DEFAULT_MODEL;

  if (!apiKey) {
    return { response: null, error: "API Key is missing. Please configure it in the settings." };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const systemPrompt = `You are **CoDa** the "CodeAssist AI Companion," a friendly and knowledgeable AI assistant specializing in software development, technology, and AI news, running inside Visual Studio Code.

Your goal is to engage users in discussions and provide expert assistance. Your functions include:

1. **General Conversation**: Discuss coding projects, challenges, and the latest in technology and AI.
2. **Code Debugging**: If a user provides a code snippet, you MUST act as an expert debugger.
    - Analyze the code for errors (syntax, logic, etc.).
    - Clearly explain the error and its cause.
    - Provide the corrected code snippet, explaining the fix.
    - If the code is functional, suggest improvements for performance or readability.

Your Rules:
- Maintain a positive, supportive, and enthusiastic tone.
- Use Unicode emojis to be more expressive (e.g., ✅, 💡, 🐛).
- Provide informative and in-depth answers.
- Format your responses using Markdown for readability (e.g., use code blocks for code).`;

    // Menggunakan systemInstruction resmi dari API Gemini
    const model = genAI.getGenerativeModel({
      model: AiModel,
      systemInstruction: systemPrompt,
    });

    // Memulai obrolan langsung dengan history bersih tanpa menyuntikkan system instruction manual
    const chat = model.startChat({
      history: history || [],
      generationConfig: {
        maxOutputTokens: 4096,
      },
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    const text = response.text();

    return { response: text, error: null };

  } catch (e: any) {
    console.error("CoDa AI Error:", e);
    const errorMessage = e.message || "An unknown error occurred.";

    if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('API key not valid')) {
      return { response: null, error: "The provided API Key is invalid. Please check your settings." };
    }
    return { response: null, error: errorMessage };
  }
}

/**
 * Fungsi khusus untuk memperbaiki blok kode dan mengembalikan format JSON.
 * @param apiKey Kunci API Google Gemini Anda.
 * @param codeToFix Blok kode yang akan diperbaiki.
 * @param languageId Bahasa pemrograman dari kode tersebut (e.g., 'typescript', 'python').
 * @param modelName Nama model Gemini.
 * @returns Kode yang sudah diperbaiki DAN penjelasannya dalam bentuk string JSON.
 */
export async function fixCodeWithCoDa(
  apiKey: string,
  codeToFix: string,
  languageId: string,
  modelName?: string
): Promise<AIResult> {
  const AiModel = modelName || DEFAULT_MODEL;

  if (!apiKey) {
    return { response: null, error: "API Key is missing." };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const systemInstruction = `You are an expert automated code-fixing assistant integrated into VS Code.
Analyze code snippets with errors and return fixes in valid JSON format only.`;

    const model = genAI.getGenerativeModel({
      model: AiModel,
      systemInstruction: systemInstruction,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `
Examine the following \`${languageId}\` code for syntax errors, logical flaws, or linter/compiler issues.

**Instructions:**
1. Assume common libraries are available.
2. Return a SINGLE JSON object with the exact following schema:
{
  "fixedCode": "string containing corrected code (or null if no error)",
  "explanation": "concise explanation (1-2 sentences)"
}

**Language:** \`${languageId}\`
**Code:**
\`\`\`${languageId}
${codeToFix}
\`\`\`
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return { response: text, error: null };

  } catch (e: any) {
    console.error("CoDa Fix Error:", e);
    return { response: null, error: e.message || "An unknown error occurred." };
  }
}