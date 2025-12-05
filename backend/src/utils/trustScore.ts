// EMA-based trust score calculation
export function calculateTrustScore(
  oldScore: number,
  latestMetric: number,
  alpha: number = 0.3
): number {
  return alpha * latestMetric + (1 - alpha) * oldScore;
}

export function computeQualityScore(qualityData: any): number {
  // Simple scoring based on quality metrics
  let score = 0.5; // base
  
  if (qualityData.moisture !== undefined) {
    // Optimal moisture: 60-70%
    const moisture = qualityData.moisture;
    if (moisture >= 60 && moisture <= 70) score += 0.1;
    else if (moisture < 50 || moisture > 80) score -= 0.1;
  }
  
  if (qualityData.freshness !== undefined) {
    // Higher freshness = better
    score += qualityData.freshness * 0.2;
  }
  
  if (qualityData.onTime !== undefined) {
    score += qualityData.onTime * 0.1;
  }
  
  return Math.max(0, Math.min(1, score));
}


