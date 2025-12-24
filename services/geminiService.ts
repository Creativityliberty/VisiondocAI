
import { GoogleGenAI, Type } from "@google/genai";
import { DesignTokens } from "../types";

const getMimeType = (base64: string): string => {
  const match = base64.match(/^data:(image\/[a-z]+);base64,/);
  return match ? match[1] : 'image/png';
};

const getBase64Data = (base64: string): string => {
  return base64.split(',')[1] || base64;
};

// Injection du code utilitaire réel du starter pour garantir que l'export fonctionne
const STARTER_UTILS_CODE = `import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertToRgba({ color, opacity }: { color: string; opacity: number; }): string {
  if (!color) return \`rgba(177, 177, 177, \${opacity})\`;
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return \`rgba(\${r}, \${g}, \${b}, \${opacity})\`;
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
            text: `Tu es l'ingénieur système de VisionDoc AI. Ta mission est d'extraire TOUS les détails de cette image UI avec une précision chirurgicale.
            
            1. RECONSTRUCTION : Tu dois mapper l'interface sur les composants du starter pack (LandingHeader, LandingFooter, LandingPrimaryImageCtaSection, etc.).
            
            2. TOKENS : Identifie la couleur primaire (hex), le radius exact (ex: 40px), la typographie (nom de fonte le plus proche) et les espacements.
            
            3. AGENT MISSION : Produit un fichier AGENT_MISSION.md qui est un plan de vol pour un agent IA (Cursor). Il doit expliquer comment vérifier chaque composant avec mcp__ide__getDiagnostics.
            
            4. STRUCTURE PROJET : Génère les fichiers suivants dans 'projectFiles' :
               - 'data/config/colors.js' (La palette sémantique complète extraite)
               - 'data/config/metadata.js' (Titres et descriptions extraits)
               - 'app/page.tsx' (La page assemblée avec les composants landing)
               - '.cursor/rules/ui-system.mdc' (Règles spécifiques au design détecté)
               - 'tailwind.config.ts' (Avec les tokens injectés)
            
            Retourne un JSON valide.`
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
              radii: { type: Type.OBJECT, properties: { card: {type: Type.STRING}, button: {type: Type.STRING} }, required: ["card", "button"] },
              typography: { type: Type.OBJECT, properties: { fontFamily: {type: Type.STRING}, baseSize: {type: Type.STRING} }, required: ["fontFamily", "baseSize"] },
              spacing: { type: Type.OBJECT, properties: { gap: {type: Type.STRING} }, required: ["gap"] }
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
  
  // On injecte les utilitaires de base systématiquement
  filesRecord['lib/utils.ts'] = STARTER_UTILS_CODE;
  
  if (Array.isArray(parsed.projectFiles)) {
    parsed.projectFiles.forEach((file: { path: string, content: string }) => {
      filesRecord[file.path] = file.content;
    });
  }

  // On s'assure que les specs et rules sont là
  filesRecord['AGENT_MISSION.md'] = parsed.spec;
  filesRecord['.cursor/rules/ui-system.mdc'] = parsed.rules;

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
      systemInstruction: "Tu es l'Expert VisionDoc. Tu aides à implémenter le design extrait dans le starter pack pageai-pro.",
      thinkingConfig: { thinkingBudget: 8192 }
    }
  });
  return response.text || "Analyse en cours...";
};
