export interface AnalyticsConfig {
  targetHours: number;
  targetSessions: number;
  targetVocab: number;
  targetConsistencyDays: number;
  coverageThresholdHours: number;
  gapCaps: { gap: number; maxConfidence: number }[];
  trendThreshold: number; // e.g. 0.5 for IELTS
}

export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  targetHours: 200,
  targetSessions: 60,
  targetVocab: 500,
  targetConsistencyDays: 20,
  coverageThresholdHours: 5,
  gapCaps: [
    { gap: 2.0, maxConfidence: 25 },
    { gap: 1.5, maxConfidence: 40 },
    { gap: 1.0, maxConfidence: 60 },
    { gap: 0.5, maxConfidence: 80 },
    { gap: 0.25, maxConfidence: 90 },
    { gap: -Infinity, maxConfidence: 95 },
  ],
  trendThreshold: 0.5,
};

export interface AnalyticsParams {
  totalStudyHours: number;
  sessionCount: number;
  vocabWords: number;
  skillHours: number[];
  recentActiveDays: number; // active days in last 14 days

  mockScoresChronological: number[]; // e.g. [5.0, 5.5, 6.0]
  latestSkillScores: number[]; // The skill bands/scores from the most recent mock
  
  targetScore: number | null;
  config?: Partial<AnalyticsConfig>;
}

export function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function calculateTrackerAnalytics(params: AnalyticsParams) {
  const conf = { ...DEFAULT_ANALYTICS_CONFIG, ...params.config };

  // 1. Preparation Progress (Effort)
  const compA_hours    = Math.min((params.totalStudyHours / conf.targetHours) * 100, 100);
  const compB_sessions = Math.min((params.sessionCount / conf.targetSessions) * 100, 100);
  const compC_vocab    = Math.min((params.vocabWords / conf.targetVocab) * 100, 100);
  const compD_consist  = Math.min((params.sessionCount / conf.targetConsistencyDays) * 100, 100);
  
  const skillsCovered = params.skillHours.filter(h => h >= conf.coverageThresholdHours).length;
  const numSkills = Math.max(1, params.skillHours.length);
  const compE_coverage = (skillsCovered / numSkills) * 100;

  const prepScore = Math.round(
    compA_hours * 0.40 + compB_sessions * 0.20 + compC_vocab * 0.15 + compD_consist * 0.15 + compE_coverage * 0.10,
  );

  const prepBreakdown = {
    "Study Hours (40%)": Math.round(compA_hours),
    "Sessions (20%)": Math.round(compB_sessions),
    "Vocabulary (15%)": Math.round(compC_vocab),
    "Consistency (15%)": Math.round(compD_consist),
    "Skill Coverage (10%)": Math.round(compE_coverage),
  };

  // 2. Performance & Confidence Signal
  let confScore: number | null = null;
  let confBreakdown: Record<string, number> = {};

  const bands = params.mockScoresChronological;
  const hasMocks = bands.length > 0;
  const latestOverall = hasMocks ? bands[bands.length - 1] : null;

  // Average of last 3 (or fewer if not enough)
  const recent3Bands = bands.slice(-3);
  const avg3Overall = recent3Bands.length > 0 ? recent3Bands.reduce((a, b) => a + b, 0) / recent3Bands.length : null;

  if (params.targetScore != null && bands.length >= 2) {
    // 1. Proximity
    const avgBand = avg3Overall ?? 0;
    const prox = Math.min((avgBand / params.targetScore) * 100, 100);

    // 2. Trend (linear regression)
    let slope = 0;
    const n = bands.length;
    const xm = (n - 1) / 2;
    const ym = bands.reduce((a, b) => a + b, 0) / n;
    const num = bands.reduce((s, y, i) => s + (i - xm) * (y - ym), 0);
    const den = bands.reduce((s, _, i) => s + (i - xm) ** 2, 0);
    slope = den > 0 ? num / den : 0;
    const trend = Math.max(0, Math.min((slope / conf.trendThreshold) * 100, 100));

    // 3. Skill balance
    const validSkills = params.latestSkillScores.filter((v) => v != null && !isNaN(v));
    const balPenalty = validSkills.length >= 2 ? stddev(validSkills) : 0;
    const balance = Math.max(0, (1 - balPenalty / 2)) * 100;

    // 4. Recent activity
    const activity = Math.min((params.recentActiveDays / 10) * 100, 100);

    const rawScore = prox * 0.50 + trend * 0.20 + balance * 0.15 + activity * 0.15;

    // Gap cap
    const currentOverall = latestOverall ?? avgBand;
    const gap = Math.max(0, params.targetScore - currentOverall);
    
    let confidenceCap = 100;
    for (const capConfig of conf.gapCaps) {
      if (gap >= capConfig.gap) {
        confidenceCap = capConfig.maxConfidence;
        break;
      }
    }

    confScore = Math.round(Math.min(rawScore, confidenceCap));
    confBreakdown = {
      "Mock vs Target (50%)": Math.round(prox),
      "Score Trend (20%)": Math.round(trend),
      "Skill Balance (15%)": Math.round(balance),
      "Recent Activity (15%)": Math.round(activity),
      "Confidence Cap Applied": confidenceCap,
    };
  }

  return {
    prepScore,
    prepBreakdown,
    confScore,
    confBreakdown,
    latestOverall,
    avg3Overall,
  };
}
