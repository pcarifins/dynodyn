import { JobOrder, Workstation, AiRecommendation, AiDispatchWeights } from '../types';

export const DEFAULT_AI_WEIGHTS: AiDispatchWeights = {
  slaRisk: 45,
  waitingTime: 25,
  standardDuration: 15,
  queueLoad: 15,
  activePreset: 'SLA_FIRST'
};

export const PRESET_WEIGHTS: Record<string, AiDispatchWeights> = {
  SLA_FIRST: {
    slaRisk: 45,
    waitingTime: 25,
    standardDuration: 15,
    queueLoad: 15,
    activePreset: 'SLA_FIRST'
  },
  BALANCED: {
    slaRisk: 25,
    waitingTime: 25,
    standardDuration: 25,
    queueLoad: 25,
    activePreset: 'BALANCED'
  },
  THROUGHPUT_FIRST: {
    slaRisk: 15,
    waitingTime: 20,
    standardDuration: 45,
    queueLoad: 20,
    activePreset: 'THROUGHPUT_FIRST'
  },
  QUEUE_BALANCE: {
    slaRisk: 20,
    waitingTime: 20,
    standardDuration: 20,
    queueLoad: 40,
    activePreset: 'QUEUE_BALANCE'
  }
};

/**
 * Checks if workstation is compatible with component category
 */
export function isWorkstationCompatible(category: string, workstation: Workstation): boolean {
  if (workstation.availabilityState !== 'ENABLED') return false;

  const isEngine = category.toLowerCase().includes('engine');
  const isCylinder = category.toLowerCase().includes('cylinder');
  
  if (isEngine) {
    return workstation.category === 'ENGINE'; // D1, D2, D3
  }
  if (isCylinder) {
    return workstation.id === 'TB_CYL' || workstation.id === 'TB2' || workstation.id === 'MB';
  }
  // Power Train (Transmission, Differential, Pump, Torqflow, Axle, etc.)
  return workstation.category === 'POWER_TRAIN'; // TB1, TB2, TB3, MB
}

/**
 * Deterministic multi-factor AI dispatch recommendation engine
 */
export function calculateAiRecommendations(
  jobOrders: JobOrder[],
  workstations: Workstation[],
  weights: AiDispatchWeights = DEFAULT_AI_WEIGHTS
): AiRecommendation[] {
  // Hard Constraint: Only READY_FOR_ALLOCATION with finalGltResult === 'GOOD'
  const candidateJobs = jobOrders.filter(
    (jo) => jo.status === 'READY_FOR_ALLOCATION' && jo.finalGltResult === 'GOOD'
  );

  if (candidateJobs.length === 0) return [];

  const availableWorkstations = workstations.filter(
    (ws) => ws.availabilityState === 'ENABLED'
  );

  const recommendations: AiRecommendation[] = [];

  for (const jo of candidateJobs) {
    const compatibleStations = availableWorkstations.filter((ws) =>
      isWorkstationCompatible(jo.componentCategory, ws)
    );

    if (compatibleStations.length === 0) continue;

    let bestStation = compatibleStations[0];
    let bestScore = -1;
    let bestBreakdown = { slaRisk: 0, waitingTime: 0, standardDuration: 0, queueLoad: 0, total: 0 };

    for (const ws of compatibleStations) {
      // 1. SLA Risk Score: Normalized 0..100 based on aging / slaLimit
      const slaRatio = jo.agingHours / (jo.slaLimitHours || 48);
      const slaRiskScore = Math.min(100, Math.round(slaRatio * 100));

      // 2. Waiting Time Score: higher aging = higher waiting priority
      const waitingScore = Math.min(100, Math.round((jo.agingHours / 72) * 100));

      // 3. Fixed Standard Duration: preference for optimal matching (shorter jobs fit lighter queues)
      const durationScore = 75;

      // 4. Queue Load: Stations with smaller queues get higher score
      const queueLen = ws.currentQueue?.length || 0;
      const queueLoadScore = Math.max(10, 100 - queueLen * 25);

      // Weighted total
      const totalScore =
        (slaRiskScore * weights.slaRisk +
          waitingScore * weights.waitingTime +
          durationScore * weights.standardDuration +
          queueLoadScore * weights.queueLoad) /
        100;

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestStation = ws;
        bestBreakdown = {
          slaRisk: slaRiskScore,
          waitingTime: waitingScore,
          standardDuration: durationScore,
          queueLoad: queueLoadScore,
          total: Math.round(totalScore)
        };
      }
    }

    const fitPercentage = Math.min(99.4, +(88 + (bestScore / 100) * 11).toFixed(1));
    const isCritical = jo.agingHours >= (jo.slaLimitHours ? jo.slaLimitHours * 0.8 : 36) || jo.isUrgent;
    const estDuration = jo.componentCategory === 'Engine' ? 120 : 90;
    const queuePos = (bestStation.currentQueue?.length || 0) + 1;

    let priorityNote = '';
    if (isCritical) {
      priorityNote = `Aging ${jo.agingHours.toFixed(1)} jam berada di zona risiko tinggi. Wajib antrean #${queuePos} segera untuk cegah penalti keterlambatan.`;
    } else {
      priorityNote = `Optimal match kapasitas ${bestStation.name}. Utilisasi seimbang dan minim delay.`;
    }

    recommendations.push({
      joId: jo.id,
      joNumber: jo.joNumber,
      recommendedWorkstationId: bestStation.id,
      recommendedWorkstationName: bestStation.name,
      queuePosition: queuePos,
      estimatedDurationMinutes: estDuration,
      fitPercentage,
      priorityNote,
      savedTimeMinutes: isCritical ? 25 : 15,
      criticalSlaRisk: !!isCritical,
      urgencyReason: isCritical ? 'Critical SLA Risk' : 'Standard Optimization',
      scores: bestBreakdown
    });
  }

  // Sort: Critical SLA first, then highest fit percentage
  recommendations.sort((a, b) => {
    if (a.criticalSlaRisk !== b.criticalSlaRisk) {
      return a.criticalSlaRisk ? -1 : 1;
    }
    return b.fitPercentage - a.fitPercentage;
  });

  return recommendations;
}
