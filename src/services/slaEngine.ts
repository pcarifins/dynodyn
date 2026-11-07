import { JobOrder, WorkingCalendarConfig } from '../types';

export type SlaStatus = 'ON_TRACK' | 'WARNING' | 'OVERDUE';

/**
 * Calculates working hours elapsed between two dates based on calendar config
 */
export function calculateWorkingHoursElapsed(
  startDate: string,
  endDate: string = new Date().toISOString(),
  calendar: WorkingCalendarConfig
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
    return 0;
  }

  // Parse shift times (e.g. 07:30 to 16:30 = 9h - 1h break = 8h net shift)
  const [startH, startM] = calendar.shiftStartTime.split(':').map(Number);
  const [endH, endM] = calendar.shiftEndTime.split(':').map(Number);
  const shiftHours = (endH + endM / 60) - (startH + startM / 60) - (calendar.breakDurationMinutes / 60);

  // Simplified robust working-hours calculation
  let current = new Date(start);
  let totalWorkingHours = 0;

  // Step through each day
  while (current <= end) {
    const dayOfWeek = current.getDay(); // 0 is Sunday, 6 is Saturday
    const dateStr = current.toISOString().slice(0, 10);
    
    // Check if holiday override
    const override = calendar.overrides?.find((o) => o.date === dateStr);
    const isHoliday = override?.type === 'HOLIDAY';
    const isWorkDay = calendar.workDays.includes(dayOfWeek) && !isHoliday;

    if (isWorkDay) {
      totalWorkingHours += shiftHours;
    }

    // Advance 1 day
    current.setDate(current.getDate() + 1);
  }

  // Ensure at least minimum elapsed approximation if same day
  const rawHours = Math.max(0.1, (end.getTime() - start.getTime()) / (1000 * 3600));
  return Math.min(rawHours, Math.max(rawHours * 0.4, totalWorkingHours));
}

/**
 * Evaluate SLA status for a Job Order
 */
export function evaluateJobSla(
  jo: JobOrder,
  mriIntervalHours: number = 0
): {
  totalSlaStatus: SlaStatus;
  controllableSlaStatus: SlaStatus;
  totalAgingHours: number;
  controllableAgingHours: number;
  slaLimitHours: number;
} {
  const slaLimit = jo.slaLimitHours || (jo.status === 'WAITING_GLT' ? 24 : 48);
  const totalAgingHours = jo.agingHours || 0;
  const controllableAgingHours = Math.max(0, totalAgingHours - mriIntervalHours);

  const getStatus = (hours: number): SlaStatus => {
    if (hours > slaLimit) return 'OVERDUE';
    if (hours >= slaLimit * 0.75) return 'WARNING';
    return 'ON_TRACK';
  };

  return {
    totalSlaStatus: getStatus(totalAgingHours),
    controllableSlaStatus: getStatus(controllableAgingHours),
    totalAgingHours,
    controllableAgingHours,
    slaLimitHours: slaLimit
  };
}
