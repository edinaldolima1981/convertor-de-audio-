export interface RoadmapPhase {
  id: string;
  number: number;
  title: string;
  description: string;
  duration: string;
  tasks: string[];
  challenges: string[];
  mitigations: string[];
  codeSnippet?: string;
  codeTitle?: string;
  language?: string;
}

export interface TechnicalTopic {
  id: string;
  title: string;
  summary: string;
  details: string[];
  codeSnippet: string;
  codeTitle: string;
  language: string;
}

export interface LegalRiskItem {
  id: string;
  title: string;
  category: "YouTube ToS" | "Copyright Law" | "Fair Use" | "DMCA";
  riskLevel: "Critical" | "High" | "Medium" | "Low";
  legalReference: string;
  impactDescription: string;
  mitigationStrategy: string;
}

export interface EthicsQuestion {
  id: string;
  question: string;
  description: string;
  weight: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: Date;
}

export interface ConverterConfig {
  format: "mp3" | "wav";
  bitrate: 128 | 192 | 256 | 320;
  sampleRate: 44100 | 48000;
  channels: 1 | 2; // Mono or Stereo
  volumeBoost: number; // 1.0 is default
}
