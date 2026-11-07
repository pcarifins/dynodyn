import {
  JobOrder,
  Workstation,
  TestingAttempt,
  MriRecord,
  TestCertificate,
  AuditEvent,
  ChecksheetTemplate,
  WorkingCalendarConfig,
  AiDispatchWeights,
  TerminalId
} from '../types';
import { INITIAL_JOB_ORDERS, INITIAL_WORKSTATIONS, INITIAL_WORKING_CALENDAR } from '../data/seedData';
import { INITIAL_CHECKSHEET_TEMPLATES } from '../data/checksheetTemplates';
import { DEFAULT_AI_WEIGHTS } from './aiDispatch';
import { generateTestCertificate } from './certificateGenerator';

class DataStore {
  private jobOrders: JobOrder[] = [];
  private workstations: Workstation[] = [];
  private attempts: TestingAttempt[] = [];
  private mriRecords: MriRecord[] = [];
  private certificates: Record<string, TestCertificate> = {};
  private auditEvents: AuditEvent[] = [];
  private checksheetTemplates: Record<string, ChecksheetTemplate> = {};
  private workingCalendar: WorkingCalendarConfig = INITIAL_WORKING_CALENDAR;
  private aiWeights: AiDispatchWeights = DEFAULT_AI_WEIGHTS;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const storedJOs = localStorage.getItem('dynodyn_job_orders');
      this.jobOrders = storedJOs ? JSON.parse(storedJOs) : [...INITIAL_JOB_ORDERS];

      const storedWs = localStorage.getItem('dynodyn_workstations');
      this.workstations = storedWs ? JSON.parse(storedWs) : [...INITIAL_WORKSTATIONS];

      const storedAttempts = localStorage.getItem('dynodyn_attempts');
      this.attempts = storedAttempts ? JSON.parse(storedAttempts) : [];

      const storedMris = localStorage.getItem('dynodyn_mris');
      this.mriRecords = storedMris ? JSON.parse(storedMris) : [];

      const storedCerts = localStorage.getItem('dynodyn_certificates');
      this.certificates = storedCerts ? JSON.parse(storedCerts) : {};

      const storedAudits = localStorage.getItem('dynodyn_audits');
      this.auditEvents = storedAudits ? JSON.parse(storedAudits) : [];

      const storedTpls = localStorage.getItem('dynodyn_checksheet_templates');
      this.checksheetTemplates = storedTpls ? JSON.parse(storedTpls) : { ...INITIAL_CHECKSHEET_TEMPLATES };

      const storedCal = localStorage.getItem('dynodyn_calendar');
      this.workingCalendar = storedCal ? JSON.parse(storedCal) : INITIAL_WORKING_CALENDAR;

      const storedWeights = localStorage.getItem('dynodyn_ai_weights');
      this.aiWeights = storedWeights ? JSON.parse(storedWeights) : DEFAULT_AI_WEIGHTS;
    } catch (e) {
      console.warn('Fallback to initial seed data due to storage error:', e);
      this.jobOrders = [...INITIAL_JOB_ORDERS];
      this.workstations = [...INITIAL_WORKSTATIONS];
      this.checksheetTemplates = { ...INITIAL_CHECKSHEET_TEMPLATES };
      this.workingCalendar = INITIAL_WORKING_CALENDAR;
      this.aiWeights = DEFAULT_AI_WEIGHTS;
    }
  }

  private persist() {
    try {
      localStorage.setItem('dynodyn_job_orders', JSON.stringify(this.jobOrders));
      localStorage.setItem('dynodyn_workstations', JSON.stringify(this.workstations));
      localStorage.setItem('dynodyn_attempts', JSON.stringify(this.attempts));
      localStorage.setItem('dynodyn_mris', JSON.stringify(this.mriRecords));
      localStorage.setItem('dynodyn_certificates', JSON.stringify(this.certificates));
      localStorage.setItem('dynodyn_audits', JSON.stringify(this.auditEvents));
      localStorage.setItem('dynodyn_checksheet_templates', JSON.stringify(this.checksheetTemplates));
      localStorage.setItem('dynodyn_calendar', JSON.stringify(this.workingCalendar));
      localStorage.setItem('dynodyn_ai_weights', JSON.stringify(this.aiWeights));
    } catch (e) {
      console.error('Failed to persist to localStorage', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private logAudit(action: string, targetEntity: string, targetId: string, terminalId: string, role: string, reason?: string, details?: Record<string, unknown>) {
    const event: AuditEvent = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      action,
      targetEntity,
      targetId,
      terminalId,
      role,
      timestamp: new Date().toISOString(),
      reason,
      details
    };
    this.auditEvents.unshift(event);
  }

  // --- QUERY APIS ---
  public getJobOrders(): JobOrder[] {
    return [...this.jobOrders];
  }

  public getJobOrder(idOrNumber: string): JobOrder | undefined {
    return this.jobOrders.find((j) => j.id === idOrNumber || j.joNumber === idOrNumber);
  }

  public getWorkstations(): Workstation[] {
    return [...this.workstations];
  }

  public getWorkstation(id: string): Workstation | undefined {
    return this.workstations.find((w) => w.id === id);
  }

  public getAttempts(joId?: string): TestingAttempt[] {
    if (!joId) return [...this.attempts];
    return this.attempts.filter((a) => a.joId === joId);
  }

  public getActiveAttempt(workstationId?: string, joId?: string): TestingAttempt | undefined {
    return this.attempts.find(
      (a) =>
        (!workstationId || a.workstationId === workstationId) &&
        (!joId || a.joId === joId) &&
        !a.endedAt
    );
  }

  public getMriRecords(joId?: string): MriRecord[] {
    if (!joId) return [...this.mriRecords];
    return this.mriRecords.filter((m) => m.joId === joId);
  }

  public getCertificate(joId: string): TestCertificate | undefined {
    return this.certificates[joId];
  }

  public getAuditEvents(): AuditEvent[] {
    return [...this.auditEvents];
  }

  public getChecksheetTemplates(): Record<string, ChecksheetTemplate> {
    return { ...this.checksheetTemplates };
  }

  public getChecksheetTemplate(stage: 'GLT' | 'PERF', category: string): ChecksheetTemplate | undefined {
    const key = `${stage}_${category}`;
    if (this.checksheetTemplates[key]) {
      return this.checksheetTemplates[key];
    }
    // Fallback search
    return Object.values(this.checksheetTemplates).find(
      (t) => t.componentCategory.toLowerCase() === category.toLowerCase()
    );
  }

  public getWorkingCalendar(): WorkingCalendarConfig {
    return { ...this.workingCalendar };
  }

  public getAiWeights(): AiDispatchWeights {
    return { ...this.aiWeights };
  }

  // --- MUTATION ACTIONS WITH IMMUTABILITY & AUDITING ---

  /**
   * GLT Receive New JO
   */
  public receiveJobOrder(
    data: {
      joNumber: string;
      componentCategory: any;
      componentModel: string;
      unitModel: string;
      assembler: string;
      assemblyDate: string;
    },
    terminalId: string
  ): { success: boolean; error?: string; jobOrder?: JobOrder } {
    // Check uniqueness
    if (this.jobOrders.some((j) => j.joNumber.trim() === data.joNumber.trim())) {
      return { success: false, error: `Job Order number ${data.joNumber} already exists in system.` };
    }

    const now = new Date().toISOString();
    const newJo: JobOrder = {
      id: `jo-${data.joNumber}`,
      joNumber: data.joNumber.trim(),
      componentCategory: data.componentCategory,
      componentModel: data.componentModel.trim(),
      unitModel: data.unitModel.trim(),
      assembler: data.assembler.trim(),
      assemblyDate: data.assemblyDate,
      receivedAt: now,
      receivingTerminalId: terminalId,
      status: 'WAITING_GLT',
      currentCycleId: `cycle_${Date.now()}`,
      agingHours: 0.1,
      slaLimitHours: 24,
      hasMriA: false,
      hasMriB: false,
      createdAt: now,
      updatedAt: now
    };

    this.jobOrders.unshift(newJo);
    this.logAudit('RECEIVE_JO', 'JobOrder', newJo.id, terminalId, 'GLT_OPERATOR', undefined, { ...data });
    this.persist();
    return { success: true, jobOrder: newJo };
  }

  /**
   * Start GLT Attempt
   */
  public startGltAttempt(joId: string, terminalId: string): { success: boolean; attempt?: TestingAttempt; error?: string } {
    const jo = this.getJobOrder(joId);
    if (!jo) return { success: false, error: 'Job Order not found' };

    // Check template
    const template = this.getChecksheetTemplate('GLT', jo.componentCategory) || this.getChecksheetTemplate('GLT', 'Engine');
    if (!template) return { success: false, error: 'Published checksheet template not found' };

    const attemptId = `att-glt-${jo.id}-${Date.now()}`;
    const newAttempt: TestingAttempt = {
      id: attemptId,
      joId: jo.id,
      cycleId: jo.currentCycleId,
      stage: 'GLT',
      attemptNumber: (this.getAttempts(jo.id).filter((a) => a.stage === 'GLT').length) + 1,
      terminalId,
      startedAt: new Date().toISOString(),
      checksheetVersionId: template.id,
      checksheetSnapshot: JSON.parse(JSON.stringify(template)),
      standardDurationMinutes: template.fixedStandardDurationMinutes || 30,
      measurements: [],
      evidencePhotos: []
    };

    jo.status = 'IN_GLT';
    jo.activeAttemptId = attemptId;
    jo.updatedAt = new Date().toISOString();

    this.attempts.push(newAttempt);
    this.logAudit('START_GLT', 'TestingAttempt', attemptId, terminalId, 'GLT_OPERATOR');
    this.persist();
    return { success: true, attempt: newAttempt };
  }

  /**
   * Submit GLT Attempt
   */
  public submitGltAttempt(
    attemptId: string,
    payload: {
      measurements: any[];
      overallEvaluation: 'GOOD' | 'NOT_GOOD';
      remarks?: string;
      evidencePhotos?: string[];
    },
    terminalId: string
  ): { success: boolean; error?: string } {
    const attempt = this.attempts.find((a) => a.id === attemptId);
    if (!attempt || attempt.endedAt) return { success: false, error: 'Invalid or closed attempt' };

    const jo = this.getJobOrder(attempt.joId);
    if (!jo) return { success: false, error: 'Job order not found' };

    const now = new Date().toISOString();
    attempt.endedAt = now;
    attempt.measurements = payload.measurements;
    attempt.remarks = payload.remarks;
    attempt.evidencePhotos = payload.evidencePhotos || [];
    attempt.overallEvaluation = payload.overallEvaluation;
    attempt.result = payload.overallEvaluation === 'GOOD' ? 'GOOD' : 'NOT_GOOD';

    if (payload.overallEvaluation === 'GOOD') {
      jo.status = 'READY_FOR_ALLOCATION';
      jo.finalGltResult = 'GOOD';
      jo.gltCompletedAt = now;
      const elapsedMins = Math.round((new Date(now).getTime() - new Date(attempt.startedAt).getTime()) / 60000);
      jo.gltLeadtimeDisplay = elapsedMins > 60 ? `${Math.floor(elapsedMins / 60)}h ${elapsedMins % 60}m` : `${elapsedMins}m`;
      jo.activeAttemptId = undefined;
      this.logAudit('SUBMIT_GLT_GOOD', 'TestingAttempt', attemptId, terminalId, 'GLT_OPERATOR');
    } else {
      // Create MRI-A
      const mriId = `mri-a-${jo.id}-${Date.now()}`;
      const failedParams = payload.measurements
        .filter((m) => !m.isGood)
        .map((m) => ({
          parameterId: m.parameterId,
          parameterName: m.parameterName,
          actualValue: String(m.value),
          standard: 'Conforming inspection',
          defectDescription: m.remark || 'Parameter failed inspection criteria'
        }));

      const mri: MriRecord = {
        id: mriId,
        mriType: 'MRI-A',
        joId: jo.id,
        attemptId: attempt.id,
        createdAt: now,
        componentCategory: jo.componentCategory,
        componentModel: jo.componentModel,
        unitModel: jo.unitModel,
        assembler: jo.assembler,
        failedParameters: failedParams.length > 0 ? failedParams : [{
          parameterId: 'gen_defect',
          parameterName: 'General GLT Defect',
          actualValue: 'Failed',
          standard: 'Good',
          defectDescription: payload.remarks || 'Component failed leak/integrity gate'
        }],
        status: 'OPEN'
      };

      this.mriRecords.push(mri);
      jo.hasMriA = true;
      jo.latestMriAId = mriId;
      jo.finalGltResult = 'NOT_GOOD';
      jo.status = 'WAITING_GLT'; // Returns to waiting GLT until corrective action & reinspection
      jo.activeAttemptId = undefined;
      this.logAudit('SUBMIT_GLT_NOT_GOOD', 'MriRecord', mriId, terminalId, 'GLT_OPERATOR', undefined, { failedParamsCount: failedParams.length });
    }

    jo.updatedAt = now;
    this.persist();
    return { success: true };
  }

  /**
   * Record Corrective Action for MRI
   */
  public recordCorrectiveAction(mriId: string, correctiveActionRemark: string, terminalId: string, role: string): { success: boolean; error?: string } {
    const mri = this.mriRecords.find((m) => m.id === mriId);
    if (!mri) return { success: false, error: 'MRI record not found' };

    mri.generalCorrectiveAction = correctiveActionRemark.trim();
    mri.correctiveActionCompletedAt = new Date().toISOString();
    mri.status = 'RESOLVED';

    this.logAudit('RECORD_CORRECTIVE_ACTION', 'MriRecord', mriId, terminalId, role, correctiveActionRemark);
    this.persist();
    return { success: true };
  }

  /**
   * Supervisor Allocation Approval / Assignment
   */
  public allocateJobOrder(joId: string, workstationId: string, terminalId: string): { success: boolean; error?: string } {
    const jo = this.getJobOrder(joId);
    if (!jo) return { success: false, error: 'Job order not found' };

    const ws = this.getWorkstation(workstationId);
    if (!ws) return { success: false, error: 'Workstation not found' };
    if (ws.availabilityState !== 'ENABLED') return { success: false, error: `Workstation ${ws.name} is not enabled (${ws.availabilityState})` };

    // Remove from previous workstation queue if exists
    if (jo.approvedWorkstationId) {
      const prevWs = this.getWorkstation(jo.approvedWorkstationId);
      if (prevWs) {
        prevWs.currentQueue = prevWs.currentQueue.filter((id) => id !== jo.id && id !== jo.joNumber);
      }
    }

    // Add to new workstation queue
    if (!ws.currentQueue.includes(jo.id)) {
      ws.currentQueue.push(jo.id);
    }

    jo.status = 'ALLOCATED';
    jo.approvedWorkstationId = ws.id;
    jo.allocatedAt = new Date().toISOString();
    jo.queueSequence = ws.currentQueue.length;
    jo.updatedAt = new Date().toISOString();

    if (ws.operationalState === 'AVAILABLE') {
      ws.operationalState = 'RESERVED';
    }

    this.logAudit('ALLOCATE_JO', 'JobOrder', jo.id, terminalId, 'SPV_QC', undefined, { workstationId: ws.id, queuePosition: jo.queueSequence });
    this.persist();
    return { success: true };
  }

  /**
   * Supervisor Unallocate
   */
  public unallocateJobOrder(joId: string, terminalId: string): { success: boolean; error?: string } {
    const jo = this.getJobOrder(joId);
    if (!jo) return { success: false, error: 'Job order not found' };
    if (jo.status === 'IN_PERFORMANCE') return { success: false, error: 'Cannot unallocate an actively testing JO without Abort' };

    if (jo.approvedWorkstationId) {
      const ws = this.getWorkstation(jo.approvedWorkstationId);
      if (ws) {
        ws.currentQueue = ws.currentQueue.filter((id) => id !== jo.id && id !== jo.joNumber);
        if (ws.currentQueue.length === 0 && !ws.activeJoId) {
          ws.operationalState = 'AVAILABLE';
        }
      }
    }

    jo.status = 'READY_FOR_ALLOCATION';
    jo.approvedWorkstationId = undefined;
    jo.queueSequence = undefined;
    jo.updatedAt = new Date().toISOString();

    this.logAudit('UNALLOCATE_JO', 'JobOrder', jo.id, terminalId, 'SPV_QC');
    this.persist();
    return { success: true };
  }

  /**
   * Reorder Workstation Queue
   */
  public reorderWorkstationQueue(workstationId: string, newQueueJoIds: string[], terminalId: string): void {
    const ws = this.getWorkstation(workstationId);
    if (!ws) return;

    ws.currentQueue = newQueueJoIds;
    newQueueJoIds.forEach((joId, idx) => {
      const jo = this.getJobOrder(joId);
      if (jo) {
        jo.queueSequence = idx + 1;
      }
    });

    this.logAudit('REORDER_QUEUE', 'Workstation', workstationId, terminalId, 'SPV_QC', undefined, { newQueue: newQueueJoIds });
    this.persist();
  }

  /**
   * Workstation Availability State Management
   */
  public setWorkstationAvailability(
    workstationId: string,
    state: 'ENABLED' | 'BREAKDOWN' | 'MAINTENANCE',
    reason: string | undefined,
    terminalId: string
  ): { success: boolean; error?: string } {
    const ws = this.getWorkstation(workstationId);
    if (!ws) return { success: false, error: 'Workstation not found' };

    if (state !== 'ENABLED' && !reason?.trim()) {
      return { success: false, error: 'Reason is mandatory for Breakdown or Maintenance' };
    }

    const oldState = ws.availabilityState;
    ws.availabilityState = state;
    ws.breakdownReason = state === 'ENABLED' ? undefined : reason?.trim();

    this.logAudit('SET_WORKSTATION_AVAILABILITY', 'Workstation', workstationId, terminalId, 'SPV_QC', reason, { oldState, newState: state });
    this.persist();
    return { success: true };
  }

  /**
   * Start Performance Test Attempt
   */
  public startPerformanceAttempt(joId: string, workstationId: string, terminalId: string): { success: boolean; attempt?: TestingAttempt; error?: string } {
    const jo = this.getJobOrder(joId);
    if (!jo) return { success: false, error: 'Job order not found' };

    if (jo.finalGltResult !== 'GOOD') {
      return { success: false, error: 'GLT inspection final GOOD prerequisite is required before Performance Testing' };
    }

    const ws = this.getWorkstation(workstationId);
    if (!ws) return { success: false, error: 'Workstation not found' };
    if (ws.availabilityState !== 'ENABLED') {
      return { success: false, error: `Workstation is ${ws.availabilityState}. Testing prohibited.` };
    }
    if (ws.activeAttemptId) {
      return { success: false, error: `Workstation ${ws.name} is currently testing another unit.` };
    }

    // Load latest published template snapshot
    const template = this.getChecksheetTemplate('PERF', jo.componentCategory) || Object.values(this.checksheetTemplates)[2];
    if (!template) return { success: false, error: 'Checksheet template not found' };

    const attemptId = `att-perf-${jo.id}-${Date.now()}`;
    const newAttempt: TestingAttempt = {
      id: attemptId,
      joId: jo.id,
      cycleId: jo.currentCycleId,
      stage: 'PERFORMANCE',
      attemptNumber: (this.getAttempts(jo.id).filter((a) => a.stage === 'PERFORMANCE').length) + 1,
      workstationId: ws.id,
      terminalId,
      startedAt: new Date().toISOString(),
      checksheetVersionId: template.id,
      checksheetSnapshot: JSON.parse(JSON.stringify(template)),
      standardDurationMinutes: template.fixedStandardDurationMinutes || 90,
      measurements: [],
      evidencePhotos: []
    };

    jo.status = 'IN_PERFORMANCE';
    jo.activeAttemptId = attemptId;
    if (!jo.performanceStartedAt) {
      jo.performanceStartedAt = new Date().toISOString();
    }
    jo.updatedAt = new Date().toISOString();

    ws.operationalState = 'TESTING';
    ws.activeJoId = jo.id;
    ws.activeAttemptId = attemptId;

    this.attempts.push(newAttempt);
    this.logAudit('START_PERFORMANCE_TEST', 'TestingAttempt', attemptId, terminalId, 'PERF_OPERATOR', undefined, { workstationId });
    this.persist();
    return { success: true, attempt: newAttempt };
  }

  /**
   * Submit Performance Test Attempt
   */
  public submitPerformanceAttempt(
    attemptId: string,
    payload: {
      measurements: any[];
      overallEvaluation: 'GOOD' | 'NOT_GOOD';
      remarks?: string;
      evidencePhotos?: string[];
    },
    terminalId: string
  ): { success: boolean; certificate?: TestCertificate; error?: string } {
    const attempt = this.attempts.find((a) => a.id === attemptId);
    if (!attempt || attempt.endedAt) return { success: false, error: 'Invalid or completed attempt' };

    const jo = this.getJobOrder(attempt.joId);
    if (!jo) return { success: false, error: 'Job order not found' };

    const ws = attempt.workstationId ? this.getWorkstation(attempt.workstationId) : undefined;
    const now = new Date().toISOString();

    attempt.endedAt = now;
    attempt.measurements = payload.measurements;
    attempt.remarks = payload.remarks;
    attempt.evidencePhotos = payload.evidencePhotos || [];
    attempt.overallEvaluation = payload.overallEvaluation;
    attempt.result = payload.overallEvaluation === 'GOOD' ? 'GOOD' : 'NOT_GOOD';

    let cert: TestCertificate | undefined;

    if (payload.overallEvaluation === 'GOOD') {
      jo.status = 'DONE';
      jo.finalPerformanceResult = 'GOOD';
      jo.performanceCompletedAt = now;
      jo.activeAttemptId = undefined;

      // Release workstation
      if (ws) {
        ws.activeJoId = undefined;
        ws.activeAttemptId = undefined;
        ws.currentQueue = ws.currentQueue.filter((id) => id !== jo.id && id !== jo.joNumber);
        ws.operationalState = ws.currentQueue.length > 0 ? 'RESERVED' : 'AVAILABLE';
      }

      // Automatic Test Certificate Generation (Decision #60)
      cert = generateTestCertificate(jo, attempt, ws?.name || 'Performance Test Bench');
      this.certificates[jo.id] = cert;
      jo.certificateId = cert.id;
      jo.certificateGeneratedAt = cert.issuedAt;

      this.logAudit('SUBMIT_PERFORMANCE_GOOD', 'TestingAttempt', attemptId, terminalId, 'PERF_OPERATOR', undefined, { certId: cert.id });
    } else {
      // Performance NOT GOOD -> MRI-B
      const mriId = `mri-b-${jo.id}-${Date.now()}`;
      const failedParams = payload.measurements
        .filter((m) => !m.isGood)
        .map((m) => ({
          parameterId: m.parameterId,
          parameterName: m.parameterName,
          actualValue: String(m.value),
          standard: 'Technical Standard',
          defectDescription: m.remark || 'Parameter value out of specification'
        }));

      const mri: MriRecord = {
        id: mriId,
        mriType: 'MRI-B',
        joId: jo.id,
        attemptId: attempt.id,
        createdAt: now,
        componentCategory: jo.componentCategory,
        componentModel: jo.componentModel,
        unitModel: jo.unitModel,
        assembler: jo.assembler,
        failedParameters: failedParams.length > 0 ? failedParams : [{
          parameterId: 'perf_ng',
          parameterName: 'General Performance Anomaly',
          actualValue: 'Failed',
          standard: 'Pass',
          defectDescription: payload.remarks || 'Component failed output / pressure standards'
        }],
        status: 'OPEN'
      };

      this.mriRecords.push(mri);
      jo.hasMriB = true;
      jo.latestMriBId = mriId;
      jo.finalPerformanceResult = 'NOT_GOOD';
      jo.status = 'ALLOCATED'; // Remains on workstation queue for adjustment & retest
      jo.activeAttemptId = undefined;

      // Release active testing lock so retest can start
      if (ws) {
        ws.activeJoId = undefined;
        ws.activeAttemptId = undefined;
        ws.operationalState = 'RESERVED';
      }

      this.logAudit('SUBMIT_PERFORMANCE_NOT_GOOD', 'MriRecord', mriId, terminalId, 'PERF_OPERATOR', undefined, { failedParamsCount: failedParams.length });
    }

    jo.updatedAt = now;
    this.persist();
    return { success: true, certificate: cert };
  }

  /**
   * Supervisor-Only Performance Abort (Section 18)
   */
  public abortPerformanceAttempt(attemptId: string, reason: string, terminalId: string): { success: boolean; error?: string } {
    if (!reason?.trim()) return { success: false, error: 'Mandatory reason required for Supervisor Abort' };

    const attempt = this.attempts.find((a) => a.id === attemptId);
    if (!attempt || attempt.endedAt) return { success: false, error: 'Invalid or already ended attempt' };

    const jo = this.getJobOrder(attempt.joId);
    const now = new Date().toISOString();

    attempt.endedAt = now;
    attempt.result = 'ABORTED';
    attempt.abortReason = reason.trim();
    attempt.abortedByRole = 'SPV_QC';

    if (jo) {
      jo.status = 'ALLOCATED';
      jo.activeAttemptId = undefined;
      jo.updatedAt = now;
    }

    if (attempt.workstationId) {
      const ws = this.getWorkstation(attempt.workstationId);
      if (ws) {
        ws.activeJoId = undefined;
        ws.activeAttemptId = undefined;
        ws.operationalState = ws.currentQueue.length > 0 ? 'RESERVED' : 'AVAILABLE';
      }
    }

    this.logAudit('ABORT_PERFORMANCE_ATTEMPT', 'TestingAttempt', attemptId, terminalId, 'SPV_QC', reason);
    this.persist();
    return { success: true };
  }

  /**
   * Supervisor Controlled Transfer of Active JO (Section 17)
   */
  public controlledTransferJobOrder(
    joId: string,
    targetWorkstationId: string,
    abortReason: string,
    terminalId: string
  ): { success: boolean; error?: string } {
    const jo = this.getJobOrder(joId);
    if (!jo) return { success: false, error: 'Job order not found' };

    const activeAttempt = this.getActiveAttempt(undefined, jo.id);
    if (activeAttempt) {
      // Must abort active attempt first
      const abortRes = this.abortPerformanceAttempt(activeAttempt.id, `Transfer to ${targetWorkstationId}: ${abortReason}`, terminalId);
      if (!abortRes.success) return abortRes;
    }

    return this.allocateJobOrder(jo.id, targetWorkstationId, terminalId);
  }

  /**
   * Supervisor Correction of submitted parameter values or remarks (Section 27)
   */
  public correctSubmittedAttempt(
    attemptId: string,
    parameterId: string,
    correctedValue: string | number,
    reason: string,
    terminalId: string
  ): { success: boolean; error?: string } {
    if (!reason?.trim()) return { success: false, error: 'Mandatory reason required for Supervisor correction' };

    const attempt = this.attempts.find((a) => a.id === attemptId);
    if (!attempt) return { success: false, error: 'Attempt not found' };

    const meas = attempt.measurements.find((m) => m.parameterId === parameterId);
    const oldValue = meas ? meas.value : 'N/A';

    if (meas) {
      meas.value = correctedValue;
    } else {
      attempt.measurements.push({
        parameterId,
        parameterName: parameterId,
        group: 'Correction',
        value: correctedValue,
        isGood: true
      });
    }

    this.logAudit('SUPERVISOR_CORRECTION', 'TestingAttempt', attemptId, terminalId, 'SPV_QC', reason, {
      parameterId,
      oldValue,
      newValue: correctedValue
    });

    this.persist();
    return { success: true };
  }

  /**
   * Reopen DONE or CANCELLED Job Order (Section 29)
   */
  public reopenJobOrder(joId: string, restartStage: 'GLT' | 'PERFORMANCE', reason: string, terminalId: string): { success: boolean; error?: string } {
    if (!reason?.trim()) return { success: false, error: 'Mandatory reason required to Reopen Job Order' };

    const jo = this.getJobOrder(joId);
    if (!jo) return { success: false, error: 'Job order not found' };

    const oldCycle = jo.currentCycleId;
    const newCycleId = `cycle_${Date.now()}`;
    jo.currentCycleId = newCycleId;

    // Invalidate certificate if was generated
    if (this.certificates[jo.id]) {
      this.certificates[jo.id].isValid = false;
      this.logAudit('INVALIDATE_CERTIFICATE', 'TestCertificate', this.certificates[jo.id].id, terminalId, 'SPV_QC', `JO Reopened to ${restartStage}`);
    }

    if (restartStage === 'GLT') {
      jo.status = 'WAITING_GLT';
      jo.finalGltResult = undefined;
      jo.approvedWorkstationId = undefined;
      jo.queueSequence = undefined;
    } else {
      jo.status = 'READY_FOR_ALLOCATION';
      jo.approvedWorkstationId = undefined;
      jo.queueSequence = undefined;
    }

    jo.updatedAt = new Date().toISOString();
    this.logAudit('REOPEN_JO', 'JobOrder', jo.id, terminalId, 'SPV_QC', reason, { oldCycle, newCycle: newCycleId, restartStage });
    this.persist();
    return { success: true };
  }

  /**
   * Cancel Job Order (Only allowed before Start GLT - Section 28)
   */
  public cancelJobOrder(joId: string, reason: string, terminalId: string): { success: boolean; error?: string } {
    if (!reason?.trim()) return { success: false, error: 'Mandatory cancellation reason required' };

    const jo = this.getJobOrder(joId);
    if (!jo) return { success: false, error: 'Job order not found' };

    if (jo.status !== 'WAITING_GLT') {
      return { success: false, error: 'Cancellation prohibited once GLT has started' };
    }

    jo.status = 'CANCELLED';
    jo.updatedAt = new Date().toISOString();

    this.logAudit('CANCEL_JO', 'JobOrder', jo.id, terminalId, 'SPV_QC', reason);
    this.persist();
    return { success: true };
  }

  /**
   * Update AI Weights Configuration
   */
  public updateAiWeights(weights: AiDispatchWeights, terminalId: string): void {
    this.aiWeights = { ...weights };
    this.logAudit('UPDATE_AI_WEIGHTS', 'AiDispatchConfig', 'weights', terminalId, 'SPV_QC', undefined, { ...weights });
    this.persist();
  }

  /**
   * Update Working Calendar Configuration
   */
  public updateWorkingCalendar(calendar: WorkingCalendarConfig, terminalId: string): void {
    this.workingCalendar = { ...calendar };
    this.logAudit('UPDATE_WORKING_CALENDAR', 'WorkingCalendar', 'calendar', terminalId, 'SPV_QC', undefined, { ...calendar });
    this.persist();
  }

  /**
   * Publish new version of Checksheet Template (Section 10)
   */
  public publishChecksheetTemplate(template: ChecksheetTemplate, terminalId: string): void {
    template.version += 1;
    template.publishedAt = new Date().toISOString();
    template.isPublished = true;
    const key = `PERF_${template.componentCategory}`;
    this.checksheetTemplates[key] = { ...template };

    this.logAudit('PUBLISH_CHECKSHEET_VERSION', 'ChecksheetTemplate', template.id, terminalId, 'QUALITY_MASTER', undefined, { version: template.version });
    this.persist();
  }

  // --- LOCAL DRAFT AUTOSAVE APIS ---
  public saveDraft(key: string, data: any) {
    try {
      localStorage.setItem(`dynodyn_draft_${key}`, JSON.stringify({ data, savedAt: Date.now() }));
    } catch {}
  }

  public getDraft(key: string): any {
    try {
      const item = localStorage.getItem(`dynodyn_draft_${key}`);
      return item ? JSON.parse(item).data : null;
    } catch {
      return null;
    }
  }

  public clearDraft(key: string) {
    localStorage.removeItem(`dynodyn_draft_${key}`);
  }
}

export const db = new DataStore();
