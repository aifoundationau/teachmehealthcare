export interface Annotation {
  id: string;
  type: "ellipse" | "arrow" | "caliper" | "label";
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width?: number; // percentage
  height?: number; // percentage
  label: string;
  measurement?: string;
  color?: string;
}

export const IMGBB_API_KEY = "89dbf8bab69adf99de2c727bd9de3e37";
export const IMGBB_UPLOAD_URL = "https://api.imgbb.com/1/upload";
export const IMGBB_ALBUM_URL = "https://ibb.co/album/TKRnX5";

export interface CaseroomMessage {
  id: string;
  senderName: string;
  role: "Physician" | "Teacher" | "Student";
  avatarColor: string;
  avatarUrl?: string;
  time: string;
  message: string;
}

export interface RegionalNewsArticle {
  id: string;
  title: string;
  excerpt: string;
  fullContent: string;
  date: string;
  source: string;
  region: string;
}

export interface AcademicArticle {
  id: string;
  title: string;
  excerpt: string;
  abstract: string;
  journal: string;
  authors: string;
  year: number;
  pmid: string;
  pmcid?: string;
  doi: string;
  ncbiUrl: string;
}

export interface MedicalScanItem {
  id: string;
  category: string;
  title: string;
  modality: "X-Ray" | "CT" | "MRI" | "Ultrasound" | "Nuclear Medicine" | "Fluoroscopy" | "Endoscopy" | "Electrophysiology" | "Pathology" | "Clinical Record";
  patientCase: string;
  finding: string;
  badge: string;
  image: string;
  thumbnail: string;
  bodyRegion: string;
  clinicalSummary: string;
  patientAge: number;
  patientGender: "Male" | "Female" | "Other";
  history: string;
  annotations: Annotation[];
  caseroom: CaseroomMessage[];
  news: RegionalNewsArticle[];
  academic: AcademicArticle[];
}

export const SCAN_CATEGORIES = [
  "All Modalities",
  "X-Ray (Plain Radiography)",
  "CT Scan (Computed Tomography)",
  "MRI (Magnetic Resonance Imaging)",
  "Ultrasound (Sonography)",
  "Fluoroscopy & Contrast GI",
  "Nuclear Medicine & Scintigraphy",
  "Mammography & DEXA",
  "Angiography & Interventional",
  "Endoscopy & Direct Visualization",
  "Clinical Electrophysiology (ECG/EEG/EMG)",
  "Pathology & Laboratory Reports",
  "Clinical Encounter Records"
] as const;

export const INITIAL_MEDICAL_SCANS: MedicalScanItem[] = [
  {
    id: "cxr-ap-4029",
    category: "X-Ray (Plain Radiography)",
    title: "Chest X-Ray (A-P View)",
    modality: "X-Ray",
    patientCase: "#4029",
    finding: "RML & RLL Consolidation (Pneumonia)",
    badge: "CHEST X-RAY (A-P VIEW)",
    image: "https://i.ibb.co/xQx79T8/cxr-ap.jpg",
    thumbnail: "https://i.ibb.co/8V17vZ4/cxr-ap.jpg",
    bodyRegion: "Thorax / Chest",
    clinicalSummary: "Marked alveolar consolidation in the right middle and lower lobes with air bronchograms, consistent with acute community-acquired lobar pneumonia.",
    patientAge: 48,
    patientGender: "Male",
    history: "48-year-old remote agricultural worker presenting with 4-day history of high fevers (39.2°C), productive rusty sputum, pleuritic right-sided chest pain, and SpO2 91% on room air.",
    annotations: [
      {
        id: "ann-1",
        type: "ellipse",
        x: 58,
        y: 68,
        width: 28,
        height: 22,
        label: "Lower Lobe Opacity / Infiltration",
        measurement: "8.4 cm × 6.2 cm",
        color: "#38bdf8"
      },
      {
        id: "ann-2",
        type: "arrow",
        x: 48,
        y: 78,
        label: "Air Bronchogram Pattern",
        color: "#38bdf8"
      }
    ],
    caseroom: [
      {
        id: "msg-1",
        senderName: "Dr. Sarah Jennings",
        role: "Physician",
        avatarColor: "from-blue-600 to-cyan-600",
        time: "10:14 AM",
        message: "Take a look at the consolidation in the lower right lobe on the X-ray, team. What does this suggest when paired with the patient's acute fever?"
      },
      {
        id: "msg-2",
        senderName: "Prof. Marcus Vance",
        role: "Teacher",
        avatarColor: "from-amber-600 to-orange-600",
        time: "10:16 AM",
        message: "Excellent point, Dr. Jennings. Class, observe the density and silhouette sign with the right hemidiaphragm. Alex, can you compare this to the patient's symptoms?"
      },
      {
        id: "msg-3",
        senderName: "Alex Lee",
        role: "Student",
        avatarColor: "from-emerald-600 to-teal-600",
        time: "10:19 AM",
        message: "It looks like lobar pneumonia with prominent airspace opacification, but we need to rule out an associated parapneumonic pleural effusion. The CT scan also confirms lower lobe infiltration."
      },
      {
        id: "msg-4",
        senderName: "Dr. Sarah Jennings",
        role: "Physician",
        avatarColor: "from-blue-600 to-cyan-600",
        time: "10:21 AM",
        message: "Exactly, Alex! Pay close attention to the costophrenic angle and lateral margins on the X-ray. Notice how the meniscus sign would look if fluid blunted the sulcus."
      }
    ],
    news: [
      {
        id: "news-1",
        title: "Queensland Hospitals Report Spike in Winter Thoracic Infections",
        excerpt: "Healthcare facilities across Southeast Queensland are seeing an influx of atypical pneumonia cases, prompting clinicians to raise awareness...",
        fullContent: "HOSPITAL ALERT & CLINICAL EPIDEMIOLOGY: Queensland regional health services and metropolitan facilities across Brisbane and Gold Coast have issued a public health advisory regarding a 34% increase in respiratory presentations with atypical bacterial and viral pneumonia. Medical educators emphasize early radiological identification and point-of-care lung ultrasound in remote community clinics where tertiary radiology transfer times exceed 6 hours.",
        date: "October 14, 2026",
        source: "Queensland Health Clinical Dispatch",
        region: "Gold Coast / Brisbane, QLD"
      },
      {
        id: "news-2",
        title: "Brisbane Radiology Seminar to Showcase Advanced Diagnostic AI",
        excerpt: "Local medical professionals and students will gather next month to discuss breakthroughs in collaborative chest imaging...",
        fullContent: "REGIONAL MEDICAL CONFERENCE: The Royal Australian and New Zealand College of Radiologists (RANZCR) Queensland branch announced a dedicated clinical symposium on AI-assisted diagnostic workflows for remote health outposts. The program focuses on bridging radiology interpretation gaps for healthcare interns stationed in rural and indigenous health clinics across regional Queensland and Northern Territory.",
        date: "October 11, 2026",
        source: "Australasian Medical Herald",
        region: "Brisbane Metro & Regional QLD"
      }
    ],
    academic: [
      {
        id: "acad-1",
        title: "Efficacy of Multimodal Scans (X-Ray, MRI, CT) in Lobar Pneumonia Diagnosis",
        excerpt: "A retrospective cohort study evaluating the diagnostic accuracy of chest radiographs and MRIs in identifying complex pulmonary infections...",
        abstract: "BACKGROUND: Accurate differentiation of bacterial lobar consolidation from acute respiratory distress or malignant atelectasis remains challenging in acute care. METHODS: We evaluated 1,420 prospective patients undergoing initial CXR followed by high-resolution CT and thoracic MRI. RESULTS: Multimodal correlation demonstrated a diagnostic sensitivity of 94.2% (95% CI: 91.8-96.1%) for combined CXR and thoracic ultrasound, providing non-inferior accuracy to CT in remote resource-limited healthcare environments.",
        journal: "Journal of Thoracic Imaging",
        authors: "Jennings S, Vance M, Chen E, et al.",
        year: 2025,
        pmid: "39201482",
        pmcid: "PMC10928472",
        doi: "10.1097/RTI.0000000000000812",
        ncbiUrl: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10928472/"
      },
      {
        id: "acad-2",
        title: "Differential Diagnosis of Pulmonary Consolidation and Effusion in Clinical Practice",
        excerpt: "Understanding radiological variations between pleural effusion and consolidation is critical for timely therapeutic interventions...",
        abstract: "CLINICAL REVIEW: The radiological presence of air bronchograms versus compressive passive atelectasis provides the cornerstone for distinguishing pure parenchymal infection from pleural space disease. We detail algorithmic management protocols for rural general practitioners dealing with evolving parapneumonic effusions.",
        journal: "The Lancet Respiratory Medicine",
        authors: "Morrison K, Alvarez D, Patel R.",
        year: 2024,
        pmid: "38472911",
        doi: "10.1016/S2213-2600(24)00045-8",
        ncbiUrl: "https://www.ncbi.nlm.nih.gov/pubmed/38472911"
      }
    ]
  },
  {
    id: "cxr-lateral-4029",
    category: "X-Ray (Plain Radiography)",
    title: "Chest X-Ray (Lateral View)",
    modality: "X-Ray",
    patientCase: "#4029",
    finding: "RLL Retrocardiac Opacification",
    badge: "CHEST X-RAY (LATERAL VIEW)",
    image: "https://i.ibb.co/ccLsYp2b/cxr-lateral.jpg",
    thumbnail: "https://i.ibb.co/Kjw8KQVN/cxr-lateral.jpg",
    bodyRegion: "Thorax / Chest Lateral",
    clinicalSummary: "Lateral radiograph confirms opacification projected over the lower thoracic spine ('spine sign') with loss of normal vertebral progressive lucency.",
    patientAge: 48,
    patientGender: "Male",
    history: "Lateral projection obtained immediately following A-P view to confirm three-dimensional localization of consolidation behind the cardiac silhouette.",
    annotations: [
      {
        id: "ann-lat-1",
        type: "ellipse",
        x: 64,
        y: 72,
        width: 22,
        height: 20,
        label: "Positive Spine Sign (Lower Lobe Consolidation)",
        measurement: "7.1 cm depth",
        color: "#38bdf8"
      }
    ],
    caseroom: [
      {
        id: "msg-lat-1",
        senderName: "Prof. Marcus Vance",
        role: "Teacher",
        avatarColor: "from-amber-600 to-orange-600",
        time: "10:24 AM",
        message: "Notice the vertebral bodies as you scan down the thoracic spine on this lateral view. In a healthy patient, the spine appears darker as you go down. What do you observe here?"
      },
      {
        id: "msg-lat-2",
        senderName: "Alex Lee",
        role: "Student",
        avatarColor: "from-emerald-600 to-teal-600",
        time: "10:26 AM",
        message: "The lower thoracic vertebrae become whiter and denser instead of darker! That's the classic 'spine sign' confirming retrocardiac lower lobe consolidation."
      },
      {
        id: "msg-lat-3",
        senderName: "Dr. Sarah Jennings",
        role: "Physician",
        avatarColor: "from-blue-600 to-cyan-600",
        time: "10:27 AM",
        message: "Spot on, Alex. Lateral views prevent missing basal infiltrates hidden behind the heart on frontal films."
      }
    ],
    news: [
      {
        id: "news-lat-1",
        title: "Queensland Health Issues Guidelines on Standard Two-View Radiography",
        excerpt: "State health board underscores importance of lateral projections in diagnosing hidden retrocardiac infections...",
        fullContent: "CLINICAL GUIDELINES: Two-view chest radiography remains the gold standard in diagnostic triage across regional hospital emergency departments. Studies indicate up to 15% of lower lobe consolidations are obscured on single frontal radiographs.",
        date: "October 13, 2026",
        source: "Queensland Medical Directorate",
        region: "Brisbane / Gold Coast, QLD"
      }
    ],
    academic: [
      {
        id: "acad-lat-1",
        title: "The Diagnostic Accuracy of the Radiographic 'Spine Sign' in Pneumonia",
        excerpt: "Evaluating sensitivity and specificity of lateral thoracic radiography in retrocardiac pulmonary opacities...",
        abstract: "A multicenter retrospective study of 890 patients assessing sensitivity (89.4%) and specificity (92.1%) of the spine sign in detecting posterior basal segment pneumonias.",
        journal: "Radiology",
        authors: "Vance M, Jennings S, Taylor H.",
        year: 2024,
        pmid: "37810294",
        doi: "10.1148/radiol.2024230188",
        ncbiUrl: "https://www.ncbi.nlm.nih.gov/pubmed/37810294"
      }
    ]
  },
  {
    id: "ct-thorax-4029",
    category: "CT Scan (Computed Tomography)",
    title: "CT Thorax (High-Res Contrast)",
    modality: "CT",
    patientCase: "#4029",
    finding: "Lower Lobe Infiltration & Effusion",
    badge: "CT THORAX (AXIAL CONTRAST)",
    image: "https://i.ibb.co/SwVwWCrS/ct-thorax.jpg",
    thumbnail: "https://i.ibb.co/m5h51W8p/ct-thorax.jpg",
    bodyRegion: "Thorax / Lung Parenchyma",
    clinicalSummary: "Axial contrast-enhanced CT demonstrates dense dense alveolar consolidation in the right posterobasal segment with patent air bronchograms and a small layered free-flowing parapneumonic pleural effusion.",
    patientAge: 48,
    patientGender: "Male",
    history: "Progressive hypoxemia prompting cross-sectional staging to exclude pulmonary embolism, cavitary abscess formation, and loculated empyema.",
    annotations: [
      {
        id: "ann-ct-1",
        type: "ellipse",
        x: 34,
        y: 62,
        width: 24,
        height: 20,
        label: "Segmental Consolidation & Bronchograms",
        measurement: "5.8 cm × 4.2 cm",
        color: "#f59e0b"
      },
      {
        id: "ann-ct-2",
        type: "arrow",
        x: 42,
        y: 74,
        label: "Parapneumonic Effusion (12mm Depth)",
        color: "#38bdf8"
      }
    ],
    caseroom: [
      {
        id: "msg-ct-1",
        senderName: "Dr. Sarah Jennings",
        role: "Physician",
        avatarColor: "from-blue-600 to-cyan-600",
        time: "10:32 AM",
        message: "Look at the axial CT slice, students. Notice the dependent fluid collection posterior to the consolidated lung parenchyma. What criteria tell us if thoracentesis is needed?"
      },
      {
        id: "msg-ct-2",
        senderName: "Alex Lee",
        role: "Student",
        avatarColor: "from-emerald-600 to-teal-600",
        time: "10:35 AM",
        message: "If the fluid rim measures greater than 10mm on CT or decubitus film, or if the patient is septic, diagnostic thoracentesis is indicated to rule out complicated effusion or empyema."
      },
      {
        id: "msg-ct-3",
        senderName: "Prof. Marcus Vance",
        role: "Teacher",
        avatarColor: "from-amber-600 to-orange-600",
        time: "10:37 AM",
        message: "Outstanding precision, Alex. Also check the pleural enhancement. Lack of thick pleural rind favors simple parapneumonic effusion."
      }
    ],
    news: [
      {
        id: "news-ct-1",
        title: "Queensland Outpost Tele-CT Network Reduces Inter-Hospital Air Transfers",
        excerpt: "Real-time teleradiology connections allow remote emergency teams to review high-res CT scans immediately...",
        fullContent: "TELEMEDICINE SUCCESS: Regional clinics in Mt Isa, Longreach, and Cape York report a 42% decrease in unnecessary emergency medical evacuations since implementing high-bandwidth tele-CT linkages with Gold Coast and Brisbane University Teaching Hospitals.",
        date: "October 12, 2026",
        source: "Rural Health Australasia",
        region: "Regional Queensland Health"
      }
    ],
    academic: [
      {
        id: "acad-ct-1",
        title: "High-Resolution CT Predictors of Complicated Parapneumonic Effusion",
        excerpt: "CT density, pleural thickening, and septations as indicators for chest tube drainage...",
        abstract: "A prospective investigation of 450 CT scans examining attenuation values and pleural split signs to identify fluid requiring early tube thoracostomy.",
        journal: "American Journal of Respiratory and Critical Care Medicine",
        authors: "Jennings S, Vance M, O'Connor B.",
        year: 2025,
        pmid: "39102488",
        pmcid: "PMC11029384",
        doi: "10.1164/rccm.202410-1892OC",
        ncbiUrl: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11029384/"
      }
    ]
  },
  {
    id: "us-thorax-4029",
    category: "Ultrasound (Sonography)",
    title: "Thoracic Ultrasound (POCUS)",
    modality: "Ultrasound",
    patientCase: "#4029",
    finding: "Subpleural Consolidation & Pleural Effusion",
    badge: "THORACIC ULTRASOUND (B-MODE)",
    image: "https://i.ibb.co/Rk5yK0mz/ultrasound-thoracic.jpg",
    thumbnail: "https://i.ibb.co/G4hTD2Lc/ultrasound-thoracic.jpg",
    bodyRegion: "Thorax / Right Posterior Base",
    clinicalSummary: "B-mode sonogram reveals irregular shredded pleural line ('shred sign'), hepatization of lung tissue with dynamic air bronchograms, and an anechoic pleural fluid pocket measuring 1.8 cm in depth.",
    patientAge: 48,
    patientGender: "Male",
    history: "Point-of-care ultrasound performed at patient bedside in rural triage station to assess effusion volume before deciding on safe needle decompression.",
    annotations: [
      {
        id: "ann-us-1",
        type: "ellipse",
        x: 52,
        y: 45,
        width: 32,
        height: 24,
        label: "Hepatized Lung Tissue ('Shred Sign')",
        measurement: "Lung tissue echogenicity",
        color: "#10b981"
      },
      {
        id: "ann-us-2",
        type: "arrow",
        x: 62,
        y: 65,
        label: "Anechoic Pleural Fluid (Safe Window)",
        color: "#38bdf8"
      }
    ],
    caseroom: [
      {
        id: "msg-us-1",
        senderName: "Prof. Marcus Vance",
        role: "Teacher",
        avatarColor: "from-amber-600 to-orange-600",
        time: "10:40 AM",
        message: "Notice the tissue appearance here. The lung resembles the echotexture of the liver—we call this 'hepatization'. What sonographic artifact disappears when lung consolidates?"
      },
      {
        id: "msg-us-2",
        senderName: "Alex Lee",
        role: "Student",
        avatarColor: "from-emerald-600 to-teal-600",
        time: "10:42 AM",
        message: "Normal horizontal A-lines and reverberation artifacts disappear because the aerated lung barrier is replaced by solid fluid-filled exudate, allowing ultrasound beam transmission into deep tissue!"
      },
      {
        id: "msg-us-3",
        senderName: "Dr. Sarah Jennings",
        role: "Physician",
        avatarColor: "from-blue-600 to-cyan-600",
        time: "10:44 AM",
        message: "Exactly right, Alex. In remote locations without immediate CT access, POCUS has >90% sensitivity for pneumonia and allows real-time guided thoracentesis."
      }
    ],
    news: [
      {
        id: "news-us-1",
        title: "Point-of-Care Ultrasound Training Mandated for Rural Queensland Interns",
        excerpt: "Royal Flying Doctor Service and health services roll out handheld ultrasound devices for remote nursing outposts...",
        fullContent: "EQUIPMENT & EDUCATION ROLLOUT: Handheld smartphone-connected ultrasound probes have been distributed to 65 remote multi-purpose health services across Far North Queensland, empowering generalist clinicians to evaluate acute respiratory failure instantly.",
        date: "October 10, 2026",
        source: "Australian Journal of Rural Health",
        region: "Far North & Outback Queensland"
      }
    ],
    academic: [
      {
        id: "acad-us-1",
        title: "Diagnostic Performance of Point-of-Care Lung Ultrasound in Remote Settings",
        excerpt: "Meta-analysis evaluating sensitivity of lung ultrasound vs chest radiography for pneumonia in primary care...",
        abstract: "In a systematic review of 28 studies comprising 4,210 patients, lung ultrasound demonstrated pooled sensitivity of 92% and specificity of 93%, significantly outperforming conventional CXR (sensitivity 74%).",
        journal: "Chest",
        authors: "Lichtenstein D, Jennings S, Vance M.",
        year: 2024,
        pmid: "38920199",
        doi: "10.1016/j.chest.2024.04.012",
        ncbiUrl: "https://www.ncbi.nlm.nih.gov/pubmed/38920199"
      }
    ]
  },
  {
    id: "mri-brain-5014",
    category: "MRI (Magnetic Resonance Imaging)",
    title: "Brain MRI (T2/FLAIR Axial)",
    modality: "MRI",
    patientCase: "#5014",
    finding: "Acute Ischemic Penumbra / White Matter Hyperintensity",
    badge: "BRAIN MRI (3T T2 FLAIR)",
    image: "https://i.ibb.co/pv2VfyJ7/brain-mri.jpg",
    thumbnail: "https://i.ibb.co/jvh0yRgN/brain-mri.jpg",
    bodyRegion: "Neuro / Brain Axial",
    clinicalSummary: "High-resolution 3 Tesla axial T2-FLAIR image showing symmetric ventricular system, sulcal anatomy, and periventricular white matter changes. Diffusion-weighted imaging co-registered for acute stroke assessment.",
    patientAge: 62,
    patientGender: "Female",
    history: "62-year-old presenting with acute onset left-sided facial droop and mild hemiparesis 3 hours prior to presentation. Normal initial non-contrast head CT.",
    annotations: [
      {
        id: "ann-mri-1",
        type: "ellipse",
        x: 48,
        y: 42,
        width: 18,
        height: 18,
        label: "Periventricular Deep White Matter",
        measurement: "Fazekas Grade 1",
        color: "#ec4899"
      },
      {
        id: "ann-mri-2",
        type: "caliper",
        x: 50,
        y: 50,
        label: "Midline Shift Assessment: 0.0 mm (Symmetric)",
        measurement: "No herniation",
        color: "#38bdf8"
      }
    ],
    caseroom: [
      {
        id: "msg-mri-1",
        senderName: "Dr. Sarah Jennings",
        role: "Physician",
        avatarColor: "from-blue-600 to-cyan-600",
        time: "11:02 AM",
        message: "Observe the lateral ventricles and the gray-white differentiation on this 3T FLAIR sequence. Why is FLAIR preferred over standard T2 when looking for subtle subcortical lesions?"
      },
      {
        id: "msg-mri-2",
        senderName: "Alex Lee",
        role: "Student",
        avatarColor: "from-emerald-600 to-teal-600",
        time: "11:05 AM",
        message: "FLAIR suppresses the bright hyperintense CSF signal in ventricles and sulci, making pathological water accumulation or ischemic hyperintensities in adjacent brain parenchyma jump out!"
      },
      {
        id: "msg-mri-3",
        senderName: "Prof. Marcus Vance",
        role: "Teacher",
        avatarColor: "from-amber-600 to-orange-600",
        time: "11:07 AM",
        message: "Spot on! Note the absence of midline shift or mass effect. This confirms eligibility for immediate thrombolysis within the therapeutic window."
      }
    ],
    news: [
      {
        id: "news-mri-1",
        title: "Queensland Telestroke Service Connects Rural Emergency Departments to 24/7 Neurologists",
        excerpt: "Statewide digital acute stroke network saves brain function in regional patients...",
        fullContent: "STROKE NETWORK MILESTONE: The Queensland Telestroke Network has treated its 2,000th patient using cloud DICOM imaging and real-time video consultations, delivering intravenous tenecteplase within the golden hour in regional facilities.",
        date: "October 08, 2026",
        source: "Queensland Health Newsroom",
        region: "Statewide Queensland"
      }
    ],
    academic: [
      {
        id: "acad-mri-1",
        title: "Diffusion-Weighted MRI vs Non-Contrast CT in Early Stroke Triage",
        excerpt: "Prospective trial comparing emergent MRI protocols to multimodal CT in rural stroke networks...",
        abstract: "MRI with DWI/FLAIR mismatch demonstrated 98.7% sensitivity in hyperacute cerebral ischemia compared to 42.1% on initial non-contrast head CT.",
        journal: "Stroke",
        authors: "Jennings S, Vance M, Thorne P, et al.",
        year: 2025,
        pmid: "39019284",
        doi: "10.1161/STROKEAHA.124.045192",
        ncbiUrl: "https://www.ncbi.nlm.nih.gov/pubmed/39019284"
      }
    ]
  }
];

// Complete list of all diagnostic modalities from user document for browse/search
export const ALL_MODALITIES_DOCUMENT_LIST = [
  // X-Ray
  { name: "Chest X-Ray (CXR)", category: "X-Ray (Plain Radiography)", modality: "X-Ray" },
  { name: "Abdominal X-Ray (KUB - Kidneys, Ureters, Bladder)", category: "X-Ray (Plain Radiography)", modality: "X-Ray" },
  { name: "Skeletal Survey X-Ray", category: "X-Ray (Plain Radiography)", modality: "X-Ray" },
  { name: "Orthopantomogram (OPG / Dental Panoramic X-Ray)", category: "X-Ray (Plain Radiography)", modality: "X-Ray" },
  { name: "Cephalometric X-Ray", category: "X-Ray (Plain Radiography)", modality: "X-Ray" },
  
  // Fluoroscopy
  { name: "Barium Swallow / Esophagram", category: "Fluoroscopy & Contrast GI", modality: "Fluoroscopy" },
  { name: "Upper Gastrointestinal (UGI) Series", category: "Fluoroscopy & Contrast GI", modality: "Fluoroscopy" },
  { name: "Small Bowel Follow-Through", category: "Fluoroscopy & Contrast GI", modality: "Fluoroscopy" },
  { name: "Barium Enema (Lower GI Series)", category: "Fluoroscopy & Contrast GI", modality: "Fluoroscopy" },
  { name: "Cystogram / Voiding Cystourethrogram (VCUG)", category: "Fluoroscopy & Contrast GI", modality: "Fluoroscopy" },
  { name: "Hysterosalpingography (HSG)", category: "Fluoroscopy & Contrast GI", modality: "Fluoroscopy" },
  { name: "Myelography", category: "Fluoroscopy & Contrast GI", modality: "Fluoroscopy" },
  { name: "Endoscopic Retrograde Cholangiopancreatography (ERCP)", category: "Fluoroscopy & Contrast GI", modality: "Fluoroscopy" },

  // Mammography & DEXA
  { name: "Mammography (Screening and Diagnostic)", category: "Mammography & DEXA", modality: "X-Ray" },
  { name: "Digital Breast Tomosynthesis (3D Mammography)", category: "Mammography & DEXA", modality: "X-Ray" },
  { name: "DEXA Scan (Bone Density Absorptiometry)", category: "Mammography & DEXA", modality: "X-Ray" },

  // CT Scan
  { name: "Non-Contrast Head CT", category: "CT Scan (Computed Tomography)", modality: "CT" },
  { name: "High-Resolution Chest CT (HRCT)", category: "CT Scan (Computed Tomography)", modality: "CT" },
  { name: "Low-Dose CT (LDCT Lung Screening)", category: "CT Scan (Computed Tomography)", modality: "CT" },
  { name: "CT Abdomen and Pelvis (CTAP)", category: "CT Scan (Computed Tomography)", modality: "CT" },
  { name: "CT Angiography (CTA - Coronary, Cerebral, Pulmonary, Aortic)", category: "CT Scan (Computed Tomography)", modality: "CT" },
  { name: "CT Pulmonary Angiogram (CTPA)", category: "CT Scan (Computed Tomography)", modality: "CT" },
  { name: "CT Perfusion Scan (Brain Stroke Imaging)", category: "CT Scan (Computed Tomography)", modality: "CT" },
  { name: "CT Colonography (Virtual Colonoscopy)", category: "CT Scan (Computed Tomography)", modality: "CT" },
  { name: "SPECT-CT (Single-Photon Emission CT)", category: "CT Scan (Computed Tomography)", modality: "Nuclear Medicine" },
  { name: "PET-CT (Positron Emission Tomography-CT)", category: "CT Scan (Computed Tomography)", modality: "Nuclear Medicine" },

  // MRI
  { name: "Brain MRI (T1, T2, FLAIR)", category: "MRI (Magnetic Resonance Imaging)", modality: "MRI" },
  { name: "Spine MRI (Cervical, Thoracic, Lumbar)", category: "MRI (Magnetic Resonance Imaging)", modality: "MRI" },
  { name: "Musculoskeletal (MSK) / Joint MRI", category: "MRI (Magnetic Resonance Imaging)", modality: "MRI" },
  { name: "Cardiac MRI (CMR)", category: "MRI (Magnetic Resonance Imaging)", modality: "MRI" },
  { name: "Multiparametric Prostate MRI (mpMRI)", category: "MRI (Magnetic Resonance Imaging)", modality: "MRI" },
  { name: "Functional MRI (fMRI)", category: "MRI (Magnetic Resonance Imaging)", modality: "MRI" },
  { name: "Diffusion-Weighted MRI (DWI / DTI Tractography)", category: "MRI (Magnetic Resonance Imaging)", modality: "MRI" },
  { name: "MR Cholangiopancreatography (MRCP)", category: "MRI (Magnetic Resonance Imaging)", modality: "MRI" },
  { name: "MR Angiography (MRA / MRV)", category: "MRI (Magnetic Resonance Imaging)", modality: "MRI" },
  { name: "Fetal MRI", category: "MRI (Magnetic Resonance Imaging)", modality: "MRI" },

  // Ultrasound
  { name: "Abdominal Ultrasound", category: "Ultrasound (Sonography)", modality: "Ultrasound" },
  { name: "Pelvic / Gynecological Ultrasound", category: "Ultrasound (Sonography)", modality: "Ultrasound" },
  { name: "Obstetric 3D / 4D Ultrasound", category: "Ultrasound (Sonography)", modality: "Ultrasound" },
  { name: "FAST Scan (Focused Trauma Sonography)", category: "Ultrasound (Sonography)", modality: "Ultrasound" },
  { name: "Point-of-Care Ultrasound (POCUS)", category: "Ultrasound (Sonography)", modality: "Ultrasound" },
  { name: "Carotid Duplex Ultrasound", category: "Ultrasound (Sonography)", modality: "Ultrasound" },
  { name: "Venous Duplex Ultrasound (DVT Scan)", category: "Ultrasound (Sonography)", modality: "Ultrasound" },
  { name: "Transthoracic Echocardiogram (TTE)", category: "Ultrasound (Sonography)", modality: "Ultrasound" },
  { name: "Transesophageal Echocardiogram (TEE)", category: "Ultrasound (Sonography)", modality: "Ultrasound" },
  { name: "Ultrasound Elastography (FibroScan Liver)", category: "Ultrasound (Sonography)", modality: "Ultrasound" },

  // Nuclear Medicine
  { name: "PET Scan (FDG, PSMA, DOTATATE)", category: "Nuclear Medicine & Scintigraphy", modality: "Nuclear Medicine" },
  { name: "Bone Scintigraphy (Three-Phase Scan)", category: "Nuclear Medicine & Scintigraphy", modality: "Nuclear Medicine" },
  { name: "Myocardial Perfusion Scan (MIBI Stress)", category: "Nuclear Medicine & Scintigraphy", modality: "Nuclear Medicine" },
  { name: "V/Q Scan (Lung Ventilation-Perfusion)", category: "Nuclear Medicine & Scintigraphy", modality: "Nuclear Medicine" },
  { name: "HIDA Scan (Hepatobiliary Cholescintigraphy)", category: "Nuclear Medicine & Scintigraphy", modality: "Nuclear Medicine" },
  { name: "DaTscan (Dopamine Transporter Brain)", category: "Nuclear Medicine & Scintigraphy", modality: "Nuclear Medicine" },

  // Angiography
  { name: "Digital Subtraction Angiography (DSA)", category: "Angiography & Interventional", modality: "X-Ray" },
  { name: "Catheter Coronary Angiography (Cath Lab)", category: "Angiography & Interventional", modality: "X-Ray" },
  { name: "Cerebral Angiography", category: "Angiography & Interventional", modality: "X-Ray" },

  // Endoscopy
  { name: "Esophagogastroduodenoscopy (EGD Gastroscopy)", category: "Endoscopy & Direct Visualization", modality: "Endoscopy" },
  { name: "Colonoscopy & Polypectomy", category: "Endoscopy & Direct Visualization", modality: "Endoscopy" },
  { name: "Video Capsule Endoscopy (PillCam)", category: "Endoscopy & Direct Visualization", modality: "Endoscopy" },
  { name: "Diagnostic Bronchoscopy", category: "Endoscopy & Direct Visualization", modality: "Endoscopy" },
  { name: "Diagnostic Arthroscopy / Laparoscopy", category: "Endoscopy & Direct Visualization", modality: "Endoscopy" },

  // Electrophysiology
  { name: "Electrocardiogram (12-Lead ECG / EKG)", category: "Clinical Electrophysiology (ECG/EEG/EMG)", modality: "Electrophysiology" },
  { name: "Holter Monitor / Ambulatory Telemetry", category: "Clinical Electrophysiology (ECG/EEG/EMG)", modality: "Electrophysiology" },
  { name: "Electroencephalogram (Routine & Video EEG)", category: "Clinical Electrophysiology (ECG/EEG/EMG)", modality: "Electrophysiology" },
  { name: "Electromyography & Nerve Conduction (EMG/NCS)", category: "Clinical Electrophysiology (ECG/EEG/EMG)", modality: "Electrophysiology" },
  { name: "Polysomnogram (Overnight Sleep Study)", category: "Clinical Electrophysiology (ECG/EEG/EMG)", modality: "Electrophysiology" },
  { name: "Pulmonary Function Test (Spirometry PFT)", category: "Clinical Electrophysiology (ECG/EEG/EMG)", modality: "Electrophysiology" },

  // Pathology & Laboratory
  { name: "Histopathology / Surgical Biopsy Report", category: "Pathology & Laboratory Reports", modality: "Pathology" },
  { name: "Complete Blood Count (CBC / FBC) & Film", category: "Pathology & Laboratory Reports", modality: "Pathology" },
  { name: "Coagulation Profile (PT, INR, aPTT, D-Dimer)", category: "Pathology & Laboratory Reports", modality: "Pathology" },
  { name: "Comprehensive Metabolic Panel (CMP/EUC/LFT)", category: "Pathology & Laboratory Reports", modality: "Pathology" },
  { name: "Arterial Blood Gas (ABG / VBG) Report", category: "Pathology & Laboratory Reports", modality: "Pathology" },
  { name: "Cardiac Biomarkers (High-Sensitivity Troponin)", category: "Pathology & Laboratory Reports", modality: "Pathology" },
  { name: "Cerebrospinal Fluid (CSF Lumbar Puncture)", category: "Pathology & Laboratory Reports", modality: "Pathology" },
  { name: "Microbiology Gram Stain & Antibiogram", category: "Pathology & Laboratory Reports", modality: "Pathology" },
  { name: "Molecular PCR / NAAT Viral Load Panel", category: "Pathology & Laboratory Reports", modality: "Pathology" },
  { name: "Next-Generation Sequencing (NGS) Genomic Tumor", category: "Pathology & Laboratory Reports", modality: "Pathology" },

  // Clinical Records
  { name: "Emergency Department Triage & Assessment", category: "Clinical Encounter Records", modality: "Clinical Record" },
  { name: "Admission History & Physical (H&P) Note", category: "Clinical Encounter Records", modality: "Clinical Record" },
  { name: "MDT / Tumor Board Consensus Summary", category: "Clinical Encounter Records", modality: "Clinical Record" },
  { name: "ICU Flowsheet & Organ Failure Score (SOFA/APACHE)", category: "Clinical Encounter Records", modality: "Clinical Record" },
  { name: "Glasgow Coma Scale (GCS) Observation Chart", category: "Clinical Encounter Records", modality: "Clinical Record" },
  { name: "Hospital Discharge Summary & Diagnostic Plan", category: "Clinical Encounter Records", modality: "Clinical Record" }
];
