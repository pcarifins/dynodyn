import { ChecksheetTemplate } from '../types';

export const INITIAL_CHECKSHEET_TEMPLATES: Record<string, ChecksheetTemplate> = {
  // A. GLT Engine
  'GLT_Engine': {
    id: 'tpl_glt_engine',
    componentCategory: 'Engine',
    version: 1,
    publishedAt: '2026-10-01T00:00:00Z',
    isPublished: true,
    fixedStandardDurationMinutes: 30,
    slaTargetHours: 24,
    groups: [
      {
        name: 'GLT Inspection',
        order: 1,
        parameters: [
          {
            id: 'glt_eng_fuel',
            name: 'Fuel',
            group: 'GLT Inspection',
            description: 'Pemeriksaan kebocoran saluran bahan bakar, filter & water separator.',
            measurementType: 'BOOLEAN_GOOD_NG',
            stdDisplay: 'Kriteria Lolos: Tidak ada kebocoran bahan bakar',
            isMandatory: true,
            order: 1
          },
          {
            id: 'glt_eng_water',
            name: 'Water',
            group: 'GLT Inspection',
            description: 'Pemeriksaan sistem pendingin radiator, klem selang, level coolant & seal pompa.',
            measurementType: 'BOOLEAN_GOOD_NG',
            stdDisplay: 'Kriteria Lolos: Sirkulasi normal, tanpa rembesan',
            isMandatory: true,
            order: 2
          },
          {
            id: 'glt_eng_combustion',
            name: 'Combustion',
            group: 'GLT Inspection',
            description: 'Pemeriksaan warna gas buang (asap knalpot), kompresi, dan kestabilan pembakaran.',
            measurementType: 'BOOLEAN_GOOD_NG',
            stdDisplay: 'Kriteria Lolos: Asap jernih/transparan, stabil',
            isMandatory: true,
            order: 3
          },
          {
            id: 'glt_eng_lubrication',
            name: 'Lubrication',
            group: 'GLT Inspection',
            description: 'Pemeriksaan level & sirkulasi oli pelumas, tekanan oli, serta gasket sambungan.',
            measurementType: 'BOOLEAN_GOOD_NG',
            stdDisplay: 'Kriteria Lolos: Tekanan oli sesuai, bebas kebocoran',
            isMandatory: true,
            order: 4
          }
        ]
      }
    ]
  },

  // B. GLT Power Train / PPM
  'GLT_Power Train': {
    id: 'tpl_glt_pt',
    componentCategory: 'Power Train',
    version: 1,
    publishedAt: '2026-10-01T00:00:00Z',
    isPublished: true,
    fixedStandardDurationMinutes: 30,
    slaTargetHours: 24,
    groups: [
      {
        name: 'Lubrication Inspection',
        order: 1,
        parameters: [
          {
            id: 'glt_pt_lubrication',
            name: 'Lubrication',
            group: 'Lubrication Inspection',
            description: 'Pemeriksaan level & sirkulasi oli pelumas, tekanan...',
            measurementType: 'BOOLEAN_GOOD_NG',
            stdDisplay: 'Kriteria Lolos: Level oli cukup, sirkulasi lancar',
            isMandatory: true,
            order: 1
          },
          {
            id: 'glt_pt_oilline',
            name: 'Oil Line Integrity',
            group: 'Lubrication Inspection',
            description: 'Kondisi fitting, sambungan pipa dan selang oli hidrolik.',
            measurementType: 'BOOLEAN_GOOD_NG',
            stdDisplay: 'Kriteria Lolos: Sambungan kencang, tidak kendur',
            isMandatory: true,
            order: 2
          },
          {
            id: 'glt_pt_leakage',
            name: 'External Leakage',
            group: 'Lubrication Inspection',
            description: 'Deteksi rembesan oli pada casing, shaft seal, dan mating face.',
            measurementType: 'BOOLEAN_GOOD_NG',
            stdDisplay: 'Kriteria Lolos: Kering 100%, zero leakage',
            isMandatory: true,
            order: 3
          }
        ]
      }
    ]
  },

  // Performance: Engine (D1, D2, D3)
  'PERF_Engine': {
    id: 'tpl_perf_engine',
    componentCategory: 'Engine',
    version: 1,
    publishedAt: '2026-10-01T00:00:00Z',
    isPublished: true,
    fixedStandardDurationMinutes: 120,
    slaTargetHours: 48,
    groups: [
      {
        name: 'Speed & Output Performance',
        order: 1,
        parameters: [
          {
            id: 'eng_low_idle',
            name: 'Low Idle Speed',
            group: 'Speed & Output Performance',
            measurementType: 'NUMERIC_RANGE',
            unit: 'RPM',
            minVal: 650,
            maxVal: 750,
            stdDisplay: 'Std: 650 – 750 RPM',
            isMandatory: true,
            order: 1
          },
          {
            id: 'eng_high_idle',
            name: 'High Idle Speed',
            group: 'Speed & Output Performance',
            measurementType: 'NUMERIC_RANGE',
            unit: 'RPM',
            minVal: 2000,
            maxVal: 2150,
            stdDisplay: 'Std: 2000 – 2150 RPM',
            isMandatory: true,
            order: 2
          },
          {
            id: 'eng_rated_power',
            name: 'Rated Output Power',
            group: 'Speed & Output Performance',
            measurementType: 'NUMERIC_RANGE',
            unit: 'HP',
            minVal: 550,
            maxVal: 2000,
            stdDisplay: 'Min: ≥ 550 HP',
            isMandatory: true,
            order: 3
          },
          {
            id: 'eng_intake_boost',
            name: 'Intake Manifold Boost Pressure',
            group: 'Speed & Output Performance',
            measurementType: 'NUMERIC_RANGE',
            unit: 'kPa',
            minVal: 120,
            maxVal: 220,
            stdDisplay: 'Std: 120 – 220 kPa',
            isMandatory: true,
            order: 4
          }
        ]
      },
      {
        name: 'Thermal & Blowby Health',
        order: 2,
        parameters: [
          {
            id: 'eng_exhaust_temp',
            name: 'Exhaust Gas Temperature Avg',
            group: 'Thermal & Blowby Health',
            measurementType: 'NUMERIC_RANGE',
            unit: '°C',
            minVal: 200,
            maxVal: 620,
            stdDisplay: 'Maks: ≤ 620 °C',
            isMandatory: true,
            order: 1
          },
          {
            id: 'eng_blowby_press',
            name: 'Crankcase Blow-by Pressure',
            group: 'Thermal & Blowby Health',
            measurementType: 'NUMERIC_RANGE',
            unit: 'kPa',
            minVal: 0,
            maxVal: 2.8,
            stdDisplay: 'Maks: ≤ 2.8 kPa',
            isMandatory: true,
            order: 2
          }
        ]
      }
    ]
  },

  // J. Axle & Final Drive HD
  'PERF_Axle & Final Drive HD': {
    id: 'tpl_perf_axle_hd',
    componentCategory: 'Axle & Final Drive HD',
    version: 1,
    publishedAt: '2026-10-01T00:00:00Z',
    isPublished: true,
    fixedStandardDurationMinutes: 90,
    slaTargetHours: 48,
    groups: [
      {
        name: 'Brake Pressure',
        order: 1,
        parameters: [
          {
            id: 'axle_pb_set',
            name: 'Parking Brake Release Pressure – Set',
            group: 'Brake Pressure',
            measurementType: 'NUMERIC_RANGE',
            unit: 'kg/cm²',
            minVal: 85,
            maxVal: 100,
            stdDisplay: 'Std: 85 – 100 kg/cm²',
            isMandatory: true,
            order: 1
          },
          {
            id: 'axle_pb_drop',
            name: 'Parking Brake Release Pressure – Drop',
            group: 'Brake Pressure',
            measurementType: 'NUMERIC_RANGE',
            unit: 'kg/cm²',
            minVal: 0,
            maxVal: 8,
            stdDisplay: 'Maks: ≤ 8 kg/cm²',
            isMandatory: true,
            order: 2
          },
          {
            id: 'axle_sb_set',
            name: 'Service Brake Release Pressure – Set',
            group: 'Brake Pressure',
            measurementType: 'NUMERIC_RANGE',
            unit: 'kg/cm²',
            minVal: 93,
            maxVal: 107,
            stdDisplay: 'Std: 93 – 107 kg/cm²',
            isMandatory: true,
            order: 3
          },
          {
            id: 'axle_sb_drop',
            name: 'Service Brake Release Pressure – Drop',
            group: 'Brake Pressure',
            measurementType: 'NUMERIC_RANGE',
            unit: 'kg/cm²',
            minVal: 0,
            maxVal: 6,
            stdDisplay: 'Maks: ≤ 6 kg/cm²',
            isMandatory: true,
            order: 4
          },
          {
            id: 'axle_brake_cooling',
            name: 'Brake Cooling Pressure',
            group: 'Brake Pressure',
            measurementType: 'NUMERIC_RANGE',
            unit: 'kg/cm²',
            minVal: 1,
            maxVal: 6,
            stdDisplay: 'Std: 1 – 6 kg/cm²',
            isMandatory: true,
            order: 5
          }
        ]
      },
      {
        name: 'Drag Torque and Temperature',
        order: 2,
        parameters: [
          {
            id: 'axle_drag_torque',
            name: 'Drag Torque',
            group: 'Drag Torque and Temperature',
            description: 'Pemeriksaan torsi pengencangan baut atau resistansi rotasi...',
            measurementType: 'NUMERIC_RANGE',
            unit: 'Nm',
            minVal: 196,
            maxVal: 637,
            stdDisplay: 'Std: 196 – 637 Nm',
            isMandatory: true,
            order: 1
          },
          {
            id: 'axle_temp',
            name: 'Temperature',
            group: 'Drag Torque and Temperature',
            measurementType: 'NUMERIC_RANGE',
            unit: '°C',
            minVal: 50,
            maxVal: 55,
            stdDisplay: 'Std: 50 – 55 °C',
            isMandatory: true,
            order: 2
          }
        ]
      },
      {
        name: 'Noise and Leakage',
        order: 3,
        parameters: [
          {
            id: 'axle_noise',
            name: 'Gearmesh Noise Level',
            group: 'Noise and Leakage',
            measurementType: 'QUALITATIVE',
            unit: 'dB',
            minVal: 0,
            maxVal: 98,
            stdDisplay: 'Maks: < 98 dB / Halus',
            isMandatory: true,
            order: 1
          },
          {
            id: 'axle_leak',
            name: 'Housing & Seal Leakage',
            group: 'Noise and Leakage',
            measurementType: 'BOOLEAN_GOOD_NG',
            stdDisplay: 'Zero Leakage (Lolos)',
            isMandatory: true,
            order: 2
          }
        ]
      }
    ]
  },

  // E. Pump Front / Rear
  'PERF_Pump Front/Rear': {
    id: 'tpl_perf_pump',
    componentCategory: 'Pump Front/Rear',
    version: 1,
    publishedAt: '2026-10-01T00:00:00Z',
    isPublished: true,
    fixedStandardDurationMinutes: 80,
    slaTargetHours: 48,
    groups: [
      {
        name: 'Hydraulic Flow & Pressure',
        order: 1,
        parameters: [
          {
            id: 'pump_flow_max',
            name: 'Flow Rate Max',
            group: 'Hydraulic Flow & Pressure',
            measurementType: 'NUMERIC_RANGE',
            unit: 'L/min',
            minVal: 155,
            maxVal: 160,
            stdDisplay: 'Std: 155 – 160 L/min',
            isMandatory: true,
            order: 1
          },
          {
            id: 'pump_flow_min',
            name: 'Flow Rate Min',
            group: 'Hydraulic Flow & Pressure',
            measurementType: 'NUMERIC_RANGE',
            unit: 'L/min',
            minVal: 17,
            maxVal: 22,
            stdDisplay: 'Std: 17 – 22 L/min',
            isMandatory: true,
            order: 2
          },
          {
            id: 'pump_nc_press_max',
            name: 'NC Output Pressure Max',
            group: 'Hydraulic Flow & Pressure',
            measurementType: 'NUMERIC_RANGE',
            unit: 'kg/cm²',
            minVal: 20.1,
            maxVal: 45,
            stdDisplay: 'Maks: > 20 kg/cm²',
            isMandatory: true,
            order: 3
          },
          {
            id: 'pump_nc_press_min',
            name: 'NC Output Pressure Min',
            group: 'Hydraulic Flow & Pressure',
            measurementType: 'NUMERIC_RANGE',
            unit: 'kg/cm²',
            minVal: 0,
            maxVal: 0.5,
            stdDisplay: 'Std: 0 kg/cm²',
            isMandatory: true,
            order: 4
          },
          {
            id: 'pump_oil_temp',
            name: 'Oil Temperature',
            group: 'Hydraulic Flow & Pressure',
            measurementType: 'NOMINAL_TOLERANCE',
            unit: '°C',
            nominalVal: 50,
            tolerance: 5,
            minVal: 45,
            maxVal: 55,
            stdDisplay: 'Std: 50 ± 5 °C',
            isMandatory: true,
            order: 5
          }
        ]
      }
    ]
  },

  // F. Motor
  'PERF_Motor': {
    id: 'tpl_perf_motor',
    componentCategory: 'Motor',
    version: 1,
    publishedAt: '2026-10-01T00:00:00Z',
    isPublished: true,
    fixedStandardDurationMinutes: 75,
    slaTargetHours: 48,
    groups: [
      {
        name: 'Motor Performance',
        order: 1,
        parameters: [
          {
            id: 'motor_rpm',
            name: 'Motor RPM',
            group: 'Motor Performance',
            measurementType: 'NOMINAL_TOLERANCE',
            unit: 'RPM',
            nominalVal: 450,
            tolerance: 10,
            minVal: 440,
            maxVal: 460,
            stdDisplay: 'Std: 450 ± 10 RPM',
            isMandatory: true,
            order: 1
          },
          {
            id: 'motor_safety_valve',
            name: 'Safety Valve PA/PB',
            group: 'Motor Performance',
            measurementType: 'NOMINAL_TOLERANCE',
            unit: 'kg/cm²',
            nominalVal: 337.2,
            tolerance: 3.5,
            minVal: 333.7,
            maxVal: 340.7,
            stdDisplay: 'Std: 337.2 ± 3.5 kg/cm²',
            isMandatory: true,
            order: 2
          },
          {
            id: 'motor_brake_release',
            name: 'Brake Release',
            group: 'Motor Performance',
            measurementType: 'NOMINAL_TOLERANCE',
            unit: 'kg/cm²',
            nominalVal: 15,
            tolerance: 2,
            minVal: 13,
            maxVal: 17,
            stdDisplay: 'Std: 15 ± 2 kg/cm²',
            isMandatory: true,
            order: 3
          },
          {
            id: 'motor_oil_temp',
            name: 'Oil Temperature',
            group: 'Motor Performance',
            measurementType: 'NOMINAL_TOLERANCE',
            unit: '°C',
            nominalVal: 50,
            tolerance: 5,
            minVal: 45,
            maxVal: 55,
            stdDisplay: 'Std: 50 ± 5 °C',
            isMandatory: true,
            order: 4
          },
          {
            id: 'motor_noise',
            name: 'Operation Noise',
            group: 'Motor Performance',
            measurementType: 'BOOLEAN_GOOD_NG',
            stdDisplay: 'Normal / Bebas Suara Abnormal',
            isMandatory: true,
            order: 5
          },
          {
            id: 'motor_leakage',
            name: 'Case Drain Leakage',
            group: 'Motor Performance',
            measurementType: 'BOOLEAN_GOOD_NG',
            stdDisplay: 'Bebas Kebocoran',
            isMandatory: true,
            order: 6
          }
        ]
      }
    ]
  },

  // D. Cylinder
  'PERF_Cylinder': {
    id: 'tpl_perf_cylinder',
    componentCategory: 'Cylinder',
    version: 1,
    publishedAt: '2026-10-01T00:00:00Z',
    isPublished: true,
    fixedStandardDurationMinutes: 60,
    slaTargetHours: 48,
    groups: [
      {
        name: 'Pressure & Seal Tests',
        order: 1,
        parameters: [
          {
            id: 'cyl_ext_leak',
            name: 'External Leakage',
            group: 'Pressure & Seal Tests',
            measurementType: 'BOOLEAN_GOOD_NG',
            stdDisplay: 'Zero Drops / Kering',
            isMandatory: true,
            order: 1
          },
          {
            id: 'cyl_int_leak',
            name: 'Internal Leakage',
            group: 'Pressure & Seal Tests',
            measurementType: 'NUMERIC_RANGE',
            unit: 'cc/min',
            minVal: 0,
            maxVal: 10,
            stdDisplay: 'Maks: ≤ 10 cc/min',
            isMandatory: true,
            order: 2
          },
          {
            id: 'cyl_press_up',
            name: 'Pressure Power Up',
            group: 'Pressure & Seal Tests',
            measurementType: 'NUMERIC_RANGE',
            unit: 'kg/cm²',
            minVal: 210,
            maxVal: 280,
            stdDisplay: 'Std: 210 – 280 kg/cm²',
            isMandatory: true,
            order: 3
          },
          {
            id: 'cyl_press_down',
            name: 'Pressure Power Down',
            group: 'Pressure & Seal Tests',
            measurementType: 'NUMERIC_RANGE',
            unit: 'kg/cm²',
            minVal: 210,
            maxVal: 280,
            stdDisplay: 'Std: 210 – 280 kg/cm²',
            isMandatory: true,
            order: 4
          }
        ]
      }
    ]
  },

  // I. Differential
  'PERF_Differential': {
    id: 'tpl_perf_differential',
    componentCategory: 'Differential',
    version: 1,
    publishedAt: '2026-10-01T00:00:00Z',
    isPublished: true,
    fixedStandardDurationMinutes: 75,
    slaTargetHours: 48,
    groups: [
      {
        name: 'Differential Operation & Lock',
        order: 1,
        parameters: [
          {
            id: 'diff_rpm',
            name: 'Input RPM',
            group: 'Differential Operation & Lock',
            measurementType: 'NUMERIC_RANGE',
            unit: 'RPM',
            minVal: 300,
            maxVal: 400,
            stdDisplay: 'Std: 300 – 400 RPM',
            isMandatory: true,
            order: 1
          },
          {
            id: 'diff_temp',
            name: 'Sump Temperature',
            group: 'Differential Operation & Lock',
            measurementType: 'NUMERIC_RANGE',
            unit: '°C',
            minVal: 45,
            maxVal: 55,
            stdDisplay: 'Std: 45 – 55 °C',
            isMandatory: true,
            order: 2
          },
          {
            id: 'diff_lock_press',
            name: 'Differential Lock Pressure',
            group: 'Differential Operation & Lock',
            measurementType: 'NOMINAL_TOLERANCE',
            unit: 'kg/cm²',
            nominalVal: 10,
            tolerance: 5,
            minVal: 5,
            maxVal: 15,
            stdDisplay: 'Std: 10 ± 5 kg/cm²',
            isMandatory: true,
            order: 3
          },
          {
            id: 'diff_sensor_lhrh',
            name: 'Output Speed Sensor LH/RH',
            group: 'Differential Operation & Lock',
            measurementType: 'BOOLEAN_GOOD_NG',
            stdDisplay: 'Signal Pulses Match (Lolos)',
            isMandatory: true,
            order: 4
          },
          {
            id: 'diff_noise',
            name: 'Gear Mesh Noise',
            group: 'Differential Operation & Lock',
            measurementType: 'BOOLEAN_GOOD_NG',
            stdDisplay: 'Suara Normal Halus',
            isMandatory: true,
            order: 5
          }
        ]
      }
    ]
  },

  // O. Torqflow
  'PERF_Torqflow': {
    id: 'tpl_perf_torqflow',
    componentCategory: 'Torqflow',
    version: 1,
    publishedAt: '2026-10-01T00:00:00Z',
    isPublished: true,
    fixedStandardDurationMinutes: 90,
    slaTargetHours: 48,
    groups: [
      {
        name: 'Relief & Modulating Pressure',
        order: 1,
        parameters: [
          {
            id: 'tf_main_relief',
            name: 'Main Relief Pressure',
            group: 'Relief & Modulating Pressure',
            measurementType: 'NUMERIC_RANGE',
            unit: 'kg/cm²',
            minVal: 32,
            maxVal: 36,
            stdDisplay: 'Std: 32 – 36 kg/cm²',
            isMandatory: true,
            order: 1
          },
          {
            id: 'tf_tc_outlet',
            name: 'TC Outlet Pressure',
            group: 'Relief & Modulating Pressure',
            measurementType: 'NUMERIC_RANGE',
            unit: 'kg/cm²',
            minVal: 4,
            maxVal: 6,
            stdDisplay: 'Std: 4 – 6 kg/cm²',
            isMandatory: true,
            order: 2
          },
          {
            id: 'tf_lockup_press',
            name: 'Lock Up Pressure',
            group: 'Relief & Modulating Pressure',
            measurementType: 'NUMERIC_RANGE',
            unit: 'kg/cm²',
            minVal: 20.5,
            maxVal: 24.5,
            stdDisplay: 'Std: 20.5 – 24.5 kg/cm²',
            isMandatory: true,
            order: 3
          },
          {
            id: 'tf_noise_level',
            name: 'Noise Level',
            group: 'Relief & Modulating Pressure',
            measurementType: 'NUMERIC_RANGE',
            unit: 'dB',
            minVal: 0,
            maxVal: 95,
            stdDisplay: 'Maks: < 95 dB',
            isMandatory: true,
            order: 4
          }
        ]
      }
    ]
  },

  // M. Transmission GD
  'PERF_Transmission GD': {
    id: 'tpl_perf_trans_gd',
    componentCategory: 'Transmission GD',
    version: 1,
    publishedAt: '2026-10-01T00:00:00Z',
    isPublished: true,
    fixedStandardDurationMinutes: 100,
    slaTargetHours: 48,
    groups: [
      {
        name: 'Main & Inching Pressure',
        order: 1,
        parameters: [
          {
            id: 'tgd_main_p1',
            name: 'Main P1 Pressure',
            group: 'Main & Inching Pressure',
            measurementType: 'NUMERIC_RANGE',
            unit: 'kg/cm²',
            minVal: 27,
            maxVal: 31,
            stdDisplay: 'Std: 27 – 31 kg/cm²',
            isMandatory: true,
            order: 1
          },
          {
            id: 'tgd_inching_release',
            name: 'Inching P4 Release',
            group: 'Main & Inching Pressure',
            measurementType: 'NUMERIC_RANGE',
            unit: 'kg/cm²',
            minVal: 0.5,
            maxVal: 1.3,
            stdDisplay: 'Std: 0.5 – 1.3 kg/cm²',
            isMandatory: true,
            order: 2
          },
          {
            id: 'tgd_inching_inside',
            name: 'Inching P4 Inside',
            group: 'Main & Inching Pressure',
            measurementType: 'NUMERIC_RANGE',
            unit: 'kg/cm²',
            minVal: 27,
            maxVal: 31,
            stdDisplay: 'Std: 27 – 31 kg/cm²',
            isMandatory: true,
            order: 3
          },
          {
            id: 'tgd_noise',
            name: 'Acoustic Sound Level',
            group: 'Main & Inching Pressure',
            measurementType: 'NUMERIC_RANGE',
            unit: 'dB',
            minVal: 0,
            maxVal: 103,
            stdDisplay: 'Maks: < 103 dB',
            isMandatory: true,
            order: 4
          }
        ]
      }
    ]
  },

  // N. Transmission WA
  'PERF_Transmission WA': {
    id: 'tpl_perf_trans_wa',
    componentCategory: 'Transmission WA',
    version: 1,
    publishedAt: '2026-10-01T00:00:00Z',
    isPublished: true,
    fixedStandardDurationMinutes: 95,
    slaTargetHours: 48,
    groups: [
      {
        name: 'Relief & Modulating',
        order: 1,
        parameters: [
          {
            id: 'twa_main_relief',
            name: 'Main Relief Pressure',
            group: 'Relief & Modulating',
            measurementType: 'NUMERIC_RANGE',
            unit: 'kg/cm²',
            minVal: 27,
            maxVal: 30,
            stdDisplay: 'Std: 27 – 30 kg/cm²',
            isMandatory: true,
            order: 1
          },
          {
            id: 'twa_red_press',
            name: 'Reducing Pressure',
            group: 'Relief & Modulating',
            measurementType: 'NUMERIC_RANGE',
            unit: 'kg/cm²',
            minVal: 19,
            maxVal: 22,
            stdDisplay: 'Std: 19 – 22 kg/cm²',
            isMandatory: true,
            order: 2
          },
          {
            id: 'twa_tc_relief',
            name: 'TC Relief Pressure',
            group: 'Relief & Modulating',
            measurementType: 'NUMERIC_RANGE',
            unit: 'kg/cm²',
            minVal: 7,
            maxVal: 9,
            stdDisplay: 'Std: 7 – 9 kg/cm²',
            isMandatory: true,
            order: 3
          },
          {
            id: 'twa_mod_time',
            name: 'Modulating Time',
            group: 'Relief & Modulating',
            measurementType: 'NUMERIC_RANGE',
            unit: 's',
            minVal: 0.5,
            maxVal: 0.8,
            stdDisplay: 'Std: 0.5 – 0.8 s',
            isMandatory: true,
            order: 4
          }
        ]
      }
    ]
  },

  // L. Power Module All Series
  'PERF_Power Module All Series': {
    id: 'tpl_perf_power_module',
    componentCategory: 'Power Module All Series',
    version: 1,
    publishedAt: '2026-10-01T00:00:00Z',
    isPublished: true,
    fixedStandardDurationMinutes: 110,
    slaTargetHours: 48,
    groups: [
      {
        name: 'Relief & Pressure Systems',
        order: 1,
        parameters: [
          {
            id: 'pm_main_relief',
            name: 'Main Relief',
            group: 'Relief & Pressure Systems',
            measurementType: 'NUMERIC_RANGE',
            unit: 'MPa',
            minVal: 28.7,
            maxVal: 31.7,
            stdDisplay: 'Std: 28.7 – 31.7 MPa',
            isMandatory: true,
            order: 1
          },
          {
            id: 'pm_output_shaft',
            name: 'Output Shaft Speed',
            group: 'Relief & Pressure Systems',
            measurementType: 'NUMERIC_RANGE',
            unit: 'RPM',
            minVal: 760,
            maxVal: 845,
            stdDisplay: 'Std: 760 – 845 RPM',
            isMandatory: true,
            order: 2
          },
          {
            id: 'pm_tc_in',
            name: 'Torque Converter Input',
            group: 'Relief & Pressure Systems',
            measurementType: 'NUMERIC_RANGE',
            unit: 'MPa',
            minVal: 0.39,
            maxVal: 0.59,
            stdDisplay: 'Std: 0.39 – 0.59 MPa',
            isMandatory: true,
            order: 3
          },
          {
            id: 'pm_tc_out',
            name: 'Torque Converter Output',
            group: 'Relief & Pressure Systems',
            measurementType: 'NUMERIC_RANGE',
            unit: 'MPa',
            minVal: 0.05,
            maxVal: 0.49,
            stdDisplay: 'Std: 0.05 – 0.49 MPa',
            isMandatory: true,
            order: 4
          },
          {
            id: 'pm_sudden_prevention',
            name: 'Sudden Brake Prevention Valve',
            group: 'Relief & Pressure Systems',
            measurementType: 'NUMERIC_RANGE',
            unit: 'MPa',
            minVal: 0,
            maxVal: 0.2,
            stdDisplay: 'Std: 0 – 0.2 MPa',
            isMandatory: true,
            order: 5
          },
          {
            id: 'pm_sudden_privation',
            name: 'Sudden Brake Privation Valve',
            group: 'Relief & Pressure Systems',
            measurementType: 'NUMERIC_RANGE',
            unit: 'MPa',
            minVal: 1.18,
            maxVal: 1.57,
            stdDisplay: 'Std: 1.18 – 1.57 MPa',
            isMandatory: true,
            order: 6
          },
          {
            id: 'pm_noise_limit',
            name: 'Max Sound Threshold',
            group: 'Relief & Pressure Systems',
            measurementType: 'NUMERIC_RANGE',
            unit: 'dB',
            minVal: 0,
            maxVal: 105,
            stdDisplay: 'Maks: < 105 dB',
            isMandatory: true,
            order: 7
          }
        ]
      }
    ]
  },

  // C. PTO
  'PERF_PTO': {
    id: 'tpl_perf_pto',
    componentCategory: 'PTO',
    version: 1,
    publishedAt: '2026-10-01T00:00:00Z',
    isPublished: true,
    fixedStandardDurationMinutes: 60,
    slaTargetHours: 48,
    groups: [
      {
        name: 'PTO Operational Checks',
        order: 1,
        parameters: [
          {
            id: 'pto_lubrication',
            name: 'Lubrication Flow',
            group: 'PTO Operational Checks',
            measurementType: 'BOOLEAN_GOOD_NG',
            stdDisplay: 'Lolos (Sirkulasi Sesuai)',
            isMandatory: true,
            order: 1
          },
          {
            id: 'pto_noise',
            name: 'Gear Acoustic Noise',
            group: 'PTO Operational Checks',
            measurementType: 'BOOLEAN_GOOD_NG',
            stdDisplay: 'Lolos (Bebas Bunyi Kasar)',
            isMandatory: true,
            order: 2
          },
          {
            id: 'pto_leakage',
            name: 'Casing & Seal Leakage',
            group: 'PTO Operational Checks',
            measurementType: 'BOOLEAN_GOOD_NG',
            stdDisplay: 'Zero Leakage',
            isMandatory: true,
            order: 3
          }
        ]
      }
    ]
  },

  // G. Final Drive GD
  'PERF_Final Drive GD': {
    id: 'tpl_perf_fd_gd',
    componentCategory: 'Final Drive GD',
    version: 1,
    publishedAt: '2026-10-01T00:00:00Z',
    isPublished: true,
    fixedStandardDurationMinutes: 70,
    slaTargetHours: 48,
    groups: [
      {
        name: 'Drive & Lock Parameters',
        order: 1,
        parameters: [
          {
            id: 'fd_gd_rpm',
            name: 'Operating RPM',
            group: 'Drive & Lock Parameters',
            measurementType: 'NUMERIC_RANGE',
            unit: 'RPM',
            minVal: 200,
            maxVal: 500,
            stdDisplay: 'Std: 200 – 500 RPM',
            isMandatory: true,
            order: 1
          },
          {
            id: 'fd_gd_diff_lock',
            name: 'Differential Lock Pressure',
            group: 'Drive & Lock Parameters',
            measurementType: 'EXACT_VALUE',
            unit: 'MPa',
            exactVal: 2.5,
            minVal: 2.4,
            maxVal: 2.6,
            stdDisplay: 'Std: 2.5 MPa',
            isMandatory: true,
            order: 2
          },
          {
            id: 'fd_gd_noise',
            name: 'Planetary Gear Noise',
            group: 'Drive & Lock Parameters',
            measurementType: 'BOOLEAN_GOOD_NG',
            stdDisplay: 'Suara Halus & Konstan',
            isMandatory: true,
            order: 3
          },
          {
            id: 'fd_gd_leakage',
            name: 'Seal & O-ring Leakage',
            group: 'Drive & Lock Parameters',
            measurementType: 'BOOLEAN_GOOD_NG',
            stdDisplay: 'Zero Leakage',
            isMandatory: true,
            order: 4
          }
        ]
      }
    ]
  },

  // H. Final Drive PC-DZ
  'PERF_Final Drive PC-DZ': {
    id: 'tpl_perf_fd_pcdz',
    componentCategory: 'Final Drive PC-DZ',
    version: 1,
    publishedAt: '2026-10-01T00:00:00Z',
    isPublished: true,
    fixedStandardDurationMinutes: 75,
    slaTargetHours: 48,
    groups: [
      {
        name: 'Staged RPM & Sound',
        order: 1,
        parameters: [
          {
            id: 'fd_pc_rpm1',
            name: 'RPM Stage I',
            group: 'Staged RPM & Sound',
            measurementType: 'NUMERIC_RANGE',
            unit: 'RPM',
            minVal: 95,
            maxVal: 105,
            stdDisplay: 'Std: 100 RPM',
            isMandatory: true,
            order: 1
          },
          {
            id: 'fd_pc_rpm2',
            name: 'RPM Stage II',
            group: 'Staged RPM & Sound',
            measurementType: 'NUMERIC_RANGE',
            unit: 'RPM',
            minVal: 190,
            maxVal: 210,
            stdDisplay: 'Std: 200 RPM',
            isMandatory: true,
            order: 2
          },
          {
            id: 'fd_pc_noise',
            name: 'Bearing & Gear Noise',
            group: 'Staged RPM & Sound',
            measurementType: 'BOOLEAN_GOOD_NG',
            stdDisplay: 'Lolos / Bebas Vibrasi',
            isMandatory: true,
            order: 3
          },
          {
            id: 'fd_pc_leakage',
            name: 'Floating Seal Leakage',
            group: 'Staged RPM & Sound',
            measurementType: 'BOOLEAN_GOOD_NG',
            stdDisplay: 'Zero Leakage',
            isMandatory: true,
            order: 4
          }
        ]
      }
    ]
  },

  // K. Front Brake & Front Axle
  'PERF_Front Brake & Front Axle': {
    id: 'tpl_perf_fb_fa',
    componentCategory: 'Front Brake & Front Axle',
    version: 1,
    publishedAt: '2026-10-01T00:00:00Z',
    isPublished: true,
    fixedStandardDurationMinutes: 85,
    slaTargetHours: 48,
    groups: [
      {
        name: 'Brake & Torque Standards',
        order: 1,
        parameters: [
          {
            id: 'fb_parking_brake',
            name: 'Parking Brake Pressure',
            group: 'Brake & Torque Standards',
            measurementType: 'NUMERIC_RANGE',
            unit: 'kg/cm²',
            minVal: 85,
            maxVal: 100,
            stdDisplay: 'Std: 85 – 100 kg/cm²',
            isMandatory: true,
            order: 1
          },
          {
            id: 'fb_service_brake',
            name: 'Service Brake Pressure',
            group: 'Brake & Torque Standards',
            measurementType: 'NUMERIC_RANGE',
            unit: 'kg/cm²',
            minVal: 93,
            maxVal: 107,
            stdDisplay: 'Std: 93 – 107 kg/cm²',
            isMandatory: true,
            order: 2
          },
          {
            id: 'fb_cooling',
            name: 'Brake Cooling Pressure',
            group: 'Brake & Torque Standards',
            measurementType: 'NOMINAL_TOLERANCE',
            unit: 'kg/cm²',
            nominalVal: 5,
            tolerance: 1,
            minVal: 4,
            maxVal: 6,
            stdDisplay: 'Std: 5 ± 1 kg/cm²',
            isMandatory: true,
            order: 3
          },
          {
            id: 'fb_drag_cw',
            name: 'Drag Torque CW (at 30 ± 5 RPM)',
            group: 'Brake & Torque Standards',
            measurementType: 'NUMERIC_RANGE',
            unit: 'Nm',
            minVal: 196,
            maxVal: 637,
            stdDisplay: 'Std: 196 – 637 Nm',
            isMandatory: true,
            order: 4
          },
          {
            id: 'fb_drag_ccw',
            name: 'Drag Torque CCW (at 75 ± 5 RPM)',
            group: 'Brake & Torque Standards',
            measurementType: 'NUMERIC_RANGE',
            unit: 'Nm',
            minVal: 196,
            maxVal: 735,
            stdDisplay: 'Std: 196 – 735 Nm',
            isMandatory: true,
            order: 5
          },
          {
            id: 'fb_temp',
            name: 'Oil Operating Temperature',
            group: 'Brake & Torque Standards',
            measurementType: 'NUMERIC_RANGE',
            unit: '°C',
            minVal: 50,
            maxVal: 55,
            stdDisplay: 'Std: 50 – 55 °C',
            isMandatory: true,
            order: 6
          }
        ]
      }
    ]
  }
};
