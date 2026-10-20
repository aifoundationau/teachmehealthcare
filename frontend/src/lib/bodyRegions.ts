/**
 * Comprehensive Anatomical Body Regions Catalog
 * Includes all diagnostic subregions, organs, joints, compartments, and anatomical triangles.
 */

export interface BodyRegionItem {
  id: string;
  name: string;
  system: string;
  short?: string;
}

export const BODY_REGIONS_CATALOG: readonly BodyRegionItem[] = [
  // 1. Head and Cranium
  { id: "br-1", name: "Head and Cranium", system: "Head & Neuro" },
  { id: "br-2", name: "Neurocranium (Cranial Vault)", system: "Head & Neuro", short: "Cranial Vault" },
  { id: "br-3", name: "Cranial Base (Skull Base)", system: "Head & Neuro", short: "Skull Base" },
  { id: "br-4", name: "Forehead (Frontal Region)", system: "Head & Neuro" },
  { id: "br-5", name: "Parietal Region", system: "Head & Neuro" },
  { id: "br-6", name: "Temporal Region", system: "Head & Neuro" },
  { id: "br-7", name: "Occipital Region", system: "Head & Neuro" },
  { id: "br-8", name: "Infratemporal Fossa", system: "Head & Neuro" },
  { id: "br-9", name: "Pterygopalatine Fossa", system: "Head & Neuro", short: "PPF" },

  // 2. Face (Viscerocranium) & Special Senses
  { id: "br-10", name: "Face (Viscerocranium)", system: "Maxillofacial" },
  { id: "br-11", name: "Orbital Region", system: "Ophthalmic & Orbit" },
  { id: "br-12", name: "Eye (Globe / Bulbus Oculi)", system: "Ophthalmic & Orbit", short: "Globe" },
  { id: "br-13", name: "Retina and Posterior Segment", system: "Ophthalmic & Orbit" },
  { id: "br-14", name: "Anterior Chamber and Cornea", system: "Ophthalmic & Orbit" },
  { id: "br-15", name: "Lacrimal Apparatus", system: "Ophthalmic & Orbit" },
  { id: "br-16", name: "Nasal Region", system: "Maxillofacial" },
  { id: "br-17", name: "External Nose", system: "Maxillofacial" },
  { id: "br-18", name: "Nasal Cavity", system: "ENT & Airway" },
  { id: "br-19", name: "Paranasal Sinuses (Frontal, Ethmoidal, Sphenoidal, Maxillary)", system: "ENT & Airway", short: "PNS" },
  { id: "br-20", name: "Oral Region", system: "Oral & Dental" },
  { id: "br-21", name: "Lips (Labial Region)", system: "Oral & Dental" },
  { id: "br-22", name: "Oral Cavity Proper", system: "Oral & Dental" },
  { id: "br-23", name: "Tongue (Lingual Region)", system: "Oral & Dental" },
  { id: "br-24", name: "Hard and Soft Palate", system: "Oral & Dental" },
  { id: "br-25", name: "Floor of Mouth", system: "Oral & Dental" },
  { id: "br-26", name: "Gingiva and Teeth (Maxilla and Mandible)", system: "Oral & Dental", short: "Teeth / Jaw" },
  { id: "br-27", name: "Salivary Gland Regions (Parotid, Submandibular, Sublingual)", system: "Head & Neck", short: "Salivary Glands" },
  { id: "br-28", name: "Mental Region (Chin)", system: "Maxillofacial" },
  { id: "br-29", name: "Buccal Region (Cheeks)", system: "Maxillofacial" },
  { id: "br-30", name: "Zygomatic Region", system: "Maxillofacial", short: "Malar" },
  { id: "br-31", name: "Temporomandibular Joint (TMJ)", system: "Joints", short: "TMJ" },

  // 3. Neck (Cervical Region)
  { id: "br-32", name: "Neck (Cervical Region)", system: "Cervical" },
  { id: "br-33", name: "Anterior Cervical Region (Anterior Triangle)", system: "Cervical" },
  { id: "br-34", name: "Submandibular Triangle", system: "Cervical" },
  { id: "br-35", name: "Submental Triangle", system: "Cervical" },
  { id: "br-36", name: "Carotid Triangle", system: "Cervical" },
  { id: "br-37", name: "Muscular (Omotracheal) Triangle", system: "Cervical" },
  { id: "br-38", name: "Lateral Cervical Region (Posterior Triangle)", system: "Cervical" },
  { id: "br-39", name: "Occipital Triangle", system: "Cervical" },
  { id: "br-40", name: "Omoclavicular (Subclavian) Triangle", system: "Cervical" },
  { id: "br-41", name: "Sternocleidomastoid Region", system: "Cervical", short: "SCM" },
  { id: "br-42", name: "Posterior Cervical Region (Nuchal Region)", system: "Cervical" },
  { id: "br-43", name: "Suboccipital Region", system: "Cervical" },
  { id: "br-44", name: "Larynx and Vocal Cords", system: "ENT & Airway", short: "Larynx" },
  { id: "br-45", name: "Pharynx (Nasopharynx, Oropharynx, Hypopharynx)", system: "ENT & Airway", short: "Pharynx" },
  { id: "br-46", name: "Cervical Trachea", system: "ENT & Airway" },
  { id: "br-47", name: "Cervical Esophagus", system: "GI & Airway" },
  { id: "br-48", name: "Thyroid and Parathyroid Glands", system: "Endocrine", short: "Thyroid" },

  // 4. Thorax (Chest) & Heart
  { id: "br-49", name: "Thorax (Chest)", system: "Thoracic" },
  { id: "br-50", name: "Thoracic Wall and Rib Cage", system: "Thoracic", short: "Chest Wall" },
  { id: "br-51", name: "Sternum and Sternoclavicular Joints", system: "Thoracic", short: "Sternum" },
  { id: "br-52", name: "Intercostal Spaces", system: "Thoracic" },
  { id: "br-53", name: "Breast and Nipple-Areolar Complex", system: "Breast", short: "Breast" },
  { id: "br-54", name: "Axillary Tail of Spence", system: "Breast" },
  { id: "br-55", name: "Mediastinum", system: "Thoracic" },
  { id: "br-56", name: "Superior Mediastinum", system: "Thoracic" },
  { id: "br-57", name: "Anterior Mediastinum", system: "Thoracic" },
  { id: "br-58", name: "Middle Mediastinum (Pericardium and Heart)", system: "Cardiovascular", short: "Heart / Pericardium" },
  { id: "br-59", name: "Cardiac Atria and Ventricles", system: "Cardiovascular", short: "Cardiac Chambers" },
  { id: "br-60", name: "Myocardium and Endocardium", system: "Cardiovascular", short: "Myocardium" },
  { id: "br-61", name: "Coronary Vasculature", system: "Cardiovascular", short: "Coronary Arteries" },
  { id: "br-62", name: "Cardiac Valves (Aortic, Mitral, Tricuspid, Pulmonary)", system: "Cardiovascular", short: "Heart Valves" },
  { id: "br-63", name: "Posterior Mediastinum", system: "Thoracic" },
  { id: "br-64", name: "Thoracic Aorta (Ascending, Arch, Descending)", system: "Cardiovascular", short: "Thoracic Aorta" },
  { id: "br-65", name: "Thoracic Esophagus", system: "Thoracic" },
  { id: "br-66", name: "Thoracic Trachea and Carina", system: "Respiratory", short: "Trachea / Carina" },
  { id: "br-67", name: "Mainstem, Lobar, and Segmental Bronchi", system: "Respiratory", short: "Bronchial Tree" },
  { id: "br-68", name: "Pulmonary Parenchyma (Right and Left Lung)", system: "Respiratory", short: "Lungs" },
  { id: "br-69", name: "Right Upper Lobe", system: "Respiratory", short: "RUL" },
  { id: "br-70", name: "Right Middle Lobe", system: "Respiratory", short: "RML" },
  { id: "br-71", name: "Right Lower Lobe", system: "Respiratory", short: "RLL" },
  { id: "br-72", name: "Left Upper Lobe", system: "Respiratory", short: "LUL" },
  { id: "br-73", name: "Left Lower Lobe", system: "Respiratory", short: "LLL" },
  { id: "br-74", name: "Lingula", system: "Respiratory" },
  { id: "br-75", name: "Pleura and Pleural Cavity (Visceral and Parietal Pleura)", system: "Respiratory", short: "Pleura" },
  { id: "br-76", name: "Costodiaphragmatic and Costomediastinal Recesses", system: "Respiratory", short: "Pleural Recesses" },
  { id: "br-77", name: "Thoracic Duct and Lymphatics", system: "Lymphatic" },
  { id: "br-78", name: "Diaphragm", system: "Thoracic" },

  // 5. Abdomen & Abdominal Viscera
  { id: "br-79", name: "Abdomen", system: "Abdomen" },
  { id: "br-80", name: "Anterior Abdominal Wall (Rectus Sheath, Linea Alba, Umbilicus)", system: "Abdomen", short: "Abdominal Wall" },
  { id: "br-81", name: "Right Hypochondriac Region", system: "Abdomen", short: "RUQ" },
  { id: "br-82", name: "Epigastric Region", system: "Abdomen", short: "Epigastrium" },
  { id: "br-83", name: "Left Hypochondriac Region", system: "Abdomen", short: "LUQ" },
  { id: "br-84", name: "Right Lumbar (Lateral) Region", system: "Abdomen", short: "Right Flank" },
  { id: "br-85", name: "Umbilical Region", system: "Abdomen", short: "Periumbilical" },
  { id: "br-86", name: "Left Lumbar (Lateral) Region", system: "Abdomen", short: "Left Flank" },
  { id: "br-87", name: "Right Iliac (Inguinal) Region", system: "Abdomen", short: "RIF / RLQ" },
  { id: "br-88", name: "Hypogastric (Suprapubic) Region", system: "Abdomen", short: "Suprapubic" },
  { id: "br-89", name: "Left Iliac (Inguinal) Region", system: "Abdomen", short: "LIF / LLQ" },
  { id: "br-90", name: "Peritoneal Cavity", system: "Abdomen" },
  { id: "br-91", name: "Greater Sac", system: "Abdomen" },
  { id: "br-92", name: "Omental Bursa (Lesser Sac)", system: "Abdomen", short: "Lesser Sac" },
  { id: "br-93", name: "Greater and Lesser Omentum", system: "Abdomen", short: "Omentum" },
  { id: "br-94", name: "Mesentery and Mesocolon", system: "Abdomen", short: "Mesentery" },
  { id: "br-95", name: "Retroperitoneum", system: "Retroperitoneum" },
  { id: "br-96", name: "Adrenal (Suprarenal) Glands", system: "Endocrine", short: "Adrenals" },
  { id: "br-97", name: "Kidneys (Renal Cortex, Medulla, Pelvis)", system: "Urology", short: "Kidneys" },
  { id: "br-98", name: "Renal Vasculature", system: "Cardiovascular", short: "Renal Vessels" },
  { id: "br-99", name: "Upper Ureters", system: "Urology" },
  { id: "br-100", name: "Abdominal Aorta and Major Branches (Celiac, SMA, IMA, Renal)", system: "Cardiovascular", short: "Abdominal Aorta" },
  { id: "br-101", name: "Inferior Vena Cava and Tributaries", system: "Cardiovascular", short: "IVC" },
  { id: "br-102", name: "Retroperitoneal Lymph Nodes", system: "Lymphatic" },
  { id: "br-103", name: "Hepatobiliary System", system: "Hepatobiliary" },
  { id: "br-104", name: "Liver (Couinaud Segments I to VIII)", system: "Hepatobiliary", short: "Liver" },
  { id: "br-105", name: "Porta Hepatis and Portal Vein", system: "Hepatobiliary", short: "Portal Vein" },
  { id: "br-106", name: "Hepatic Arteries and Veins", system: "Hepatobiliary", short: "Hepatic Vessels" },
  { id: "br-107", name: "Gallbladder (Fundus, Body, Neck)", system: "Hepatobiliary", short: "Gallbladder" },
  { id: "br-108", name: "Cystic Duct", system: "Hepatobiliary" },
  { id: "br-109", name: "Common Hepatic Duct", system: "Hepatobiliary", short: "CHD" },
  { id: "br-110", name: "Common Bile Duct", system: "Hepatobiliary", short: "CBD" },
  { id: "br-111", name: "Spleen and Splenic Vasculature", system: "Hemic & Lymphatic", short: "Spleen" },
  { id: "br-112", name: "Pancreas (Head, Uncinate Process, Neck, Body, Tail, Pancreatic Ducts)", system: "Hepatobiliary", short: "Pancreas" },
  { id: "br-113", name: "Upper Gastrointestinal Tract", system: "Gastrointestinal", short: "Upper GI" },
  { id: "br-114", name: "Gastroesophageal Junction", system: "Gastrointestinal", short: "GEJ" },
  { id: "br-115", name: "Stomach (Cardia, Fundus, Body, Antrum, Pylorus)", system: "Gastrointestinal", short: "Stomach" },
  { id: "br-116", name: "Duodenum (Superior, Descending, Horizontal, Ascending Segments)", system: "Gastrointestinal", short: "Duodenum" },
  { id: "br-117", name: "Lower Gastrointestinal Tract", system: "Gastrointestinal", short: "Lower GI" },
  { id: "br-118", name: "Jejunum", system: "Gastrointestinal", short: "Small Bowel" },
  { id: "br-119", name: "Ileum", system: "Gastrointestinal", short: "Small Bowel" },
  { id: "br-120", name: "Terminal Ileum and Ileocecal Valve", system: "Gastrointestinal", short: "TI / IC Valve" },
  { id: "br-121", name: "Cecum and Appendix", system: "Gastrointestinal", short: "Appendix / Cecum" },
  { id: "br-122", name: "Ascending Colon", system: "Gastrointestinal", short: "Right Colon" },
  { id: "br-123", name: "Hepatic Flexure", system: "Gastrointestinal" },
  { id: "br-124", name: "Transverse Colon", system: "Gastrointestinal" },
  { id: "br-125", name: "Splenic Flexure", system: "Gastrointestinal" },
  { id: "br-126", name: "Descending Colon", system: "Gastrointestinal", short: "Left Colon" },
  { id: "br-127", name: "Sigmoid Colon", system: "Gastrointestinal", short: "Sigmoid" },

  // 6. Pelvis and Perineum
  { id: "br-128", name: "Pelvis and Perineum", system: "Pelvis" },
  { id: "br-129", name: "Pelvic Cavity Proper", system: "Pelvis" },
  { id: "br-130", name: "Pelvic Inflow and Outflow Vessels (Internal and External Iliac Vessels)", system: "Cardiovascular", short: "Iliac Vessels" },
  { id: "br-131", name: "Lower Ureters", system: "Urology" },
  { id: "br-132", name: "Urinary Bladder (Dome, Base, Trigone, Neck)", system: "Urology", short: "Bladder" },
  { id: "br-133", name: "Pelvic Floor (Levator Ani, Coccygeus)", system: "Pelvis", short: "Pelvic Floor" },
  { id: "br-134", name: "Pelvic Lymph Nodes", system: "Lymphatic" },
  { id: "br-135", name: "Female Pelvis", system: "Gynecology" },
  { id: "br-136", name: "Uterus (Fundus, Corpus, Lower Uterine Segment, Endometrium, Myometrium)", system: "Gynecology", short: "Uterus" },
  { id: "br-137", name: "Cervix (Endocervix, Ectocervix)", system: "Gynecology", short: "Cervix" },
  { id: "br-138", name: "Fallopian Tubes (Infundibulum, Ampulla, Isthmus)", system: "Gynecology", short: "Fallopian Tubes" },
  { id: "br-139", name: "Ovaries", system: "Gynecology", short: "Ovaries" },
  { id: "br-140", name: "Vagina", system: "Gynecology" },
  { id: "br-141", name: "Pouch of Douglas (Rectouterine Pouch)", system: "Gynecology", short: "Rectouterine Pouch" },
  { id: "br-142", name: "Male Pelvis", system: "Urology" },
  { id: "br-143", name: "Prostate Gland (Peripheral, Central, Transition, Fibromuscular Zones)", system: "Urology", short: "Prostate" },
  { id: "br-144", name: "Seminal Vesicles", system: "Urology" },
  { id: "br-145", name: "Vas Deferens (Pelvic Portion)", system: "Urology" },
  { id: "br-146", name: "Perineum", system: "Perineum" },
  { id: "br-147", name: "Anal Triangle", system: "Colorectal" },
  { id: "br-148", name: "Anal Canal and Sphincter Complex", system: "Colorectal", short: "Anal Canal" },
  { id: "br-149", name: "Ischioanal (Ischiorectal) Fossae", system: "Pelvis" },
  { id: "br-150", name: "Urogenital Triangle", system: "Urology & GYN" },
  { id: "br-151", name: "Perineal Membrane", system: "Perineum" },
  { id: "br-152", name: "Deep and Superficial Perineal Pouches", system: "Perineum" },
  { id: "br-153", name: "External Genitalia", system: "Genitalia" },
  { id: "br-154", name: "Scrotum and Testes", system: "Urology", short: "Testes" },
  { id: "br-155", name: "Epididymis and Spermatic Cord", system: "Urology", short: "Epididymis" },
  { id: "br-156", name: "Penis (Corpora Cavernosa, Corpus Spongiosum, Glans, Penile Urethra)", system: "Urology", short: "Penis" },
  { id: "br-157", name: "Vulva (Labia Majora, Labia Minora, Vestibule, Clitoral Complex)", system: "Gynecology", short: "Vulva" },

  // 7. Spine and Neural Axis
  { id: "br-158", name: "Spine and Neural Axis", system: "Spine & Neuro" },
  { id: "br-159", name: "Spinal Cord (Cervical, Thoracic, Lumbar Segments)", system: "Spine & Neuro", short: "Spinal Cord" },
  { id: "br-160", name: "Conus Medullaris", system: "Spine & Neuro" },
  { id: "br-161", name: "Cauda Equina and Filum Terminale", system: "Spine & Neuro", short: "Cauda Equina" },
  { id: "br-162", name: "Thecal Sac and Epidural Space", system: "Spine & Neuro", short: "Thecal Sac" },
  { id: "br-163", name: "Cervical Spine (C1–C7)", system: "Spine", short: "C-Spine" },
  { id: "br-164", name: "Atlanto-Occipital and Atlanto-Axial Joints", system: "Spine", short: "C0-C2 Joints" },
  { id: "br-165", name: "Dens (Odontoid Process)", system: "Spine", short: "Odontoid" },
  { id: "br-166", name: "Thoracic Spine (T1–T12)", system: "Spine", short: "T-Spine" },
  { id: "br-167", name: "Costovertebral and Costotransverse Joints", system: "Spine" },
  { id: "br-168", name: "Lumbar Spine (L1–L5)", system: "Spine", short: "L-Spine" },
  { id: "br-169", name: "Sacrum (S1–S5) and Sacral Canal", system: "Spine", short: "Sacrum" },
  { id: "br-170", name: "Sacroiliac Joints", system: "Joints", short: "SI Joints" },
  { id: "br-171", name: "Coccyx", system: "Spine", short: "Tailbone" },
  { id: "br-172", name: "Intervertebral Discs (Nucleus Pulposus, Annulus Fibrosus)", system: "Spine", short: "IV Discs" },
  { id: "br-173", name: "Neural Foramina and Nerve Roots", system: "Spine & Neuro", short: "Nerve Roots" },
  { id: "br-174", name: "Facet (Zygapophyseal) Joints", system: "Spine", short: "Facet Joints" },

  // 8. Upper Limb
  { id: "br-175", name: "Upper Limb", system: "Musculoskeletal" },
  { id: "br-176", name: "Shoulder (Pectoral Girdle)", system: "Musculoskeletal", short: "Shoulder" },
  { id: "br-177", name: "Clavicle", system: "Musculoskeletal", short: "Collarbone" },
  { id: "br-178", name: "Acromioclavicular Joint", system: "Joints", short: "AC Joint" },
  { id: "br-179", name: "Scapula (Body, Spine, Glenoid, Coracoid Process)", system: "Musculoskeletal", short: "Scapula" },
  { id: "br-180", name: "Glenohumeral Joint (Glenoid Labrum, Articular Capsule)", system: "Joints", short: "Shoulder Joint" },
  { id: "br-181", name: "Rotator Cuff (Supraspinatus, Infraspinatus, Teres Minor, Subscapularis)", system: "Musculoskeletal", short: "Rotator Cuff" },
  { id: "br-182", name: "Subacromial and Subdeltoid Bursae", system: "Musculoskeletal", short: "Subacromial Bursa" },
  { id: "br-183", name: "Axilla and Axillary Lymph Nodes", system: "Lymphatic", short: "Axilla" },
  { id: "br-184", name: "Arm (Brachium)", system: "Musculoskeletal", short: "Upper Arm" },
  { id: "br-185", name: "Humerus (Shaft, Greater/Lesser Tuberosities, Bicipital Groove)", system: "Musculoskeletal", short: "Humerus" },
  { id: "br-186", name: "Anterior Compartment of Arm (Biceps Brachii, Coracobrachialis, Brachialis)", system: "Musculoskeletal", short: "Biceps" },
  { id: "br-187", name: "Posterior Compartment of Arm (Triceps Brachii)", system: "Musculoskeletal", short: "Triceps" },
  { id: "br-188", name: "Elbow (Cubital Region)", system: "Joints", short: "Elbow" },
  { id: "br-189", name: "Cubital Fossa", system: "Musculoskeletal" },
  { id: "br-190", name: "Humeroulnar Joint", system: "Joints" },
  { id: "br-191", name: "Humeroradial Joint", system: "Joints" },
  { id: "br-192", name: "Proximal Radioulnar Joint", system: "Joints", short: "PRUJ" },
  { id: "br-193", name: "Medial and Lateral Epicondyles", system: "Musculoskeletal" },
  { id: "br-194", name: "Olecranon and Olecranon Bursa", system: "Joints", short: "Olecranon" },
  { id: "br-195", name: "Forearm (Antebrachium)", system: "Musculoskeletal", short: "Forearm" },
  { id: "br-196", name: "Radius (Head, Neck, Shaft, Distal Metaphysis)", system: "Musculoskeletal", short: "Radius" },
  { id: "br-197", name: "Ulna (Shaft, Styloid Process)", system: "Musculoskeletal", short: "Ulna" },
  { id: "br-198", name: "Interosseous Membrane", system: "Musculoskeletal" },
  { id: "br-199", name: "Anterior (Flexor) Forearm Compartment", system: "Musculoskeletal", short: "Forearm Flexors" },
  { id: "br-200", name: "Posterior (Extensor) Forearm Compartment", system: "Musculoskeletal", short: "Forearm Extensors" },
  { id: "br-201", name: "Mobile Wad of Three", system: "Musculoskeletal" },
  { id: "br-202", name: "Wrist (Carpal Region)", system: "Joints", short: "Wrist" },
  { id: "br-203", name: "Distal Radioulnar Joint", system: "Joints", short: "DRUJ" },
  { id: "br-204", name: "Radiocarpal Joint", system: "Joints", short: "Wrist Joint" },
  { id: "br-205", name: "Triangular Fibrocartilage Complex (TFCC)", system: "Joints", short: "TFCC" },
  { id: "br-206", name: "Carpal Bones (Scaphoid, Lunate, Triquetrum, Pisiform, Trapezium, Trapezoid, Capitate, Hamate)", system: "Musculoskeletal", short: "Carpals" },
  { id: "br-207", name: "Carpal Tunnel and Median Nerve", system: "Peripheral Nerve", short: "Carpal Tunnel" },
  { id: "br-208", name: "Guyon's Canal and Ulnar Nerve", system: "Peripheral Nerve", short: "Guyon's Canal" },
  { id: "br-209", name: "Extensor Retinaculum and Extensor Compartments", system: "Musculoskeletal", short: "Wrist Extensors" },
  { id: "br-210", name: "Hand and Digits", system: "Musculoskeletal", short: "Hand" },
  { id: "br-211", name: "Metacarpus (Metacarpals 1–5)", system: "Musculoskeletal", short: "Metacarpals" },
  { id: "br-212", name: "Carpometacarpal Joints", system: "Joints", short: "CMC Joints" },
  { id: "br-213", name: "Metacarpophalangeal (MCP) Joints", system: "Joints", short: "MCP Joints" },
  { id: "br-214", name: "Thenar Space and Compartment", system: "Musculoskeletal", short: "Thenar" },
  { id: "br-215", name: "Hypothenar Compartment", system: "Musculoskeletal", short: "Hypothenar" },
  { id: "br-216", name: "Midpalmar Space", system: "Musculoskeletal" },
  { id: "br-217", name: "Palmar Aponeurosis", system: "Musculoskeletal", short: "Palmar Fascia" },
  { id: "br-218", name: "Phalanges (Proximal, Middle, Distal)", system: "Musculoskeletal", short: "Fingers" },
  { id: "br-219", name: "Interphalangeal Joints (Proximal IP, Distal IP)", system: "Joints", short: "PIP / DIP" },
  { id: "br-220", name: "Pulley Systems and Flexor/Extensor Tendon Slips", system: "Musculoskeletal", short: "Finger Tendons" },
  { id: "br-221", name: "Nail Bed and Perionychium", system: "Integumentary", short: "Nail Bed" },

  // 9. Lower Limb
  { id: "br-222", name: "Lower Limb", system: "Musculoskeletal" },
  { id: "br-223", name: "Pelvic Girdle and Hip", system: "Joints", short: "Hip" },
  { id: "br-224", name: "Acetabulum and Acetabular Labrum", system: "Joints", short: "Acetabulum" },
  { id: "br-225", name: "Femoral Head, Neck, and Greater/Lesser Trochanters", system: "Musculoskeletal", short: "Proximal Femur" },
  { id: "br-226", name: "Hip Joint Articular Capsule and Ligamentum Teres", system: "Joints", short: "Hip Capsule" },
  { id: "br-227", name: "Gluteal Region", system: "Musculoskeletal", short: "Buttock / Gluteals" },
  { id: "br-228", name: "Greater Trochanteric and Ischial Bursae", system: "Musculoskeletal", short: "Trochanteric Bursa" },
  { id: "br-229", name: "Sciatic Notch and Sciatic Nerve Path", system: "Peripheral Nerve", short: "Sciatic Nerve" },
  { id: "br-230", name: "Femoral Triangle (Scarpa's Triangle)", system: "Cardiovascular", short: "Femoral Triangle" },
  { id: "br-231", name: "Groin / Inguinal Canal", system: "Musculoskeletal", short: "Groin" },
  { id: "br-232", name: "Thigh (Femoral Region)", system: "Musculoskeletal", short: "Thigh" },
  { id: "br-233", name: "Femur (Shaft and Distal Condyles)", system: "Musculoskeletal", short: "Femur" },
  { id: "br-234", name: "Anterior Compartment of Thigh (Quadriceps Femoris, Sartorius)", system: "Musculoskeletal", short: "Quadriceps" },
  { id: "br-235", name: "Medial (Adductor) Compartment of Thigh", system: "Musculoskeletal", short: "Adductors" },
  { id: "br-236", name: "Posterior Compartment of Thigh (Hamstring Muscles)", system: "Musculoskeletal", short: "Hamstrings" },
  { id: "br-237", name: "Knee", system: "Joints", short: "Knee" },
  { id: "br-238", name: "Patella and Trochlear Groove", system: "Joints", short: "Patella" },
  { id: "br-239", name: "Patellofemoral Joint", system: "Joints", short: "PFJ" },
  { id: "br-240", name: "Medial and Lateral Tibiofemoral Joints", system: "Joints", short: "Knee Joint" },
  { id: "br-241", name: "Medial Meniscus", system: "Joints", short: "MM" },
  { id: "br-242", name: "Lateral Meniscus", system: "Joints", short: "LM" },
  { id: "br-243", name: "Anterior Cruciate Ligament (ACL)", system: "Joints", short: "ACL" },
  { id: "br-244", name: "Posterior Cruciate Ligament (PCL)", system: "Joints", short: "PCL" },
  { id: "br-245", name: "Medial Collateral Ligament (MCL)", system: "Joints", short: "MCL" },
  { id: "br-246", name: "Lateral Collateral Ligament (LCL)", system: "Joints", short: "LCL" },
  { id: "br-247", name: "Posterolateral Corner Structures", system: "Joints", short: "PLC" },
  { id: "br-248", name: "Infrapatellar Fat Pad (Hoffa's Fat Pad)", system: "Joints", short: "Hoffa's Fat Pad" },
  { id: "br-249", name: "Suprapatellar, Prepatellar, and Infrapatellar Bursae", system: "Joints", short: "Knee Bursae" },
  { id: "br-250", name: "Popliteal Fossa and Neurovascular Bundle", system: "Cardiovascular", short: "Popliteal Fossa" },
  { id: "br-251", name: "Leg (Crus)", system: "Musculoskeletal", short: "Lower Leg" },
  { id: "br-252", name: "Tibia (Plateau, Tubercle, Shaft, Pilon)", system: "Musculoskeletal", short: "Tibia" },
  { id: "br-253", name: "Fibula (Head, Shaft, Lateral Malleolus)", system: "Musculoskeletal", short: "Fibula" },
  { id: "br-254", name: "Proximal and Distal Tibiofibular Syndesmosis", system: "Joints", short: "Syndesmosis" },
  { id: "br-255", name: "Anterior Compartment of Leg", system: "Musculoskeletal", short: "Tibialis Anterior" },
  { id: "br-256", name: "Lateral (Peroneal) Compartment of Leg", system: "Musculoskeletal", short: "Peroneals" },
  { id: "br-257", name: "Superficial Posterior Compartment of Leg (Gastrocnemius, Soleus)", system: "Musculoskeletal", short: "Calf" },
  { id: "br-258", name: "Deep Posterior Compartment of Leg", system: "Musculoskeletal" },
  { id: "br-259", name: "Interosseous Membrane of Leg", system: "Musculoskeletal" },
  { id: "br-260", name: "Ankle (Talocrural Region)", system: "Joints", short: "Ankle" },
  { id: "br-261", name: "Talocrural Joint", system: "Joints", short: "Ankle Joint" },
  { id: "br-262", name: "Medial Malleolus and Deltoid Ligament", system: "Joints", short: "Deltoid Ligament" },
  { id: "br-263", name: "Lateral Malleolus and Lateral Collateral Ligaments (ATFL, CFL, PTFL)", system: "Joints", short: "ATFL / CFL" },
  { id: "br-264", name: "Subtalar (Talocalcaneal) Joint", system: "Joints", short: "Subtalar Joint" },
  { id: "br-265", name: "Sinus Tarsi", system: "Joints" },
  { id: "br-266", name: "Achilles Tendon and Retrocalcaneal Bursa", system: "Musculoskeletal", short: "Achilles" },
  { id: "br-267", name: "Tarsal Tunnel and Posterior Tibial Nerve", system: "Peripheral Nerve", short: "Tarsal Tunnel" },
  { id: "br-268", name: "Peroneal Tendon Retinacula and Grooves", system: "Musculoskeletal" },
  { id: "br-269", name: "Foot and Digits", system: "Musculoskeletal", short: "Foot" },
  { id: "br-270", name: "Hindfoot (Talus, Calcaneus)", system: "Musculoskeletal", short: "Hindfoot" },
  { id: "br-271", name: "Midfoot (Navicular, Cuboid, Medial/Intermediate/Lateral Cuneiforms)", system: "Musculoskeletal", short: "Midfoot" },
  { id: "br-272", name: "Transverse Tarsal (Chopart) Joint", system: "Joints", short: "Chopart Joint" },
  { id: "br-273", name: "Tarsometatarsal (Lisfranc) Joint Complex", system: "Joints", short: "Lisfranc Joint" },
  { id: "br-274", name: "Plantar Fascia and Central Plantar Space", system: "Musculoskeletal", short: "Plantar Fascia" },
  { id: "br-275", name: "Forefoot (Metatarsals 1–5)", system: "Musculoskeletal", short: "Forefoot" },
  { id: "br-276", name: "Metatarsophalangeal (MTP) Joints", system: "Joints", short: "MTP Joints" },
  { id: "br-277", name: "First MTP Joint Sesamoids", system: "Musculoskeletal", short: "Sesamoids" },
  { id: "br-278", name: "Intermetatarsal Spaces (Plantar Interdigital Nerves)", system: "Peripheral Nerve", short: "Morton's Space" },
  { id: "br-279", name: "Phalanges of the Foot", system: "Musculoskeletal", short: "Toes" },
  { id: "br-280", name: "Interphalangeal Joints of the Toes", system: "Joints", short: "Toe IP Joints" },

  // 10. Whole-Body / Systemic Regions
  { id: "br-281", name: "Whole-Body / Systemic Regions", system: "Whole-Body", short: "Whole-Body" },
  { id: "br-282", name: "Integumentary System (Epidermis, Dermis, Subcutaneous Adipose Tissue)", system: "Integumentary", short: "Skin & Subcutis" },
  { id: "br-283", name: "Systemic Arterial Tree", system: "Cardiovascular", short: "Arteries" },
  { id: "br-284", name: "Systemic Venous Circulation", system: "Cardiovascular", short: "Veins" },
  { id: "br-285", name: "Systemic Lymphatic Chains and Ducts", system: "Lymphatic", short: "Lymphatics" },
  { id: "br-286", name: "Peripheral Nervous System / Nerve Plexuses (Brachial, Lumbar, Sacral)", system: "Peripheral Nerve", short: "PNS / Plexuses" },
  { id: "br-287", name: "Total Skeletal Axis (Whole-Body Musculoskeletal Framework)", system: "Musculoskeletal", short: "Full Skeleton" },
] as const;

/**
 * Returns matching body regions and ghost completion for a given user query.
 */
export function getBodyRegionMatches(query: string, maxResults = 8): {
  matches: BodyRegionItem[];
  ghostSuggestion: string | null;
} {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) {
    return {
      matches: BODY_REGIONS_CATALOG.slice(0, maxResults) as BodyRegionItem[],
      ghostSuggestion: null,
    };
  }

  const startsWithList: BodyRegionItem[] = [];
  const acronymList: BodyRegionItem[] = [];
  const wordBoundaryList: BodyRegionItem[] = [];
  const substringList: BodyRegionItem[] = [];

  for (const item of BODY_REGIONS_CATALOG) {
    const lowerName = item.name.toLowerCase();
    const lowerShort = (item.short || "").toLowerCase();

    if (lowerName.startsWith(cleanQuery)) {
      startsWithList.push(item);
    } else if (lowerShort && (lowerShort === cleanQuery || lowerShort.startsWith(cleanQuery))) {
      acronymList.push(item);
    } else {
      const words = lowerName.split(/[\s(/,-]+/);
      if (words.some((w) => w.startsWith(cleanQuery))) {
        wordBoundaryList.push(item);
      } else if (lowerName.includes(cleanQuery)) {
        substringList.push(item);
      }
    }
  }

  const combined = [...startsWithList, ...acronymList, ...wordBoundaryList, ...substringList];
  const uniqueMatches = Array.from(new Set(combined)).slice(0, maxResults);

  let ghostSuggestion: string | null = null;
  if (startsWithList.length > 0) {
    const firstMatch = startsWithList[0].name;
    ghostSuggestion = firstMatch.slice(cleanQuery.length);
  } else if (acronymList.length > 0) {
    ghostSuggestion = ` - ${acronymList[0].name}`;
  }

  return {
    matches: uniqueMatches,
    ghostSuggestion,
  };
}
