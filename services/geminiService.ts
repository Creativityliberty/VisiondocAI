
import { GoogleGenAI, Type } from "@google/genai";
import { DesignTokens } from "../types";

const getMimeType = (base64: string): string => {
  const match = base64.match(/^data:(image\/[a-z]+);base64,/);
  return match ? match[1] : 'image/png';
};

const getBase64Data = (base64: string): string => {
  return base64.split(',')[1] || base64;
};

const FOUNDRY_CORE_UTILS = `import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Nümtema Foundry Core Utility
 * Injects extracted design tokens into CSS variables
 */
export function foundryTheme(tokens: any) {
  if (typeof document === 'undefined') return tokens;
  const root = document.documentElement;
  Object.entries(tokens.colors || {}).forEach(([key, val]) => {
    root.style.setProperty(\`--foundry-\${key}\`, val as string);
  });
  return tokens;
}`;

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
            text: `Tu es l'Intelligence Suprême de Nümtema Foundry. 
            MISSION : Transformer cette capture d'écran en un SaaS complet, robuste et prêt pour le déploiement.
            
            1. ANALYSE PROFONDE : Détecte tous les composants UI et la hiérarchie.
            2. LOGIQUE SAAS : Déduis le but du projet et génère une architecture 'Next.js 15 App Router'.
            3. DÉPLOIEMENT TOTAL (CUMULÉ) :
               - Guide de déploiement VERCEL (CLI & Dashboard).
               - Configuration GITHUB (Workflow CI/CD).
               - Setup Tailwind CSS 4.
            4. LIVRABLES :
               - 'FOUNDRY_MANIFESTO.md' : La bible du projet.
               - '.cursor/rules/foundry-core.mdc' : Les règles pour l'IA.
               - 'app/layout.tsx', 'app/page.tsx' : Code source reconstruit.
               - 'components/foundry-ui/' : Librairie de composants Tailwind.
               - 'package.json' : Dépendances nécessaires.
            
            Réponds EXCLUSIVEMENT au format JSON.`
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
          tokens: { 
            type: Type.OBJECT, 
            properties: { 
              colors: { 
                type: Type.OBJECT, 
                properties: { primary: {type: Type.STRING}, background: {type: Type.STRING}, surface: {type: Type.STRING}, text: {type: Type.STRING}, accent: {type: Type.STRING} },
                required: ["primary", "background", "surface", "text", "accent"]
              },
              radii: { type: Type.OBJECT, properties: { card: {type: Type.STRING}, button: {type: Type.STRING}, input: {type: Type.STRING} }, required: ["card", "button", "input"] },
              typography: { type: Type.OBJECT, properties: { fontFamily: {type: Type.STRING}, baseSize: {type: Type.STRING}, headingWeight: {type: Type.STRING} }, required: ["fontFamily", "baseSize", "headingWeight"] },
              spacing: { type: Type.OBJECT, properties: { base: {type: Type.STRING}, gap: {type: Type.STRING} }, required: ["base", "gap"] }
            }, 
            required: ["colors", "radii", "typography", "spacing"]
          },
          spec: { type: Type.STRING },
          rules: { type: Type.STRING },
          projectFiles: { 
            type: Type.ARRAY, 
            items: {
              type: Type.OBJECT,
              properties: { path: { type: Type.STRING }, content: { type: Type.STRING } },
              required: ["path", "content"]
            }
          }
        },
        required: ["tokens", "spec", "rules", "projectFiles"]
      }
    }
  });

  const parsed = JSON.parse(response.text || "{}");
  const filesRecord: Record<string, string> = {};
  
  filesRecord['lib/foundry-utils.ts'] = FOUNDRY_CORE_UTILS;
  
  if (Array.isArray(parsed.projectFiles)) {
    parsed.projectFiles.forEach((file: { path: string, content: string }) => {
      filesRecord[file.path] = file.content;
    });
  }

  filesRecord['FOUNDRY_MANIFESTO.md'] = parsed.spec;
  filesRecord['.cursor/rules/foundry-core.mdc'] = parsed.rules;

  return { ...parsed, projectFiles: filesRecord };
};

export const chatWithUI = async (prompt: string, base64Image?: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [{ text: prompt }];
  if (base64Image) {
    parts.push({
      inlineData: { mimeType: getMimeType(base64Image), data: getBase64Data(base64Image) }
    });
  }
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: [{ parts }],
    config: {
      systemInstruction: "Tu es le Maître de Forge de Nümtema Foundry. Tu aides à déployer des SaaS basés sur les designs extraits avec Vercel, Next.js et GitHub.",
      thinkingConfig: { thinkingBudget: 8192 }
    }
  });
  return response.text || "Foundry Node Idle...";
};
