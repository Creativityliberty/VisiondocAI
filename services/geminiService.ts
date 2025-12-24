
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
            MISSION : Transformer cette capture d'écran en un SaaS complet, prêt pour VERCEL et GITHUB.
            
            1. ANALYSE PROFONDE : Détecte les composants (Navbar, Hero, Bento, Stats, Testimonials, Footer).
            2. LOGIQUE MÉTIER : Déduis le but du SaaS (Fintech, EdTech, Tool, etc.) et prépare la structure de données.
            3. DÉPLOIEMENT : Génère un guide 'FOUNDRY_MANIFESTO.md' incluant :
               - Commandes de déploiement Vercel.
               - Workflow GitHub Actions pour le CI/CD.
               - Instructions pour lier le domaine.
            4. STRUCTURE PROJET :
               - 'app/layout.tsx' & 'app/page.tsx' (Next.js 15 App Router)
               - 'components/foundry-ui/' (Composants reconstruits avec Tailwind)
               - 'data/config.ts' (Metadata et Tokens extraits)
               - '.cursor/rules/foundry.mdc' (Instructions pour l'IA dev)
            
            Réponds EXCLUSIVEMENT en JSON.`
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
