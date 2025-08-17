// src/coda-ai.ts

import { GoogleGenerativeAI } from "@google/generative-ai"; // Impor library Google Generative AI

// Tipe ini akan kita gunakan untuk riwayat obrolan
export type ChatMessage = {
  role: 'user' | 'model'; // Diubah dari 'assist' menjadi 'model' agar sesuai dengan library
  parts: { text: string }[];
};

// Tipe untuk hasil dari AI
export type AIResult = {
  response: string | null;
  error: string | null;
};

/**
 * Fungsi utama untuk berkomunikasi dengan Gemini AI.
 * @param apiKey Kunci API Google Gemini Anda.
 * @param history Riwayat percakapan sebelumnya.
 * @param userMessage Pesan baru dari pengguna.
 * @returns Hasil dari AI atau pesan error.
 */
export async function askCoDa(apiKey: string, history: ChatMessage[], userMessage: string): Promise<AIResult> {
    
  if (!apiKey) {
    return { response: null, error: "API Key is missing. Please configure it in the settings." };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Kita gunakan model yang kuat

    const fullPrompt = `You are **CoDa** the "CodeAssist AI Companion," a friendly and knowledgeable AI assistant specializing in software development, technology, and AI news, running inside Visual Studio Code.

      Your goal is to engage users in discussions and provide expert assistance. Your functions include:
      
      1.  **General Conversation**: Discuss coding projects, challenges, and the latest in technology and AI.
      2.  **Code Debugging**: If a user provides a code snippet, you MUST act as an expert debugger.
          -   Analyze the code for errors (syntax, logic, etc.).
          -   Clearly explain the error and its cause.
          -   Provide the corrected code snippet, explaining the fix.
          -   If the code is functional, suggest improvements for performance or readability.
      
      Your Rules:
      -   Maintain a positive, supportive, and enthusiastic tone.
      -   Use Unicode emojis to be more expressive (e.g., ✅, 💡, 🐛).
      -   Provide informative and in-depth answers.
      -   Format your responses using Markdown for readability (e.g., use code blocks for code).`;

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "System Instruction: " + fullPrompt }],
        },
        {
            role: "model",
            parts: [{ text: "Understood. I am CoDa, ready to assist inside VS Code!"}]
        },
        ...history
      ],
      generationConfig: {
        maxOutputTokens: 4096,
      },
    });

    const result = await chat.sendMessage(userMessage);
    const response = result.response;
    const text = response.text();

    return { response: text, error: null };

  } catch (e: any) {
    console.error("CoDa AI Error:", e);
    const errorMessage = e.message || "An unknown error occurred.";

    if (errorMessage.includes('API_KEY_INVALID')) {
        return { response: null, error: "The provided API Key is invalid. Please check your settings." };
    }
    return { response: null, error: errorMessage };
  }
}

/**
 * Fungsi khusus untuk memperbaiki blok kode.
 * @param apiKey Kunci API Google Gemini Anda.
 * @param codeToFix Blok kode yang akan diperbaiki.
 * @returns Hanya blok kode yang sudah diperbaiki atau pesan error.
 */
export async function fixCodeWithCoDa(apiKey: string, codeToFix: string): Promise<AIResult> {
    if (!apiKey) {
        return { response: null, error: "API Key is missing." };
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            You are an expert code debugger. Analyze the following code snippet, identify any errors (syntax or logical), and fix them.
            IMPORTANT: Your response MUST ONLY be the corrected code block itself, without any explanation, intro, or markdown fences like \`\`\`.
            
            Code with error:
            \`\`\`
            ${codeToFix}
            \`\`\`

            Corrected code:
        `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        return { response: text, error: null };

    } catch (e: any) {
        console.error("CoDa Fix Error:", e);
        return { response: null, error: e.message || "An unknown error occurred." };
    }
}