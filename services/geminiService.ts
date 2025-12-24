
import { GoogleGenAI, Type } from "@google/genai";
import { DesignTokens } from "../types";

const getMimeType = (base64: string): string => {
  const match = base64.match(/^data:(image\/[a-z]+);base64,/);
  return match ? match[1] : 'image/png';
};

const getBase64Data = (base64: string): string => {
  return base64.split(',')[1] || base64;
};

// Contenu statique du starter pour assurer l'interopérabilité
const STARTER_UTILS_CODE = `import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertToRgba({ color, opacity }: { color: string; opacity: number; }): string {
  if (!color) return \`rgba(177, 177, 177, \${opacity})\`;
  // Logic from pageai-pro-starter...
  return color; 
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
            text: `You are the Supreme Architect for VisionDoc AI.
            
            OBJECTIVE: Generate a complete Next.js 15 project using the "pageai-pro-vibe-coding-starter" structure.
            
            1. RECONSTRUCT THE UI: Use strictly components from @/components/landing (LandingHeader, LandingPrimaryImageCtaSection, LandingSocialProof, LandingFeatureList, LandingBentoGridSection, LandingFooter).
            
            2. DESIGN TOKENS: Extract primary/secondary colors and map them to the 5-variant scale (lighter, light, main, dark, darker) for data/config/colors.js.
            
            3. AGENT MISSION: Create a tactical guide (AGENT_MISSION.md) that tells an AI agent (Cursor/Windsurf) exactly how to use mcp__ide__getDiagnostics and Playwright to verify the UI.
            
            4. PROJECT FILES TO GENERATE:
               - app/page.tsx (The main reconstructed landing)
               - data/config/colors.js (Full semantic palette)
               - data/config/metadata.js (Extracted from UI)
               - app/seo.tsx (Using genPageMetadata utility)
               - .cursor/rules/ui-components.mdc
               - lib/utils.ts (Use the convertToRgba and cn utilities)
            
            Return a strictly valid JSON.`
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
  
  // Inject starter infrastructure
  filesRecord['lib/utils.ts'] = STARTER_UTILS_CODE;
  
  if (Array.isArray(parsed.projectFiles)) {
    parsed.projectFiles.forEach((file: { path: string, content: string }) => {
      filesRecord[file.path] = file.content;
    });
  }

  filesRecord['MASTER_SPEC.md'] = parsed.spec;
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
      systemInstruction: "You are the VisionDoc Architect. You strictly follow the pageai-pro-vibe-coding-starter documentation for all code suggestions.",
      thinkingConfig: { thinkingBudget: 8192 }
    }
  });
  return response.text || "Offline.";
};
