
import { GoogleGenAI, Type } from "@google/genai";
import { DesignTokens } from "../types";

const getMimeType = (base64: string): string => {
  const match = base64.match(/^data:(image\/[a-z]+);base64,/);
  return match ? match[1] : 'image/png';
};

const getBase64Data = (base64: string): string => {
  return base64.split(',')[1] || base64;
};

export const analyzeUIScreenshot = async (base64Image: string): Promise<{ 
  tokens: DesignTokens, 
  spec: string, 
  rules: string,
  projectFiles: Record<string, string> 
}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: getMimeType(base64Image),
              data: getBase64Data(base64Image)
            }
          },
          {
            text: `You are a Senior Full-Stack AI Engineer specializing in the "pageai-pro-vibe-coding-starter" architecture.
            
            Based on this UI screenshot, generate a complete, production-ready AI SaaS boilerplate.
            
            CRITICAL FILES TO GENERATE:
            1. CLOUD & DEPLOYMENT:
               - vercel.json: Must include security headers, rewrites, and optimization for Next.js 15 Edge Runtime.
               - .env.example: Include GEMINI_API_KEY, NEXT_PUBLIC_APP_URL, and any other detected service keys.
            
            2. AI CORE (Google GenAI SDK):
               - lib/gemini.ts: Export a configured 'ai' instance using 'new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })'.
               - app/api/chat/route.ts: A Next.js 15 Route Handler using 'ai.models.generateContentStream'. 
               - Include a custom System Instruction optimized for this specific UI's purpose (e.g., if it's a finance app, the AI is a financial advisor).
            
            3. DESIGN SYSTEM:
               - data/config/colors.js: Exact hex codes from pixels mapped to Tailwind-ready objects.
               - data/config/metadata.js: Site title, description, and OG metadata extracted from the UI.
               - tailwind.config.js: Extended configuration with extracted tokens.
            
            4. AI GOVERNANCE:
               - .cursor/rules/ai-integration.mdc: Precise instructions for AI agents on how to expand the intelligence layer.

            Return a strictly valid JSON object following the responseSchema.`
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 32768 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tokens: { type: Type.OBJECT, properties: { 
            colors: { type: Type.OBJECT, properties: { primary: {type: Type.STRING}, background: {type: Type.STRING}, surface: {type: Type.STRING}, text: {type: Type.STRING}, accent: {type: Type.STRING} }, required: ["primary", "background", "surface", "text", "accent"] },
            radii: { type: Type.OBJECT, properties: { card: {type: Type.STRING}, button: {type: Type.STRING}, input: {type: Type.STRING} }, required: ["card", "button", "input"] },
            typography: { type: Type.OBJECT, properties: { fontFamily: {type: Type.STRING}, baseSize: {type: Type.STRING}, headingWeight: {type: Type.STRING} }, required: ["fontFamily", "baseSize", "headingWeight"] },
            spacing: { type: Type.OBJECT, properties: { base: {type: Type.STRING}, gap: {type: Type.STRING} }, required: ["base", "gap"] }
          }, required: ["colors", "radii", "typography", "spacing"]},
          spec: { type: Type.STRING },
          rules: { type: Type.STRING },
          projectFiles: { type: Type.OBJECT, additionalProperties: { type: Type.STRING } }
        },
        required: ["tokens", "spec", "rules", "projectFiles"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const chatWithUI = async (prompt: string, base64Image?: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [{ text: prompt }];
  if (base64Image) {
    parts.push({
      inlineData: {
        mimeType: getMimeType(base64Image),
        data: getBase64Data(base64Image)
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: [{ parts }],
    config: {
      systemInstruction: "You are the VisionDoc Lead Architect. You help developers build AI-native SaaS by explaining the integration of Gemini 2.0 with Next.js 15 and Vercel.",
      thinkingConfig: { thinkingBudget: 8192 }
    }
  });

  return response.text || "System sync failed. Please retry.";
};

export const editUIWithPrompt = async (base64Image: string, editPrompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: getBase64Data(base64Image), mimeType: getMimeType(base64Image) } },
        { text: `Refactor this UI for an AI-first SaaS product. Focus on accessibility and modern aesthetics. Change: ${editPrompt}.` },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("UI Refactoring failed.");
};
