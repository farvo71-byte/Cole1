export interface ActionItem {
  area: string;
  description: string;
  impactRating: "High" | "Medium" | "Low" | string;
  recommendation: string;
}

export interface KeywordMetric {
  text: string;
  count: number;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  sentimentRatio: number; // -1 to 1
}

export interface AnalyzedReview {
  id: string;
  text: string;
  sentiment: "positive" | "neutral" | "negative";
  score: number; // -1 to 1
  category: string;
  date: string; // YYYY-MM-DD
}

export interface SentimentAnalysisReport {
  summary: string;
  actionItems: ActionItem[];
  praises: KeywordMetric[];
  complaints: KeywordMetric[];
  categoryBreakdown: CategoryBreakdown[];
  analyzedReviews: AnalyzedReview[];
}

export interface AnalysisSession {
  id: string;
  title: string;
  timestamp: string;
  report: SentimentAnalysisReport;
  rawInputSize: number;
  isPreset: boolean;
  presetKey?: string;
}
