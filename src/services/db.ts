/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  runTransaction,
  onSnapshot,
  query,
  where,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { firestoreDb, auth, ensureAuthenticated } from './firebase';
import {
  JobOrder,
  Workstation,
  TestingAttempt,
  MriRecord,
  TestCertificate,
  AuditEvent,
  ChecksheetTemplate,
  WorkingCalendarConfig,
  AiDispatchWeights
} from '../types';
import { INITIAL_JOB_ORDERS, INITIAL_WORKSTATIONS, INITIAL_WORKING_CALENDAR } from '../data/seedData';
import { INITIAL_CHECKSHEET_TEMPLATES } from '../data/checksheetTemplates';
import { DEFAULT_AI_WEIGHTS } from './aiDispatch';
import { generateTestCertificate } from './certificateGenerator';

function isOnline(): boolean {
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    return navigator.onLine;
  }
  return true;
}

function sanitizeDocId(key: string): string {
  return key.replace(/[\/\s]/g, '_');
}

/**
 * FirestoreDataStore: Exclusive Cloud Firestore Authoritative Database Engine
 * Synchronizes all industrial operations in realtime across multiple terminals.
 */
class FirestoreDataStore {
  private jobOrders: JobOrder[] = [];
  private workstations: Workstation[] = INITIAL_WORKSTATIONS;
  private attempts: TestingAttempt[] = [];
  private mriRecords: MriRecord[] = [];
  private certificates: Record<string, TestCertificate> = {};
  private auditEvents: AuditEvent[] = [];
  private checksheetTemplates: Record<string, ChecksheetTemplate> = { ...INITIAL_CHECKSHEET_TEMPLATES };
  private workingCalendar: WorkingCalendarConfig = INITIAL_WORKING_CALENDAR;
  private aiWeights: AiDispatchWeights = DEFAULT_AI_WEIGHTS;
  private assemblers: { name: string; active: boolean }[] = [
    'Budi', 'Andi', 'Rina', 'Joko', 'Agus', 'Yanto', 'Rian Pratama', 'Budi Santoso'
  ].map((name) => ({ name, active: true }));

  private listeners: Set<() => void> = new Set();
  private isInitialized = false;
  private hasSeeded = false;
  private isQuotaExhausted = false;
  private unsubscribers: (() => void)[] = [];
  private draftStore: Record<string, any> = {};

  private handleCloudError(e: any, context: string) {
    if (e?.message && (e.message.includes('RESOURCE_EXHAUSTED') || e.message.includes('Quota limit exceeded'))) {
      this.isQuotaExhausted = true;
    }
    console.warn(`Firestore ${context} note:`, e?.message || e);
  }

  constructor() {
    this.init();
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      await ensureAuthenticated();
      this.setupRealtimeListeners();
    } catch (e) {
      console.warn('Firebase init error during auth or listeners setup:', e);
    }
  }

  private setupRealtimeListeners() {
    // 1. Job Orders Realtime Listener
    const joUnsub = onSnapshot(
      collection(firestoreDb, 'jobOrders'),
      (snapshot) => {
        if (!snapshot.empty) {
          const jobs: JobOrder[] = [];
          snapshot.forEach((docSnap) => {
            jobs.push(docSnap.data() as JobOrder);
          });
          jobs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          this.jobOrders = jobs;
          this.notify();
        } else if (!this.hasSeeded) {
          // If Firestore is empty on initial boot, seed initial data once without overwriting existing records
          this.seedInitialData();
        }
      },
      (error) => {
        console.warn('Realtime listener note [jobOrders]:', error.message);
      }
    );
    this.unsubscribers.push(joUnsub);

    // 2. Workstations Realtime Listener
    const wsUnsub = onSnapshot(
      collection(firestoreDb, 'workstations'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Workstation[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as Workstation);
          });
          const orderMap: Record<string, number> = {
            D1: 1, D2: 2, D3: 3, TB1: 4, TB2: 5, TB3: 6, TB_CYL: 7, MB: 8
          };
          list.sort((a, b) => (orderMap[a.id] || 99) - (orderMap[b.id] || 99));
          this.workstations = list;
          this.notify();
        }
      },
      (error) => {
        console.warn('Realtime listener note [workstations]:', error.message);
      }
    );
    this.unsubscribers.push(wsUnsub);

    // 3. Testing Attempts Realtime Listener
    const attUnsub = onSnapshot(
      collection(firestoreDb, 'testingAttempts'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: TestingAttempt[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as TestingAttempt);
          });
          this.attempts = list;
          this.notify();
        }
      },
      (error) => {
        console.warn('Realtime listener note [testingAttempts]:', error.message);
      }
    );
    this.unsubscribers.push(attUnsub);

    // 4. MRI Records Realtime Listener
    const mriUnsub = onSnapshot(
      collection(firestoreDb, 'mriRecords'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: MriRecord[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as MriRecord);
          });
          this.mriRecords = list;
          this.notify();
        }
      },
      (error) => {
        console.warn('Realtime listener note [mriRecords]:', error.message);
      }
    );
    this.unsubscribers.push(mriUnsub);

    // 5. Certificates Realtime Listener
    const certUnsub = onSnapshot(
      collection(firestoreDb, 'certificates'),
      (snapshot) => {
        if (!snapshot.empty) {
          const certMap: Record<string, TestCertificate> = {};
          snapshot.forEach((docSnap) => {
            const cert = docSnap.data() as TestCertificate;
            certMap[cert.joId] = cert;
          });
          this.certificates = certMap;
          this.notify();
        }
      },
      (error) => {
        console.warn('Realtime listener note [certificates]:', error.message);
      }
    );
    this.unsubscribers.push(certUnsub);

    // 6. Audit Events Realtime Listener
    const auditUnsub = onSnapshot(
      collection(firestoreDb, 'auditEvents'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: AuditEvent[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as AuditEvent);
          });
          list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
          this.auditEvents = list;
          this.notify();
        }
      },
      (error) => {
        console.warn('Realtime listener note [auditEvents]:', error.message);
      }
    );
    this.unsubscribers.push(auditUnsub);

    // 7. Checksheet Templates Realtime Listener
    const tplUnsub = onSnapshot(
      collection(firestoreDb, 'checksheetTemplates'),
      (snapshot) => {
        if (!snapshot.empty) {
          const tplMap: Record<string, ChecksheetTemplate> = {};
          snapshot.forEach((docSnap) => {
            const tpl = docSnap.data() as ChecksheetTemplate;
            tplMap[docSnap.id] = tpl;
          });
          this.checksheetTemplates = tplMap;
          this.notify();
        }
      },
      (error) => {
        console.warn('Realtime listener note [checksheetTemplates]:', error.message);
      }
    );
    this.unsubscribers.push(tplUnsub);

    // 8. System Configs Realtime Listener
    const cfgUnsub = onSnapshot(
      collection(firestoreDb, 'systemConfigs'),
      (snapshot) => {
        snapshot.forEach((docSnap) => {
          if (docSnap.id === 'calendar') {
            this.workingCalendar = docSnap.data() as WorkingCalendarConfig;
          } else if (docSnap.id === 'aiWeights') {
            this.aiWeights = docSnap.data() as AiDispatchWeights;
          } else if (docSnap.id === 'assemblers') {
            const data = docSnap.data();
            if (data && data.list) {
              this.assemblers = data.list;
            }
          }
        });
        this.notify();
      },
      (error) => {
        console.warn('Realtime listener note [systemConfigs]:', error.message);
      }
    );
    this.unsubscribers.push(cfgUnsub);
  }

  /**
   * Seeds initial data into Firestore if empty on boot without overwriting existing records.
   */
  private async seedInitialData() {
    if (this.hasSeeded) return;
    this.hasSeeded = true;

    try {
      const batch = writeBatch(firestoreDb);

      for (const jo of INITIAL_JOB_ORDERS.slice(0, 5)) {
        batch.set(doc(firestoreDb, 'jobOrders', jo.id), {
          ...jo,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      for (const ws of INITIAL_WORKSTATIONS) {
        batch.set(doc(firestoreDb, 'workstations', ws.id), ws, { merge: true });
      }

      for (const [key, tpl] of Object.entries(INITIAL_CHECKSHEET_TEMPLATES)) {
        batch.set(doc(firestoreDb, 'checksheetTemplates', sanitizeDocId(key)), tpl, { merge: true });
      }

      batch.set(doc(firestoreDb, 'systemConfigs', 'calendar'), INITIAL_WORKING_CALENDAR, { merge: true });
      batch.set(doc(firestoreDb, 'systemConfigs', 'aiWeights'), DEFAULT_AI_WEIGHTS, { merge: true });
      batch.set(doc(firestoreDb, 'systemConfigs', 'assemblers'), { list: this.assemblers }, { merge: true });

      await batch.commit();
      console.log('Seeded initial Firestore operational data successfully');
    } catch (e) {
      this.handleCloudError(e, 'seedInitialData');
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private async logAudit(
    action: string,
    targetEntity: string,
    targetId: string,
    terminalId: string,
    role: string,
    reason?: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    const eventId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const event: AuditEvent = {
      id: eventId,
      action,
      targetEntity,
      targetId,
      terminalId,
      role,
      reason,
      details,
      timestamp: new Date().toISOString()
    };

    this.auditEvents.unshift(event);
    this.notify();

    if (!this.isQuotaExhausted) {
      try {
        await setDoc(doc(firestoreDb, 'auditEvents', eventId), {
          ...event,
          timestamp: serverTimestamp()
        });
      } catch (e) {
        this.handleCloudError(e, 'logAudit');
      }
    }
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
    const rawKey = `${stage}_${category}`;
    const safeKey = sanitizeDocId(rawKey);
    if (this.checksheetTemplates[safeKey]) return this.checksheetTemplates[safeKey];
    if (this.checksheetTemplates[rawKey]) return this.checksheetTemplates[rawKey];
    return Object.values(this.checksheetTemplates).find(
      (t) => t.componentCategory.toLowerCase() === category.toLowerCase()
    ) || INITIAL_CHECKSHEET_TEMPLATES[rawKey] || INITIAL_CHECKSHEET_TEMPLATES[Object.keys(INITIAL_CHECKSHEET_TEMPLATES).find(k => sanitizeDocId(k) === safeKey) || ''];
  }

  public getWorkingCalendar(): WorkingCalendarConfig {
    return { ...this.workingCalendar };
  }

  public getAiWeights(): AiDispatchWeights {
    return { ...this.aiWeights };
  }

  // --- ATOMIC MUTATION TRANSACTIONS WITH CLOUD FIRESTORE ---

  /**
   * TASK 2 & 4: Atomic Server-Validated JO Receiving Transaction
   * Prevents duplicate JO submissions across multiple devices using Firestore transactions.
   */
  public async receiveJobOrder(
    data: {
      joNumber: string;
      componentCategory: any;
      componentModel: string;
      unitModel: string;
      assembler: string;
      assemblyDate: string;
    },
    terminalId: string
  ): Promise<{ success: boolean; error?: string; jobOrder?: JobOrder }> {
    if (!isOnline()) {
      return { success: false, error: 'Tidak dapat mendaftarkan JO saat offline. Periksa koneksi internet.' };
    }

    await ensureAuthenticated();
    const cleanJoNum = data.joNumber.trim();
    if (this.jobOrders.some((j) => j.joNumber.toLowerCase() === cleanJoNum.toLowerCase())) {
      return { success: false, error: `Job Order number ${cleanJoNum} already exists in database.` };
    }

    const joId = `jo-${cleanJoNum}`;
    const joRef = doc(firestoreDb, 'jobOrders', joId);
    const now = new Date().toISOString();

    const createdJo: JobOrder = {
      id: joId,
      joNumber: cleanJoNum,
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

    try {
      await runTransaction(firestoreDb, async (transaction) => {
        const existingDoc = await transaction.get(joRef);
        if (existingDoc.exists()) {
          throw new Error(`Job Order number ${cleanJoNum} already exists in database.`);
        }
        transaction.set(joRef, {
          ...createdJo,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
    } catch (error: any) {
      return { success: false, error: error.message || 'Gagal menyimpan Job Order ke server Firestore.' };
    }

    this.jobOrders.unshift(createdJo);
    await this.logAudit('RECEIVE_JO', 'JobOrder', createdJo.id, terminalId, 'GLT_OPERATOR', undefined, { ...data });
    this.notify();

    return { success: true, jobOrder: createdJo };
  }

  /**
   * TASK 2 & 4: Atomic Start GLT Attempt Transaction
   */
  public async startGltAttempt(
    joId: string,
    terminalId: string
  ): Promise<{ success: boolean; attempt?: TestingAttempt; error?: string }> {
    if (!isOnline()) {
      return { success: false, error: 'Tidak dapat memulai pengujian saat offline.' };
    }

    await ensureAuthenticated();
    const jo = this.getJobOrder(joId);
    if (!jo) {
      return { success: false, error: 'Job Order not found in database' };
    }

    const template = this.getChecksheetTemplate('GLT', jo.componentCategory) || this.getChecksheetTemplate('GLT', 'Engine');
    if (!template) {
      return { success: false, error: 'Checksheet template not found' };
    }

    const attemptId = `att-glt-${jo.id}-${Date.now()}`;
    const joRef = doc(firestoreDb, 'jobOrders', jo.id);
    const attRef = doc(firestoreDb, 'testingAttempts', attemptId);
    const now = new Date().toISOString();

    const newAttempt: TestingAttempt = {
      id: attemptId,
      joId: jo.id,
      cycleId: jo.currentCycleId,
      stage: 'GLT',
      attemptNumber: (this.getAttempts(jo.id).filter((a) => a.stage === 'GLT').length) + 1,
      terminalId,
      startedAt: now,
      checksheetVersionId: template.id,
      checksheetSnapshot: JSON.parse(JSON.stringify(template)),
      standardDurationMinutes: template.fixedStandardDurationMinutes || 30,
      measurements: [],
      evidencePhotos: []
    };

    try {
      await runTransaction(firestoreDb, async (transaction) => {
        transaction.set(attRef, {
          ...newAttempt,
          startedAt: serverTimestamp()
        });
        transaction.update(joRef, {
          status: 'IN_GLT',
          activeAttemptId: attemptId,
          updatedAt: serverTimestamp()
        });
      });
    } catch (e: any) {
      return { success: false, error: e.message || 'Gagal memulai GLT di server Firestore.' };
    }

    this.attempts.push(newAttempt);
    jo.status = 'IN_GLT';
    jo.activeAttemptId = attemptId;
    jo.updatedAt = now;
    await this.logAudit('START_GLT', 'TestingAttempt', newAttempt.id, terminalId, 'GLT_OPERATOR');
    this.notify();

    return { success: true, attempt: newAttempt };
  }

  /**
   * TASK 2 & 4: Atomic Submit GLT Attempt Transaction
   */
  public async submitGltAttempt(
    attemptId: string,
    payload: {
      measurements: any[];
      overallEvaluation: 'GOOD' | 'NOT_GOOD';
      remarks?: string;
      evidencePhotos?: string[];
    },
    terminalId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!isOnline()) {
      return { success: false, error: 'Tidak dapat melakukan Submit saat offline. Pastikan koneksi internet terhubung.' };
    }

    await ensureAuthenticated();
    const attempt = this.attempts.find((a) => a.id === attemptId);
    if (!attempt) return { success: false, error: 'Attempt not found' };
    const jo = this.getJobOrder(attempt.joId);
    if (!jo) return { success: false, error: 'Job Order not found' };

    const now = new Date().toISOString();
    const isGood = payload.overallEvaluation === 'GOOD';
    const mriId = `mri-a-${jo.id}-${Date.now()}`;

    try {
      const attRef = doc(firestoreDb, 'testingAttempts', attemptId);
      const joRef = doc(firestoreDb, 'jobOrders', jo.id);

      await runTransaction(firestoreDb, async (transaction) => {
        transaction.update(attRef, {
          measurements: payload.measurements,
          overallEvaluation: payload.overallEvaluation,
          remarks: payload.remarks || '',
          evidencePhotos: payload.evidencePhotos || [],
          endedAt: serverTimestamp(),
          result: payload.overallEvaluation
        });

        if (isGood) {
          transaction.update(joRef, {
            status: 'READY_FOR_ALLOCATION',
            finalGltResult: 'GOOD',
            gltCompletedAt: serverTimestamp(),
            activeAttemptId: null,
            updatedAt: serverTimestamp()
          });
        } else {
          const mriRef = doc(firestoreDb, 'mriRecords', mriId);
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
            failedParameters: [{
              parameterId: 'glt_ng',
              parameterName: 'GLT Leakage Anomaly',
              actualValue: 'Failed',
              standard: 'No Leakage',
              defectDescription: payload.remarks || 'Leakage detected during GLT'
            }],
            status: 'OPEN'
          };
          transaction.set(mriRef, {
            ...mri,
            createdAt: serverTimestamp()
          });
          transaction.update(joRef, {
            hasMriA: true,
            latestMriAId: mriId,
            finalGltResult: 'NOT_GOOD',
            status: 'WAITING_GLT',
            activeAttemptId: null,
            updatedAt: serverTimestamp()
          });
        }
      });
    } catch (e: any) {
      return { success: false, error: e.message || 'Gagal menyimpan hasil GLT ke server Firestore.' };
    }

    attempt.measurements = payload.measurements;
    attempt.overallEvaluation = payload.overallEvaluation;
    attempt.remarks = payload.remarks;
    attempt.evidencePhotos = payload.evidencePhotos || [];
    attempt.endedAt = now;
    attempt.result = payload.overallEvaluation;

    if (isGood) {
      jo.status = 'READY_FOR_ALLOCATION';
      jo.finalGltResult = 'GOOD';
      jo.gltCompletedAt = now;
      jo.activeAttemptId = undefined;
    } else {
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
        failedParameters: [{
          parameterId: 'glt_ng',
          parameterName: 'GLT Leakage Anomaly',
          actualValue: 'Failed',
          standard: 'No Leakage',
          defectDescription: payload.remarks || 'Leakage detected during GLT'
        }],
        status: 'OPEN'
      };
      this.mriRecords.unshift(mri);
      jo.hasMriA = true;
      jo.latestMriAId = mriId;
      jo.finalGltResult = 'NOT_GOOD';
      jo.status = 'WAITING_GLT';
      jo.activeAttemptId = undefined;
    }
    jo.updatedAt = now;

    await this.logAudit('SUBMIT_GLT', 'TestingAttempt', attemptId, terminalId, 'GLT_OPERATOR', undefined, { outcome: payload.overallEvaluation });
    this.notify();

    return { success: true };
  }

  /**
   * TASK 2 & 4: Atomic Supervisor Allocation Transaction
   */
  public async allocateJobOrder(
    joId: string,
    workstationId: string,
    terminalId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!isOnline()) {
      return { success: false, error: 'Tidak dapat mengalokasikan saat offline.' };
    }

    await ensureAuthenticated();
    const jo = this.getJobOrder(joId);
    if (!jo) return { success: false, error: 'Job order not found' };
    const ws = this.getWorkstation(workstationId);
    if (!ws) return { success: false, error: 'Target workstation not found' };

    if (ws.availabilityState !== 'ENABLED') {
      return { success: false, error: `Workstation ${ws.name} is ${ws.availabilityState}. Allocation prohibited.` };
    }

    const now = new Date().toISOString();

    if (jo.approvedWorkstationId && jo.approvedWorkstationId !== workstationId) {
      const oldWs = this.getWorkstation(jo.approvedWorkstationId);
      if (oldWs) {
        oldWs.currentQueue = (oldWs.currentQueue || []).filter((id) => id !== jo.id && id !== jo.joNumber);
      }
    }

    const currentQueue = ws.currentQueue || [];
    const newQueue = currentQueue.includes(jo.id) ? currentQueue : [...currentQueue, jo.id];
    const targetWsState = ws.operationalState === 'AVAILABLE' ? 'RESERVED' : ws.operationalState;

    try {
      const joRef = doc(firestoreDb, 'jobOrders', jo.id);
      const wsRef = doc(firestoreDb, 'workstations', ws.id);
      await runTransaction(firestoreDb, async (transaction) => {
        transaction.update(wsRef, {
          currentQueue: newQueue,
          operationalState: targetWsState
        });
        transaction.update(joRef, {
          status: 'ALLOCATED',
          approvedWorkstationId: ws.id,
          allocatedAt: serverTimestamp(),
          queueSequence: newQueue.length,
          updatedAt: serverTimestamp()
        });
      });
    } catch (e: any) {
      return { success: false, error: e.message || 'Gagal alokasi JO ke server Firestore.' };
    }

    ws.currentQueue = newQueue;
    ws.operationalState = targetWsState;

    jo.status = 'ALLOCATED';
    jo.approvedWorkstationId = ws.id;
    jo.allocatedAt = now;
    jo.queueSequence = newQueue.length;
    jo.updatedAt = now;

    await this.logAudit('ALLOCATE_JO', 'JobOrder', joId, terminalId, 'SPV_QC', undefined, { workstationId });
    this.notify();

    return { success: true };
  }

  /**
   * TASK 2, 4 & 5: Atomic Start Performance Test Transaction
   * Prevents two devices from testing simultaneously on the same workstation.
   */
  public async startPerformanceAttempt(
    joId: string,
    workstationId: string,
    terminalId: string
  ): Promise<{ success: boolean; attempt?: TestingAttempt; error?: string }> {
    if (!isOnline()) {
      return { success: false, error: 'Tidak dapat memulai pengujian saat offline.' };
    }

    await ensureAuthenticated();
    const jo = this.getJobOrder(joId);
    if (!jo) return { success: false, error: 'Job order not found' };

    if (jo.finalGltResult !== 'GOOD') {
      return { success: false, error: 'Prasyarat inspeksi GLT GOOD belum terpenuhi.' };
    }

    const ws = this.getWorkstation(workstationId);
    if (!ws) return { success: false, error: 'Workstation not found' };

    if (ws.availabilityState !== 'ENABLED') {
      return { success: false, error: `Workstation is ${ws.availabilityState}. Pengujian dilarang.` };
    }

    // Mutual exclusion: Prevent two simultaneous active attempts on workstation across devices
    if ((ws.activeAttemptId && ws.activeJoId !== jo.id) || ws.operationalState === 'ACTIVE_TESTING') {
      return { success: false, error: `Workstation ${ws.name} sedang dalam pengujian aktif oleh operator lain.` };
    }

    const template = this.getChecksheetTemplate('PERF', jo.componentCategory) || Object.values(this.checksheetTemplates)[2] || INITIAL_CHECKSHEET_TEMPLATES['PERF_Engine'];
    const attemptId = `att-perf-${jo.id}-${Date.now()}`;
    const now = new Date().toISOString();

    const newAttempt: TestingAttempt = {
      id: attemptId,
      joId: jo.id,
      cycleId: jo.currentCycleId,
      stage: 'PERFORMANCE',
      attemptNumber: (this.getAttempts(jo.id).filter((a) => a.stage === 'PERFORMANCE').length) + 1,
      workstationId: ws.id,
      terminalId,
      startedAt: now,
      checksheetVersionId: template.id,
      checksheetSnapshot: JSON.parse(JSON.stringify(template)),
      standardDurationMinutes: template.fixedStandardDurationMinutes || 90,
      measurements: [],
      evidencePhotos: []
    };

    try {
      const joRef = doc(firestoreDb, 'jobOrders', jo.id);
      const wsRef = doc(firestoreDb, 'workstations', ws.id);
      const attRef = doc(firestoreDb, 'testingAttempts', attemptId);

      await runTransaction(firestoreDb, async (transaction) => {
        transaction.set(attRef, {
          ...newAttempt,
          startedAt: serverTimestamp()
        });
        transaction.update(wsRef, {
          operationalState: 'ACTIVE_TESTING',
          activeJoId: jo.id,
          activeAttemptId: attemptId
        });
        transaction.update(joRef, {
          status: 'IN_PERFORMANCE',
          activeAttemptId: attemptId,
          updatedAt: serverTimestamp()
        });
      });
    } catch (e: any) {
      return { success: false, error: e.message || 'Gagal memulai pengujian performa di server Firestore.' };
    }

    this.attempts.push(newAttempt);
    ws.operationalState = 'ACTIVE_TESTING';
    ws.activeJoId = jo.id;
    ws.activeAttemptId = attemptId;

    jo.status = 'IN_PERFORMANCE';
    jo.activeAttemptId = attemptId;
    jo.updatedAt = now;

    await this.logAudit('START_PERFORMANCE', 'TestingAttempt', attemptId, terminalId, 'PERF_OPERATOR', undefined, { workstationId });
    this.notify();

    return { success: true, attempt: newAttempt };
  }

  /**
   * TASK 2, 4 & 5: Atomic Submit Performance Test Transaction
   */
  public async submitPerformanceAttempt(
    attemptId: string,
    payload: {
      measurements: any[];
      overallEvaluation: 'GOOD' | 'NOT_GOOD';
      remarks?: string;
      evidencePhotos?: string[];
    },
    terminalId: string
  ): Promise<{ success: boolean; certificate?: TestCertificate; error?: string }> {
    if (!isOnline()) {
      return { success: false, error: 'Tidak dapat melakukan Submit saat offline.' };
    }

    await ensureAuthenticated();
    const attempt = this.attempts.find((a) => a.id === attemptId);
    if (!attempt) return { success: false, error: 'Attempt not found' };
    const jo = this.getJobOrder(attempt.joId);
    if (!jo) return { success: false, error: 'Job order not found' };
    const ws = attempt.workstationId ? this.getWorkstation(attempt.workstationId) : undefined;

    const now = new Date().toISOString();
    const isGood = payload.overallEvaluation === 'GOOD';
    let generatedCert: TestCertificate | undefined;

    if (isGood) {
      generatedCert = generateTestCertificate(jo, attempt, ws?.name || 'Performance Bench');
    }

    const mriId = `mri-b-${jo.id}-${Date.now()}`;

    try {
      const attRef = doc(firestoreDb, 'testingAttempts', attemptId);
      const joRef = doc(firestoreDb, 'jobOrders', jo.id);
      const wsRef = ws ? doc(firestoreDb, 'workstations', ws.id) : undefined;

      await runTransaction(firestoreDb, async (transaction) => {
        transaction.update(attRef, {
          measurements: payload.measurements,
          overallEvaluation: payload.overallEvaluation,
          remarks: payload.remarks || '',
          evidencePhotos: payload.evidencePhotos || [],
          endedAt: serverTimestamp(),
          result: payload.overallEvaluation
        });

        if (isGood && generatedCert) {
          const certRef = doc(firestoreDb, 'certificates', `cert-${jo.id}`);
          transaction.set(certRef, {
            ...generatedCert,
            issuedAt: serverTimestamp()
          });

          if (wsRef && ws) {
            const updatedQueue = (ws.currentQueue || []).filter((id) => id !== jo.id && id !== jo.joNumber);
            transaction.update(wsRef, {
              activeJoId: null,
              activeAttemptId: null,
              currentQueue: updatedQueue,
              operationalState: updatedQueue.length > 0 ? 'RESERVED' : 'AVAILABLE'
            });
          }

          transaction.update(joRef, {
            status: 'DONE',
            finalPerformanceResult: 'GOOD',
            performanceCompletedAt: serverTimestamp(),
            certificateId: generatedCert.certificateNumber,
            activeAttemptId: null,
            updatedAt: serverTimestamp()
          });
        } else {
          const mriRef = doc(firestoreDb, 'mriRecords', mriId);
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
            failedParameters: [{
              parameterId: 'perf_ng',
              parameterName: 'General Performance Anomaly',
              actualValue: 'Failed',
              standard: 'Pass',
              defectDescription: payload.remarks || 'Component failed output / pressure standards'
            }],
            status: 'OPEN'
          };
          transaction.set(mriRef, {
            ...mri,
            createdAt: serverTimestamp()
          });

          if (wsRef && ws) {
            transaction.update(wsRef, {
              activeJoId: null,
              activeAttemptId: null,
              operationalState: 'RESERVED'
            });
          }

          transaction.update(joRef, {
            status: 'ALLOCATED',
            hasMriB: true,
            latestMriBId: mriId,
            finalPerformanceResult: 'NOT_GOOD',
            activeAttemptId: null,
            updatedAt: serverTimestamp()
          });
        }
      });
    } catch (e: any) {
      return { success: false, error: e.message || 'Gagal menyimpan submit performa ke server Firestore.' };
    }

    attempt.measurements = payload.measurements;
    attempt.overallEvaluation = payload.overallEvaluation;
    attempt.remarks = payload.remarks;
    attempt.evidencePhotos = payload.evidencePhotos || [];
    attempt.endedAt = now;
    attempt.result = payload.overallEvaluation;

    if (isGood && generatedCert) {
      this.certificates[jo.id] = generatedCert;
      if (ws) {
        ws.activeJoId = undefined;
        ws.activeAttemptId = undefined;
        ws.currentQueue = (ws.currentQueue || []).filter((id) => id !== jo.id && id !== jo.joNumber);
        ws.operationalState = ws.currentQueue.length > 0 ? 'RESERVED' : 'AVAILABLE';
      }
      jo.status = 'DONE';
      jo.finalPerformanceResult = 'GOOD';
      jo.performanceCompletedAt = now;
      jo.certificateId = generatedCert.certificateNumber;
      jo.activeAttemptId = undefined;
    } else {
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
        failedParameters: [{
          parameterId: 'perf_ng',
          parameterName: 'General Performance Anomaly',
          actualValue: 'Failed',
          standard: 'Pass',
          defectDescription: payload.remarks || 'Component failed output / pressure standards'
        }],
        status: 'OPEN'
      };
      this.mriRecords.unshift(mri);
      if (ws) {
        ws.activeJoId = undefined;
        ws.activeAttemptId = undefined;
        ws.operationalState = 'RESERVED';
      }
      jo.status = 'ALLOCATED';
      jo.hasMriB = true;
      jo.latestMriBId = mriId;
      jo.finalPerformanceResult = 'NOT_GOOD';
      jo.activeAttemptId = undefined;
    }
    jo.updatedAt = now;

    await this.logAudit('SUBMIT_PERFORMANCE', 'TestingAttempt', attemptId, terminalId, 'PERF_OPERATOR', undefined, { outcome: payload.overallEvaluation });
    this.notify();

    return { success: true, certificate: generatedCert };
  }

  /**
   * Supervisor-Only Performance Abort (Section 18)
   */
  public async abortPerformanceAttempt(
    attemptId: string,
    reason: string,
    terminalId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!reason?.trim()) return { success: false, error: 'Mandatory reason required for Supervisor Abort' };

    await ensureAuthenticated();
    const attempt = this.attempts.find((a) => a.id === attemptId);
    if (!attempt) return { success: false, error: 'Attempt not found' };
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
        ws.operationalState = (ws.currentQueue || []).length > 0 ? 'RESERVED' : 'AVAILABLE';
      }
    }

    if (!this.isQuotaExhausted) {
      try {
        const attRef = doc(firestoreDb, 'testingAttempts', attemptId);
        await updateDoc(attRef, {
          endedAt: serverTimestamp(),
          result: 'ABORTED',
          abortReason: reason.trim(),
          abortedByRole: 'SPV_QC'
        });
      } catch (e) {
        this.handleCloudError(e, 'abortPerformanceAttempt');
      }
    }

    await this.logAudit('ABORT_PERFORMANCE_ATTEMPT', 'TestingAttempt', attemptId, terminalId, 'SPV_QC', reason);
    this.notify();

    return { success: true };
  }

  /**
   * Supervisor Controlled Transfer of Active JO (Section 17)
   */
  public async controlledTransferJobOrder(
    joId: string,
    targetWorkstationId: string,
    abortReason: string,
    terminalId: string
  ): Promise<{ success: boolean; error?: string }> {
    const activeAttempt = this.getActiveAttempt(undefined, joId);
    if (activeAttempt) {
      const abortRes = await this.abortPerformanceAttempt(
        activeAttempt.id,
        `Transfer ke ${targetWorkstationId}: ${abortReason}`,
        terminalId
      );
      if (!abortRes.success) return abortRes;
    }

    return this.allocateJobOrder(joId, targetWorkstationId, terminalId);
  }

  /**
   * Record Corrective Action for MRI (Decision #57)
   */
  public async recordCorrectiveAction(
    mriId: string,
    correctiveActionRemark: string,
    terminalId: string,
    role: string
  ): Promise<{ success: boolean; error?: string }> {
    await ensureAuthenticated();
    const mri = this.mriRecords.find((m) => m.id === mriId);
    if (mri) {
      mri.generalCorrectiveAction = correctiveActionRemark.trim();
      mri.correctiveActionCompletedAt = new Date().toISOString();
      mri.status = 'RESOLVED';
    }

    if (!this.isQuotaExhausted) {
      try {
        await updateDoc(doc(firestoreDb, 'mriRecords', mriId), {
          generalCorrectiveAction: correctiveActionRemark.trim(),
          correctiveActionCompletedAt: serverTimestamp(),
          status: 'RESOLVED'
        });
      } catch (e) {
        this.handleCloudError(e, 'recordCorrectiveAction');
      }
    }

    await this.logAudit('RECORD_CORRECTIVE_ACTION', 'MriRecord', mriId, terminalId, role, correctiveActionRemark);
    this.notify();

    return { success: true };
  }

  /**
   * Set Workstation Availability State
   */
  public async setWorkstationAvailability(
    workstationId: string,
    state: 'ENABLED' | 'BREAKDOWN' | 'MAINTENANCE',
    reason: string | undefined,
    terminalId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (state !== 'ENABLED' && !reason?.trim()) {
      return { success: false, error: 'Reason is mandatory for Breakdown or Maintenance' };
    }

    await ensureAuthenticated();
    const ws = this.getWorkstation(workstationId);
    if (ws) {
      ws.availabilityState = state;
      ws.breakdownReason = state === 'ENABLED' ? undefined : reason?.trim();
    }

    if (!this.isQuotaExhausted) {
      try {
        await updateDoc(doc(firestoreDb, 'workstations', workstationId), {
          availabilityState: state,
          breakdownReason: state === 'ENABLED' ? '' : reason?.trim()
        });
      } catch (e) {
        this.handleCloudError(e, 'setWorkstationAvailability');
      }
    }

    await this.logAudit('SET_WORKSTATION_AVAILABILITY', 'Workstation', workstationId, terminalId, 'SPV_QC', reason, { newState: state });
    this.notify();

    return { success: true };
  }

  /**
   * Reorder Workstation Queue
   */
  public async reorderWorkstationQueue(
    workstationId: string,
    newQueueJoIds: string[],
    terminalId: string
  ): Promise<void> {
    await ensureAuthenticated();
    const ws = this.getWorkstation(workstationId);
    if (ws) {
      ws.currentQueue = newQueueJoIds;
    }

    if (!this.isQuotaExhausted) {
      try {
        await updateDoc(doc(firestoreDb, 'workstations', workstationId), { currentQueue: newQueueJoIds });
      } catch (e) {
        this.handleCloudError(e, 'reorderWorkstationQueue');
      }
    }

    await this.logAudit('REORDER_QUEUE', 'Workstation', workstationId, terminalId, 'SPV_QC', undefined, { newQueue: newQueueJoIds });
    this.notify();
  }

  /**
   * Reopen DONE or CANCELLED Job Order (Section 29)
   */
  public async reopenJobOrder(
    joId: string,
    restartStage: 'GLT' | 'PERFORMANCE',
    reason: string,
    terminalId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!reason?.trim()) return { success: false, error: 'Mandatory reason required to Reopen Job Order' };

    await ensureAuthenticated();
    const jo = this.getJobOrder(joId);
    if (!jo) return { success: false, error: 'Job order not found' };

    const newCycleId = `cycle_${Date.now()}`;
    const now = new Date().toISOString();

    if (this.certificates[joId]) {
      this.certificates[joId].isValid = false;
    }

    if (restartStage === 'GLT') {
      jo.status = 'WAITING_GLT';
      jo.currentCycleId = newCycleId;
      jo.finalGltResult = undefined;
      jo.approvedWorkstationId = undefined;
      jo.queueSequence = undefined;
      jo.updatedAt = now;
    } else {
      jo.status = 'READY_FOR_ALLOCATION';
      jo.currentCycleId = newCycleId;
      jo.approvedWorkstationId = undefined;
      jo.queueSequence = undefined;
      jo.updatedAt = now;
    }

    if (!this.isQuotaExhausted) {
      try {
        await updateDoc(doc(firestoreDb, 'jobOrders', joId), {
          status: jo.status,
          currentCycleId: jo.currentCycleId,
          finalGltResult: jo.finalGltResult || null,
          approvedWorkstationId: null,
          queueSequence: null,
          updatedAt: serverTimestamp()
        });
      } catch (e) {
        this.handleCloudError(e, 'reopenJobOrder');
      }
    }

    await this.logAudit('REOPEN_JO', 'JobOrder', joId, terminalId, 'SPV_QC', reason, { restartStage });
    this.notify();

    return { success: true };
  }

  /**
   * Cancel Job Order (Only allowed before Start GLT - Section 28)
   */
  public async cancelJobOrder(
    joId: string,
    reason: string,
    terminalId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!reason?.trim()) return { success: false, error: 'Mandatory cancellation reason required' };

    await ensureAuthenticated();
    const jo = this.getJobOrder(joId);
    if (!jo) return { success: false, error: 'Job order not found' };

    if (jo.status !== 'WAITING_GLT') {
      return { success: false, error: 'Pembatalan dilarang setelah inspeksi GLT dimulai.' };
    }

    jo.status = 'CANCELLED';
    jo.updatedAt = new Date().toISOString();

    if (!this.isQuotaExhausted) {
      try {
        await updateDoc(doc(firestoreDb, 'jobOrders', joId), {
          status: 'CANCELLED',
          updatedAt: serverTimestamp()
        });
      } catch (e) {
        this.handleCloudError(e, 'cancelJobOrder');
      }
    }

    await this.logAudit('CANCEL_JO', 'JobOrder', joId, terminalId, 'SPV_QC', reason);
    this.notify();

    return { success: true };
  }

  /**
   * Publish new version of Checksheet Template (Section 10)
   */
  public async publishChecksheetTemplate(
    template: ChecksheetTemplate,
    terminalId: string
  ): Promise<void> {
    await ensureAuthenticated();
    template.version += 1;
    template.publishedAt = new Date().toISOString();
    template.isPublished = true;

    const safeKey = sanitizeDocId(`PERF_${template.componentCategory}`);
    this.checksheetTemplates[safeKey] = template;

    if (!this.isQuotaExhausted) {
      try {
        await setDoc(doc(firestoreDb, 'checksheetTemplates', safeKey), {
          ...template,
          publishedAt: serverTimestamp()
        });
      } catch (e) {
        this.handleCloudError(e, 'publishChecksheetTemplate');
      }
    }

    await this.logAudit('PUBLISH_CHECKSHEET_VERSION', 'ChecksheetTemplate', template.id, terminalId, 'QUALITY_MASTER', undefined, { version: template.version });
    this.notify();
  }

  /**
   * Update AI Weights Configuration
   */
  public async updateAiWeights(weights: AiDispatchWeights, terminalId: string): Promise<void> {
    await ensureAuthenticated();
    this.aiWeights = weights;
    if (!this.isQuotaExhausted) {
      try {
        await setDoc(doc(firestoreDb, 'systemConfigs', 'aiWeights'), weights);
      } catch (e) {
        this.handleCloudError(e, 'updateAiWeights');
      }
    }
    await this.logAudit('UPDATE_AI_WEIGHTS', 'AiDispatchConfig', 'weights', terminalId, 'SPV_QC', undefined, { ...weights });
    this.notify();
  }

  /**
   * Update Working Calendar Configuration
   */
  public async updateWorkingCalendar(calendar: WorkingCalendarConfig, terminalId: string): Promise<void> {
    await ensureAuthenticated();
    this.workingCalendar = calendar;
    if (!this.isQuotaExhausted) {
      try {
        await setDoc(doc(firestoreDb, 'systemConfigs', 'calendar'), calendar);
      } catch (e) {
        this.handleCloudError(e, 'updateWorkingCalendar');
      }
    }
    await this.logAudit('UPDATE_WORKING_CALENDAR', 'WorkingCalendar', 'calendar', terminalId, 'SPV_QC', undefined, { ...calendar });
    this.notify();
  }

  // --- ASSEMBLER MANAGEMENT (PRIORITY 2) ---
  public getAssemblers(): { name: string; active: boolean }[] {
    return [...this.assemblers];
  }

  public getAssemblerNames(): string[] {
    return this.assemblers.filter((a) => a.active).map((a) => a.name);
  }

  public async saveAssemblers(list: { name: string; active: boolean }[], terminalId: string): Promise<void> {
    await ensureAuthenticated();
    this.assemblers = list;
    if (!this.isQuotaExhausted) {
      try {
        await setDoc(doc(firestoreDb, 'systemConfigs', 'assemblers'), { list }, { merge: true });
      } catch (e) {
        this.handleCloudError(e, 'saveAssemblers');
      }
    }
    await this.logAudit('UPDATE_ASSEMBLERS', 'SystemConfig', 'assemblers', terminalId, 'QUALITY_MASTER', undefined, { count: list.length });
    this.notify();
  }

  // --- LOCAL DRAFT AUTOSAVE APIS (RULE 7: localStorage ONLY for temporary offline drafts) ---
  public saveDraft(key: string, data: any) {
    this.draftStore[key] = { data, savedAt: Date.now() };
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`dynodyn_draft_${key}`, JSON.stringify({ data, savedAt: Date.now() }));
      }
    } catch {}
  }

  public getDraft(key: string): any {
    try {
      if (typeof localStorage !== 'undefined') {
        const item = localStorage.getItem(`dynodyn_draft_${key}`);
        if (item) return JSON.parse(item).data;
      }
    } catch {}
    return this.draftStore[key] ? this.draftStore[key].data : null;
  }

  public clearDraft(key: string) {
    delete this.draftStore[key];
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`dynodyn_draft_${key}`);
      }
    } catch {}
  }
}

export const db = new FirestoreDataStore();
