export type TerminalRole = 'SPV_QC' | 'QUALITY_MASTER' | 'GLT_OPERATOR' | 'PERF_OPERATOR';

export type TerminalId = 
  | 'SPV'
  | 'QM'
  | 'GLT-E'
  | 'GLT-PT'
  | 'D1'
  | 'D2'
  | 'D3'
  | 'TB_CYL'
  | 'TB1'
  | 'TB2'
  | 'TB3'
  | 'MB';

export interface TerminalConfig {
  id: TerminalId;
  name: string;
  code: string;
  group: 'GOVERNANCE' | 'GLT' | 'ENGINE' | 'POWER_TRAIN' | 'CYLINDER';
  role: TerminalRole;
  description: string;
  iconType: string;
  lineType?: 'Dyno' | 'Bench';
}

export type ComponentCategory =
  | 'Engine'
  | 'Power Train'
  | 'Cylinder'
  | 'Pump Front/Rear'
  | 'Motor'
  | 'Final Drive GD'
  | 'Final Drive PC-DZ'
  | 'Differential'
  | 'Axle & Final Drive HD'
  | 'Front Brake & Front Axle'
  | 'Power Module All Series'
  | 'Transmission GD'
  | 'Transmission WA'
  | 'Torqflow'
  | 'PTO';

export type JobStatus =
  | 'WAITING_GLT'
  | 'IN_GLT'
  | 'READY_FOR_ALLOCATION'
  | 'ALLOCATED'
  | 'IN_PERFORMANCE'
  | 'DONE'
  | 'CANCELLED';

export type TestResult = 'GOOD' | 'NOT_GOOD' | 'ABORTED';

export type WorkstationOperationalState = 'AVAILABLE' | 'RESERVED' | 'TESTING' | 'ACTIVE_TESTING';
export type WorkstationAvailabilityState = 'ENABLED' | 'BREAKDOWN' | 'MAINTENANCE';

export interface Workstation {
  id: string; // 'D1', 'D2', 'D3', 'TB1', 'TB2', 'TB3', 'MB', 'TB_CYL'
  name: string; // 'Dyno 1', 'Bench 1', etc.
  type: 'Dyno' | 'Bench';
  category: 'ENGINE' | 'POWER_TRAIN' | 'CYLINDER';
  operationalState: WorkstationOperationalState;
  availabilityState: WorkstationAvailabilityState;
  breakdownReason?: string;
  activeJoId?: string;
  activeAttemptId?: string;
  currentQueue: string[]; // array of joIds
  currentLoadPercent: number;
}

export interface ChecksheetParameter {
  id: string;
  name: string;
  group: string;
  description?: string;
  measurementType: 
    | 'NUMERIC_RANGE'
    | 'NOMINAL_TOLERANCE'
    | 'EXACT_VALUE'
    | 'BOOLEAN_GOOD_NG'
    | 'PASS_FAIL'
    | 'PRESSURE_DROP'
    | 'FILL_TIME_PRESSURE'
    | 'QUALITATIVE';
  unit?: string;
  minVal?: number;
  maxVal?: number;
  nominalVal?: number;
  tolerance?: number;
  exactVal?: number;
  stdDisplay: string; // e.g. "Std: 85 – 100 kg/cm²" or "Maks: ≤ 8 kg/cm²"
  isMandatory: boolean;
  allowNA?: boolean;
  requiresRemark?: boolean;
  requiresPhoto?: boolean;
  order: number;
}

export interface ChecksheetTemplate {
  id: string;
  componentCategory: ComponentCategory;
  componentModel?: string; // specific override or undefined for base
  version: number;
  publishedAt: string;
  isPublished: boolean;
  fixedStandardDurationMinutes: number;
  slaTargetHours: number;
  groups: {
    name: string;
    order: number;
    parameters: ChecksheetParameter[];
  }[];
}

export interface ParameterMeasurement {
  parameterId: string;
  parameterName: string;
  group: string;
  value: string | number | boolean;
  unit?: string;
  isGood: boolean;
  isNA?: boolean;
  remark?: string;
}

export interface TestingAttempt {
  id: string;
  joId: string;
  cycleId: string;
  stage: 'GLT' | 'PERFORMANCE';
  attemptNumber: number;
  workstationId?: string;
  terminalId: string;
  startedAt: string;
  endedAt?: string;
  result?: TestResult;
  checksheetVersionId: string;
  checksheetSnapshot: ChecksheetTemplate;
  standardDurationMinutes: number;
  measurements: ParameterMeasurement[];
  overallEvaluation?: 'GOOD' | 'NOT_GOOD';
  remarks?: string;
  evidencePhotos: string[];
  abortReason?: string;
  abortedByRole?: string;
  isReinspectionOrRetest?: boolean;
}

export interface MriRecord {
  id: string;
  mriType: 'MRI-A' | 'MRI-B';
  joId: string;
  attemptId: string;
  createdAt: string;
  componentCategory: string;
  componentModel: string;
  unitModel: string;
  assembler: string;
  failedParameters: {
    parameterId: string;
    parameterName: string;
    actualValue: string | number;
    standard: string;
    unit?: string;
    symptom?: string;
    defectDescription?: string;
  }[];
  generalCorrectiveAction?: string;
  correctiveActionCompletedAt?: string;
  status: 'OPEN' | 'RESOLVED';
}

export interface JobOrder {
  id: string;
  joNumber: string;
  componentCategory: ComponentCategory;
  componentModel: string;
  unitModel: string;
  assembler: string;
  assemblyDate: string;
  receivedAt: string;
  receivingTerminalId: string;
  status: JobStatus;
  currentCycleId: string;
  
  // GLT State
  finalGltResult?: 'GOOD' | 'NOT_GOOD';
  gltCompletedAt?: string;
  gltLeadtimeDisplay?: string;
  
  // Performance Allocation & Queue State
  approvedWorkstationId?: string;
  allocatedAt?: string;
  queueSequence?: number;
  isUrgent?: boolean;
  agingHours: number;
  slaLimitHours: number;
  
  // Performance Testing State
  finalPerformanceResult?: 'GOOD' | 'NOT_GOOD';
  performanceStartedAt?: string;
  performanceCompletedAt?: string;
  
  // MRI References
  hasMriA: boolean;
  hasMriB: boolean;
  latestMriAId?: string;
  latestMriBId?: string;
  
  // Active Attempt
  activeAttemptId?: string;
  
  // Certificate
  certificateId?: string;
  certificateGeneratedAt?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface AiRecommendation {
  joId: string;
  joNumber: string;
  recommendedWorkstationId: string;
  recommendedWorkstationName: string;
  queuePosition: number;
  estimatedDurationMinutes: number;
  fitPercentage: number;
  priorityNote: string;
  savedTimeMinutes: number;
  criticalSlaRisk: boolean;
  urgencyReason: string;
  scores: {
    slaRisk: number;
    waitingTime: number;
    standardDuration: number;
    queueLoad: number;
    total: number;
  };
}

export interface AiDispatchWeights {
  slaRisk: number;
  waitingTime: number;
  standardDuration: number;
  queueLoad: number;
  activePreset: 'SLA_FIRST' | 'BALANCED' | 'THROUGHPUT_FIRST' | 'QUEUE_BALANCE' | 'CUSTOM';
}

export interface WorkingCalendarConfig {
  timezone: string;
  workDays: number[]; // [1, 2, 3, 4, 5] = Monday to Friday
  shiftStartTime: string; // "07:30"
  shiftEndTime: string; // "16:30"
  breakDurationMinutes: number; // 60
  overrides: {
    date: string; // YYYY-MM-DD
    type: 'HOLIDAY' | 'SPECIAL_SHIFT';
    description?: string;
    workingHours?: number;
  }[];
}

export interface TestCertificate {
  id: string;
  joId: string;
  joNumber: string;
  attemptId: string;
  certificateNumber: string;
  issuedAt: string;
  componentCategory: string;
  componentModel: string;
  unitModel: string;
  assembler: string;
  assemblyDate: string;
  workstationName: string;
  testDate: string;
  finalResult: 'GOOD';
  checksheetVersion: number;
  totalChecks: number;
  measurementsSummary: {
    parameterName: string;
    standard: string;
    actualValue: string | number;
    status: 'PASS';
  }[];
  isValid: boolean;
  pdfDataUri?: string;
}

export interface AuditEvent {
  id: string;
  action: string;
  targetEntity: string;
  targetId: string;
  terminalId: string;
  role: string;
  timestamp: string;
  details?: Record<string, unknown>;
  reason?: string;
}
