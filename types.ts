
export interface DesignTokens {
  colors: {
    primary: string;
    background: string;
    surface: string;
    text: string;
    accent: string;
  };
  radii: {
    card: string;
    button: string;
    input: string;
  };
  typography: {
    fontFamily: string;
    baseSize: string;
    headingWeight: string;
  };
  spacing: {
    base: string;
    gap: string;
  };
}

export interface AnalysisResult {
  tokens: DesignTokens;
  markdownSpec: string;
  cursorRules: string;
  projectFiles: Record<string, string>;
  confidence: number;
}

export enum AppStep {
  UPLOAD = 'upload',
  SCANNING = 'scanning',
  RESULT = 'result'
}

export enum ResultTab {
  SOURCE = 'source',
  RULES = 'rules',
  AICORE = 'ai-core',
  DEPLOY = 'deploy',
  SPEC = 'spec',
  PREVIEW = 'preview',
  CHAT = 'chat',
  EDIT = 'edit'
}
