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
export async function askCoDa(apiKey: string, history: ChatMessage[], userMessage: string, modelName: string): Promise<AIResult> {

  const AiModel = modelName || 'gemini-2.5-flash';

  if (!apiKey) {
    return { response: null, error: "API Key is missing. Please configure it in the settings." };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: AiModel });

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
 * [UPGRADED] Fungsi khusus untuk memperbaiki blok kode.
 * @param apiKey Kunci API Google Gemini Anda.
 * @param codeToFix Blok kode yang akan diperbaiki.
 * @param languageId Bahasa pemrograman dari kode tersebut (e.g., 'typescript', 'python').
 * @returns Kode yang sudah diperbaiki DAN penjelasannya.
 */
export async function fixCodeWithCoDa(apiKey: string, codeToFix: string, languageId: string, modelName: string): Promise<AIResult> {

  const AiModel = modelName || 'gemini-2.5-flash';

    if (!apiKey) {
        return { response: null, error: "API Key is missing." };
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
            model: AiModel,
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        // [PROMPT BARU YANG LEBIH BAIK]
        const prompt = `
            You are an expert automated code-fixing assistant integrated into VS Code.
            Your task is to analyze a code snippet that a user has highlighted because it has an error (a "red squiggle").
            Your goal is to provide a corrected version of the code and a concise explanation.

            **IMPORTANT INSTRUCTIONS:**
            1.  **Analyze the Code**: Examine the following \`${languageId}\` code for syntax errors, logical flaws, or common mistakes that would cause a linter or compiler error.
            2.  **Assume Context**: The user has only provided a snippet. You might need to infer missing imports, variables, or functions. Assume common libraries (like 'React' for jsx, 'os' for python, etc.) are available.
            3.  **Generate Response**: Your response MUST be a single, valid JSON object. Do not include any text or markdown before or after the JSON object.
            4.  **JSON Structure**: The JSON object must have two properties:
                -   \`"fixedCode"\`: A string containing ONLY the corrected, complete code snippet. It should be a drop-in replacement for the user's selection.
                -   \`"explanation"\`: A friendly and concise (1-2 sentences) explanation of the error and how you fixed it.
            5.  **No Error Found**: If you analyze the code and cannot find any clear errors, set \`"fixedCode"\` to \`null\` and use the \`"explanation"\` to state that the code appears to be correct.

            **EXAMPLE:**
            -   **User's \`javascript\` code with error:**
                \`\`\`javascript
                function greet() {
                  console.log("Hello, world!")
                }
                \`\`\`
            -   **Your JSON Response:**
                \`\`\`json
                {
                  "fixedCode": "function greet() {\\n  console.log(\\"Hello, world!\\");\\n}",
                  "explanation": "I added the missing semicolon at the end of the console.log statement for code consistency."
                }
                \`\`\`

            ---

            **Analyze and fix the following code:**

            **Language:** \`${languageId}\`
            **Code with error:**
            \`\`\`${languageId}
            ${codeToFix}
            \`\`\`
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