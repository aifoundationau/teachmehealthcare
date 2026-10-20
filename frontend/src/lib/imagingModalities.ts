/**
 * Comprehensive Medical Imaging Modalities Catalog
 * Includes all diagnostic radiography, fluoroscopy, tomography, nuclear medicine,
 * magnetic resonance, ultrasound, optical, endoscopic, microscopy, and molecular modalities.
 */

export interface ImagingModalityItem {
  id: string;
  name: string;
  short?: string;
  category: string;
  apiBucket: "xray" | "ct" | "mri" | "ultrasound" | "other";
}

export const IMAGING_MODALITIES: readonly ImagingModalityItem[] = [
  // 1. Plain Radiography, Fluoroscopy & Angiography
  { id: "mod-1", name: "Projection Radiography (Plain X-ray)", short: "X-ray", category: "Radiography", apiBucket: "xray" },
  { id: "mod-2", name: "Fluoroscopy", short: "Fluoro", category: "Fluoroscopy", apiBucket: "xray" },
  { id: "mod-3", name: "Continuous Fluoroscopy", short: "Fluoro", category: "Fluoroscopy", apiBucket: "xray" },
  { id: "mod-4", name: "Pulsed Fluoroscopy", short: "Fluoro", category: "Fluoroscopy", apiBucket: "xray" },
  { id: "mod-5", name: "Digital Subtraction Angiography (DSA)", short: "DSA", category: "Angiography", apiBucket: "xray" },
  { id: "mod-6", name: "Rotational Angiography", short: "3D-RA", category: "Angiography", apiBucket: "xray" },
  { id: "mod-7", name: "Dual-Energy X-ray Absorptiometry (DEXA / DXA)", short: "DEXA", category: "Densitometry", apiBucket: "xray" },
  { id: "mod-8", name: "Single-Photon Absorptiometry (SPA)", short: "SPA", category: "Densitometry", apiBucket: "xray" },
  { id: "mod-9", name: "Dual-Photon Absorptiometry (DPA)", short: "DPA", category: "Densitometry", apiBucket: "xray" },
  { id: "mod-10", name: "Conventional Linear Tomography", short: "Tomography", category: "Radiography", apiBucket: "xray" },

  // 2. Mammography & Breast Imaging
  { id: "mod-11", name: "Digital Mammography (Full-Field Digital Mammography - FFDM)", short: "FFDM", category: "Mammography", apiBucket: "xray" },
  { id: "mod-12", name: "Digital Breast Tomosynthesis (DBT)", short: "DBT", category: "Mammography", apiBucket: "xray" },
  { id: "mod-13", name: "Contrast-Enhanced Mammography (CEM / CEDM)", short: "CEM", category: "Mammography", apiBucket: "xray" },
  { id: "mod-14", name: "Stereotactic Breast Biopsy Imaging", short: "Stereotactic", category: "Interventional", apiBucket: "xray" },

  // 3. Computed Tomography (CT)
  { id: "mod-15", name: "Standard Computed Tomography (CT)", short: "CT", category: "Computed Tomography", apiBucket: "ct" },
  { id: "mod-16", name: "Helical / Spiral Computed Tomography", short: "Spiral CT", category: "Computed Tomography", apiBucket: "ct" },
  { id: "mod-17", name: "Multidetector Computed Tomography (MDCT)", short: "MDCT", category: "Computed Tomography", apiBucket: "ct" },
  { id: "mod-18", name: "High-Resolution Computed Tomography (HRCT)", short: "HRCT", category: "Computed Tomography", apiBucket: "ct" },
  { id: "mod-19", name: "Cone-Beam Computed Tomography (CBCT)", short: "CBCT", category: "Computed Tomography", apiBucket: "ct" },
  { id: "mod-20", name: "Dual-Energy Computed Tomography (DECT)", short: "DECT", category: "Computed Tomography", apiBucket: "ct" },
  { id: "mod-21", name: "Spectral Computed Tomography", short: "Spectral CT", category: "Computed Tomography", apiBucket: "ct" },
  { id: "mod-22", name: "Photon-Counting Computed Tomography (PC-CT)", short: "PC-CT", category: "Computed Tomography", apiBucket: "ct" },
  { id: "mod-23", name: "Computed Tomography Angiography (CTA)", short: "CTA", category: "Computed Tomography", apiBucket: "ct" },
  { id: "mod-24", name: "Computed Tomography Perfusion (CTP)", short: "CTP", category: "Computed Tomography", apiBucket: "ct" },
  { id: "mod-25", name: "Computed Tomography Enterography / Enteroclysis", short: "CTE", category: "Computed Tomography", apiBucket: "ct" },
  { id: "mod-26", name: "Computed Tomography Colonography (Virtual Colonoscopy)", short: "CTC", category: "Computed Tomography", apiBucket: "ct" },

  // 4. Nuclear Medicine & Molecular Imaging
  { id: "mod-27", name: "Single-Photon Emission Computed Tomography (SPECT)", short: "SPECT", category: "Nuclear Medicine", apiBucket: "other" },
  { id: "mod-28", name: "Positron Emission Tomography (PET)", short: "PET", category: "Nuclear Medicine", apiBucket: "other" },
  { id: "mod-29", name: "Dynamic Positron Emission Tomography", short: "Dynamic PET", category: "Nuclear Medicine", apiBucket: "other" },
  { id: "mod-30", name: "PET-CT (Hybrid Imaging)", short: "PET-CT", category: "Hybrid Imaging", apiBucket: "ct" },
  { id: "mod-31", name: "PET-MRI (Hybrid Imaging)", short: "PET-MRI", category: "Hybrid Imaging", apiBucket: "mri" },
  { id: "mod-32", name: "SPECT-CT (Hybrid Imaging)", short: "SPECT-CT", category: "Hybrid Imaging", apiBucket: "ct" },
  { id: "mod-33", name: "Planar Scintigraphy (Gamma Camera Imaging)", short: "Scintigraphy", category: "Nuclear Medicine", apiBucket: "other" },
  { id: "mod-34", name: "Radionuclide Cisternography", short: "Cisternography", category: "Nuclear Medicine", apiBucket: "other" },
  { id: "mod-35", name: "Radionuclide Venography", short: "RNV", category: "Nuclear Medicine", apiBucket: "other" },
  { id: "mod-36", name: "Radionuclide Lymphoscintigraphy", short: "Lymphoscintigraphy", category: "Nuclear Medicine", apiBucket: "other" },
  { id: "mod-37", name: "Radionuclide Ventriculography (MUGA Scan)", short: "MUGA", category: "Nuclear Medicine", apiBucket: "other" },
  { id: "mod-38", name: "Radioiodine Whole-Body Scintigraphy", short: "I-131 Scan", category: "Nuclear Medicine", apiBucket: "other" },
  { id: "mod-39", name: "Scintimammography (Molecular Breast Imaging / Breast-Specific Gamma Imaging)", short: "MBI / BSGI", category: "Nuclear Medicine", apiBucket: "other" },

  // 5. Magnetic Resonance Imaging (MRI)
  { id: "mod-40", name: "Standard Structural Magnetic Resonance Imaging (T1, T2, PD-weighted MRI)", short: "MRI", category: "Magnetic Resonance", apiBucket: "mri" },
  { id: "mod-41", name: "Fluid-Attenuated Inversion Recovery (FLAIR) MRI", short: "FLAIR", category: "Magnetic Resonance", apiBucket: "mri" },
  { id: "mod-42", name: "Short Tau Inversion Recovery (STIR) MRI", short: "STIR", category: "Magnetic Resonance", apiBucket: "mri" },
  { id: "mod-43", name: "Diffusion-Weighted Magnetic Resonance Imaging (DWI)", short: "DWI", category: "Magnetic Resonance", apiBucket: "mri" },
  { id: "mod-44", name: "Diffusion Tensor Imaging (DTI / Tractography)", short: "DTI", category: "Magnetic Resonance", apiBucket: "mri" },
  { id: "mod-45", name: "Apparent Diffusion Coefficient (ADC) Mapping", short: "ADC", category: "Magnetic Resonance", apiBucket: "mri" },
  { id: "mod-46", name: "Perfusion-Weighted Magnetic Resonance Imaging (PWI)", short: "PWI", category: "Magnetic Resonance", apiBucket: "mri" },
  { id: "mod-47", name: "Dynamic Contrast-Enhanced MRI (DCE-MRI)", short: "DCE-MRI", category: "Magnetic Resonance", apiBucket: "mri" },
  { id: "mod-48", name: "Dynamic Susceptibility Contrast MRI (DSC-MRI)", short: "DSC-MRI", category: "Magnetic Resonance", apiBucket: "mri" },
  { id: "mod-49", name: "Arterial Spin Labeling (ASL) MRI", short: "ASL", category: "Magnetic Resonance", apiBucket: "mri" },
  { id: "mod-50", name: "Functional Magnetic Resonance Imaging (fMRI - BOLD)", short: "fMRI", category: "Magnetic Resonance", apiBucket: "mri" },
  { id: "mod-51", name: "Magnetic Resonance Angiography (MRA)", short: "MRA", category: "Magnetic Resonance", apiBucket: "mri" },
  { id: "mod-52", name: "Magnetic Resonance Venography (MRV)", short: "MRV", category: "Magnetic Resonance", apiBucket: "mri" },
  { id: "mod-53", name: "Magnetic Resonance Cholangiopancreatography (MRCP)", short: "MRCP", category: "Magnetic Resonance", apiBucket: "mri" },
  { id: "mod-54", name: "Magnetic Resonance Urography (MRU)", short: "MRU", category: "Magnetic Resonance", apiBucket: "mri" },
  { id: "mod-55", name: "Magnetic Resonance Enterography (MRE)", short: "MRE", category: "Magnetic Resonance", apiBucket: "mri" },
  { id: "mod-56", name: "Magnetic Resonance Myelography", short: "MRM", category: "Magnetic Resonance", apiBucket: "mri" },
  { id: "mod-57", name: "Magnetic Resonance Elastography (MRE)", short: "MR Elastography", category: "Magnetic Resonance", apiBucket: "mri" },
  { id: "mod-58", name: "Magnetic Resonance Spectroscopy (MRS)", short: "MRS", category: "Magnetic Resonance", apiBucket: "mri" },
  { id: "mod-59", name: "Susceptibility-Weighted Imaging (SWI)", short: "SWI", category: "Magnetic Resonance", apiBucket: "mri" },
  { id: "mod-60", name: "Cardiac Magnetic Resonance (CMR) Imaging", short: "CMR", category: "Magnetic Resonance", apiBucket: "mri" },
  { id: "mod-61", name: "Chemical Exchange Saturation Transfer (CEST) MRI", short: "CEST", category: "Magnetic Resonance", apiBucket: "mri" },
  { id: "mod-62", name: "Hyperpolarized Gas Magnetic Resonance Imaging (Xe-129, He-3)", short: "HP Gas MRI", category: "Magnetic Resonance", apiBucket: "mri" },
  { id: "mod-63", name: "Low-Field Portable Magnetic Resonance Imaging", short: "Portable MRI", category: "Magnetic Resonance", apiBucket: "mri" },
  { id: "mod-64", name: "Ultra-High-Field Magnetic Resonance Imaging (7T+)", short: "7T MRI", category: "Magnetic Resonance", apiBucket: "mri" },

  // 6. Diagnostic Ultrasound & Echocardiography
  { id: "mod-65", name: "A-Scan Ultrasound (Amplitude Mode)", short: "A-Scan", category: "Ultrasound", apiBucket: "ultrasound" },
  { id: "mod-66", name: "B-Scan Ultrasound (Brightness Mode)", short: "B-Scan", category: "Ultrasound", apiBucket: "ultrasound" },
  { id: "mod-67", name: "M-Scan Ultrasound (Motion Mode)", short: "M-Mode", category: "Ultrasound", apiBucket: "ultrasound" },
  { id: "mod-68", name: "Color Doppler Ultrasound", short: "Color Doppler", category: "Ultrasound", apiBucket: "ultrasound" },
  { id: "mod-69", name: "Power Doppler Ultrasound", short: "Power Doppler", category: "Ultrasound", apiBucket: "ultrasound" },
  { id: "mod-70", name: "Spectral / Pulsed-Wave Doppler Ultrasound", short: "PW Doppler", category: "Ultrasound", apiBucket: "ultrasound" },
  { id: "mod-71", name: "Continuous-Wave Doppler Ultrasound", short: "CW Doppler", category: "Ultrasound", apiBucket: "ultrasound" },
  { id: "mod-72", name: "Duplex Ultrasound", short: "Duplex", category: "Ultrasound", apiBucket: "ultrasound" },
  { id: "mod-73", name: "Triplex Ultrasound", short: "Triplex", category: "Ultrasound", apiBucket: "ultrasound" },
  { id: "mod-74", name: "Tissue Doppler Imaging (TDI)", short: "TDI", category: "Ultrasound", apiBucket: "ultrasound" },
  { id: "mod-75", name: "Contrast-Enhanced Ultrasound (CEUS)", short: "CEUS", category: "Ultrasound", apiBucket: "ultrasound" },
  { id: "mod-76", name: "Point-of-Care Ultrasound (POCUS)", short: "POCUS", category: "Ultrasound", apiBucket: "ultrasound" },
  { id: "mod-77", name: "Transesophageal Echocardiography (TEE)", short: "TEE", category: "Ultrasound", apiBucket: "ultrasound" },
  { id: "mod-78", name: "Transthoracic Echocardiography (TTE)", short: "TTE", category: "Ultrasound", apiBucket: "ultrasound" },
  { id: "mod-79", name: "Intracardiac Echocardiography (ICE)", short: "ICE", category: "Ultrasound", apiBucket: "ultrasound" },
  { id: "mod-80", name: "Intravascular Ultrasound (IVUS)", short: "IVUS", category: "Ultrasound", apiBucket: "ultrasound" },
  { id: "mod-81", name: "Endoscopic Ultrasound (EUS)", short: "EUS", category: "Ultrasound", apiBucket: "ultrasound" },
  { id: "mod-82", name: "Endobronchial Ultrasound (EBUS)", short: "EBUS", category: "Ultrasound", apiBucket: "ultrasound" },
  { id: "mod-83", name: "Transvaginal Ultrasound (TVS)", short: "TVS", category: "Ultrasound", apiBucket: "ultrasound" },
  { id: "mod-84", name: "Transrectal Ultrasound (TRUS)", short: "TRUS", category: "Ultrasound", apiBucket: "ultrasound" },
  { id: "mod-85", name: "Transcranial Doppler (TCD)", short: "TCD", category: "Ultrasound", apiBucket: "ultrasound" },
  { id: "mod-86", name: "Transcranial Color-Coded Duplex Sonography (TCCS)", short: "TCCS", category: "Ultrasound", apiBucket: "ultrasound" },
  { id: "mod-87", name: "Ultrasound Elastography (Strain Elastography)", short: "Strain Elastography", category: "Ultrasound", apiBucket: "ultrasound" },
  { id: "mod-88", name: "Ultrasound Shear-Wave Elastography (SWE)", short: "SWE", category: "Ultrasound", apiBucket: "ultrasound" },
  { id: "mod-89", name: "Acoustic Radiation Force Impulse (ARFI) Imaging", short: "ARFI", category: "Ultrasound", apiBucket: "ultrasound" },
  { id: "mod-90", name: "3D / 4D Diagnostic Ultrasound", short: "3D/4D US", category: "Ultrasound", apiBucket: "ultrasound" },
  { id: "mod-91", name: "High-Frequency Ultrasound (HFUS)", short: "HFUS", category: "Ultrasound", apiBucket: "ultrasound" },
  { id: "mod-92", name: "Automated Breast Ultrasound (ABUS)", short: "ABUS", category: "Ultrasound", apiBucket: "ultrasound" },

  // 7. Optical & Ophthalmic Imaging
  { id: "mod-93", name: "Optical Coherence Tomography (OCT)", short: "OCT", category: "Optical & Ophthalmic", apiBucket: "other" },
  { id: "mod-94", name: "Swept-Source Optical Coherence Tomography (SS-OCT)", short: "SS-OCT", category: "Optical & Ophthalmic", apiBucket: "other" },
  { id: "mod-95", name: "Spectral-Domain Optical Coherence Tomography (SD-OCT)", short: "SD-OCT", category: "Optical & Ophthalmic", apiBucket: "other" },
  { id: "mod-96", name: "Time-Domain Optical Coherence Tomography (TD-OCT)", short: "TD-OCT", category: "Optical & Ophthalmic", apiBucket: "other" },
  { id: "mod-97", name: "Optical Coherence Tomography Angiography (OCTA)", short: "OCTA", category: "Optical & Ophthalmic", apiBucket: "other" },
  { id: "mod-98", name: "Intravascular Optical Coherence Tomography (IV-OCT)", short: "IV-OCT", category: "Optical & Ophthalmic", apiBucket: "other" },
  { id: "mod-99", name: "Full-Field Optical Coherence Tomography (FF-OCT)", short: "FF-OCT", category: "Optical & Ophthalmic", apiBucket: "other" },
  { id: "mod-100", name: "Fundus Photography", short: "Fundus", category: "Optical & Ophthalmic", apiBucket: "other" },
  { id: "mod-101", name: "Fluorescein Angiography (FA)", short: "FFA", category: "Optical & Ophthalmic", apiBucket: "other" },
  { id: "mod-102", name: "Indocyanine Green Angiography (ICGA)", short: "ICGA", category: "Optical & Ophthalmic", apiBucket: "other" },
  { id: "mod-103", name: "Fundus Autofluorescence (FAF)", short: "FAF", category: "Optical & Ophthalmic", apiBucket: "other" },
  { id: "mod-104", name: "Corneal Topography (Placido-Disk Imaging)", short: "Topography", category: "Optical & Ophthalmic", apiBucket: "other" },
  { id: "mod-105", name: "Corneal Tomography (Scheimpflug Principle Imaging)", short: "Scheimpflug", category: "Optical & Ophthalmic", apiBucket: "other" },
  { id: "mod-106", name: "Anterior Segment Optical Coherence Tomography (AS-OCT)", short: "AS-OCT", category: "Optical & Ophthalmic", apiBucket: "other" },
  { id: "mod-107", name: "Specular Endothelial Microscopy", short: "Specular", category: "Optical & Ophthalmic", apiBucket: "other" },
  { id: "mod-108", name: "Confocal Microscopy of the Cornea", short: "Corneal Confocal", category: "Optical & Ophthalmic", apiBucket: "other" },
  { id: "mod-109", name: "Scanning Laser Ophthalmoscopy (SLO)", short: "SLO", category: "Optical & Ophthalmic", apiBucket: "other" },
  { id: "mod-110", name: "Adaptive Optics Retinal Imaging (AO-SLO / AO-OCT)", short: "AO-SLO", category: "Optical & Ophthalmic", apiBucket: "other" },
  { id: "mod-111", name: "Goniophotography", short: "Gonio", category: "Optical & Ophthalmic", apiBucket: "other" },
  { id: "mod-112", name: "Ocular Ultrasound Biomicroscopy (UBM)", short: "UBM", category: "Optical & Ophthalmic", apiBucket: "ultrasound" },

  // 8. Endoscopy & Advanced Optical Endomicroscopy
  { id: "mod-113", name: "White Light Endoscopy (WLE)", short: "WLE", category: "Endoscopy", apiBucket: "other" },
  { id: "mod-114", name: "Narrow-Band Imaging (NBI)", short: "NBI", category: "Endoscopy", apiBucket: "other" },
  { id: "mod-115", name: "Flexible Spectral Imaging Color Enhancement (FICE)", short: "FICE", category: "Endoscopy", apiBucket: "other" },
  { id: "mod-116", name: "i-Scan Endoscopy", short: "i-Scan", category: "Endoscopy", apiBucket: "other" },
  { id: "mod-117", name: "Autofluorescence Imaging (AFI) Endoscopy", short: "AFI", category: "Endoscopy", apiBucket: "other" },
  { id: "mod-118", name: "Chromoendoscopy", short: "Chromo", category: "Endoscopy", apiBucket: "other" },
  { id: "mod-119", name: "Confocal Laser Endomicroscopy (Probe-based pCLE / Needle-based nCLE)", short: "CLE", category: "Endoscopy", apiBucket: "other" },
  { id: "mod-120", name: "Endocytoscopy", short: "Endocytoscopy", category: "Endoscopy", apiBucket: "other" },
  { id: "mod-121", name: "Capsule Endoscopy", short: "PillCam", category: "Endoscopy", apiBucket: "other" },
  { id: "mod-122", name: "Intraoperative Fluorescence Imaging (Indocyanine Green / 5-ALA)", short: "IFI (ICG/5-ALA)", category: "Interventional", apiBucket: "other" },

  // 9. Dermatology & Surface Imaging
  { id: "mod-123", name: "Digital Dermoscopy", short: "Dermoscopy", category: "Dermatology", apiBucket: "other" },
  { id: "mod-124", name: "Reflectance Confocal Microscopy (RCM)", short: "RCM", category: "Dermatology", apiBucket: "other" },
  { id: "mod-125", name: "Multiphoton Microscopy / Two-Photon Excitation Microscopy", short: "TPEM", category: "Microscopy", apiBucket: "other" },
  { id: "mod-126", name: "Second Harmonic Generation (SHG) Imaging", short: "SHG", category: "Microscopy", apiBucket: "other" },
  { id: "mod-127", name: "Third Harmonic Generation (THG) Imaging", short: "THG", category: "Microscopy", apiBucket: "other" },

  // 10. Spectroscopy, Diffuse Optical & Perfusion
  { id: "mod-128", name: "Raman Spectroscopy Imaging", short: "Raman", category: "Spectroscopy", apiBucket: "other" },
  { id: "mod-129", name: "Surface-Enhanced Raman Scattering (SERS) Imaging", short: "SERS", category: "Spectroscopy", apiBucket: "other" },
  { id: "mod-130", name: "Coherent Anti-Stokes Raman Scattering (CARS) Microscopy", short: "CARS", category: "Spectroscopy", apiBucket: "other" },
  { id: "mod-131", name: "Stimulated Raman Scattering (SRS) Microscopy", short: "SRS", category: "Spectroscopy", apiBucket: "other" },
  { id: "mod-132", name: "Spatial Frequency Domain Imaging (SFDI)", short: "SFDI", category: "Optical Imaging", apiBucket: "other" },
  { id: "mod-133", name: "Laser Doppler Imaging (LDI)", short: "LDI", category: "Optical Imaging", apiBucket: "other" },
  { id: "mod-134", name: "Laser Speckle Contrast Imaging (LSCI)", short: "LSCI", category: "Optical Imaging", apiBucket: "other" },
  { id: "mod-135", name: "Near-Infrared Spectroscopy (NIRS) Imaging", short: "NIRS", category: "Optical Imaging", apiBucket: "other" },
  { id: "mod-136", name: "Functional Near-Infrared Spectroscopy (fNIRS)", short: "fNIRS", category: "Optical Imaging", apiBucket: "other" },
  { id: "mod-137", name: "Diffuse Optical Tomography (DOT)", short: "DOT", category: "Optical Imaging", apiBucket: "other" },
  { id: "mod-138", name: "Diffuse Optical Spectroscopic Imaging (DOSI)", short: "DOSI", category: "Optical Imaging", apiBucket: "other" },

  // 11. Photoacoustic & Bio-impedance Imaging
  { id: "mod-139", name: "Photoacoustic Tomography (PAT)", short: "PAT", category: "Photoacoustic", apiBucket: "other" },
  { id: "mod-140", name: "Photoacoustic Microscopy (PAM)", short: "PAM", category: "Photoacoustic", apiBucket: "other" },
  { id: "mod-141", name: "Intravascular Photoacoustic Imaging (IVPA)", short: "IVPA", category: "Photoacoustic", apiBucket: "other" },
  { id: "mod-142", name: "Electrical Impedance Tomography (EIT)", short: "EIT", category: "Electrical & Magnetic", apiBucket: "other" },
  { id: "mod-143", name: "Electrical Impedance Mammography (EIM)", short: "EIM", category: "Electrical & Magnetic", apiBucket: "other" },

  // 12. Magnetic Source & Particle Imaging
  { id: "mod-144", name: "Magnetic Particle Imaging (MPI)", short: "MPI", category: "Electrical & Magnetic", apiBucket: "other" },
  { id: "mod-145", name: "Magnetic Source Imaging (Magnetoencephalography - MEG)", short: "MEG", category: "Electrical & Magnetic", apiBucket: "other" },
  { id: "mod-146", name: "Magnetocardiography (MCG)", short: "MCG", category: "Electrical & Magnetic", apiBucket: "other" },
  { id: "mod-147", name: "Magneto-Acoustic Imaging", short: "MAI", category: "Electrical & Magnetic", apiBucket: "other" },

  // 13. Thermography, Terahertz & Microwave
  { id: "mod-148", name: "Medical Infrared Thermography (Digital Infrared Thermal Imaging - DITI)", short: "DITI", category: "Thermography", apiBucket: "other" },
  { id: "mod-149", name: "Dynamic Infrared Thermography (DIRT)", short: "DIRT", category: "Thermography", apiBucket: "other" },
  { id: "mod-150", name: "Terahertz Pulsed Imaging (TPI)", short: "TPI", category: "Terahertz & Microwave", apiBucket: "other" },
  { id: "mod-151", name: "Microwave Tomography (MWT)", short: "MWT", category: "Terahertz & Microwave", apiBucket: "other" },
  { id: "mod-152", name: "Microwave Radar Imaging", short: "MRI Radar", category: "Terahertz & Microwave", apiBucket: "other" },
  { id: "mod-153", name: "Acousto-Optic Imaging (AOI)", short: "AOI", category: "Hybrid Optical", apiBucket: "other" },
  { id: "mod-154", name: "Optical Projection Tomography (OPT)", short: "OPT", category: "Optical Imaging", apiBucket: "other" },
  { id: "mod-155", name: "Cerebral Oximetry Optical Mapping", short: "Cerebral Ox", category: "Optical Imaging", apiBucket: "other" },

  // 14. Digital Pathology & Mass Spectrometry Imaging
  { id: "mod-156", name: "Whole-Slide Digital Pathology Imaging (WSI)", short: "WSI", category: "Pathology", apiBucket: "other" },
  { id: "mod-157", name: "Matrix-Assisted Laser Desorption/Ionization Mass Spectrometry Imaging (MALDI-MSI)", short: "MALDI-MSI", category: "Pathology & Mass Spec", apiBucket: "other" },
  { id: "mod-158", name: "Secondary Ion Mass Spectrometry Imaging (SIMS)", short: "SIMS", category: "Pathology & Mass Spec", apiBucket: "other" },
  { id: "mod-159", name: "Desorption Electrospray Ionization Imaging (DESI-MSI)", short: "DESI-MSI", category: "Pathology & Mass Spec", apiBucket: "other" },

  // 15. Advanced Particle, Synchrotron & Bioluminescence
  { id: "mod-160", name: "Synchrotron Radiation Computed Tomography (SRCT)", short: "SRCT", category: "Advanced Physics", apiBucket: "ct" },
  { id: "mod-161", name: "X-ray Phase-Contrast Imaging (XPCI)", short: "XPCI", category: "Advanced Physics", apiBucket: "xray" },
  { id: "mod-162", name: "Proton Radiography", short: "pRad", category: "Particle Imaging", apiBucket: "other" },
  { id: "mod-163", name: "Proton Computed Tomography (pCT)", short: "pCT", category: "Particle Imaging", apiBucket: "ct" },
  { id: "mod-164", name: "Heavy-Ion Tomography", short: "Heavy-Ion", category: "Particle Imaging", apiBucket: "other" },
  { id: "mod-165", name: "Neutron Radiography", short: "Neutron", category: "Particle Imaging", apiBucket: "other" },
  { id: "mod-166", name: "Gamma-Ray Optical Fluorescence Imaging", short: "Gamma Optical", category: "Molecular", apiBucket: "other" },
  { id: "mod-167", name: "Cherenkov Luminescence Imaging (CLI)", short: "CLI", category: "Molecular", apiBucket: "other" },
  { id: "mod-168", name: "Radioluminescence Microscopy", short: "RLM", category: "Molecular", apiBucket: "other" },
  { id: "mod-169", name: "Bioluminescence Imaging (BLI)", short: "BLI", category: "Molecular", apiBucket: "other" },
  { id: "mod-170", name: "X-ray Fluorescence Imaging (XFI)", short: "XFI", category: "Molecular", apiBucket: "xray" },
] as const;

/**
 * Returns matching modalities and ghost completion for a given user query.
 */
export function getModalityMatches(query: string, maxResults = 8): {
  matches: ImagingModalityItem[];
  ghostSuggestion: string | null;
} {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) {
    return {
      matches: IMAGING_MODALITIES.slice(0, maxResults) as ImagingModalityItem[],
      ghostSuggestion: null,
    };
  }

  // Rank matches:
  // 1. Starts with query (case-insensitive) -> yields inline ghost text
  // 2. Acronym or short form exact/prefix match (e.g. "dsa", "pocus", "fmri", "swi")
  // 3. Word boundary match (e.g. "ultrasound" matches "Point-of-Care Ultrasound")
  // 4. Substring match
  const startsWithList: ImagingModalityItem[] = [];
  const acronymList: ImagingModalityItem[] = [];
  const wordBoundaryList: ImagingModalityItem[] = [];
  const substringList: ImagingModalityItem[] = [];

  for (const item of IMAGING_MODALITIES) {
    const lowerName = item.name.toLowerCase();
    const lowerShort = (item.short || "").toLowerCase();

    if (lowerName.startsWith(cleanQuery)) {
      startsWithList.push(item);
    } else if (lowerShort && (lowerShort === cleanQuery || lowerShort.startsWith(cleanQuery))) {
      acronymList.push(item);
    } else {
      // Check word boundary
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

  // Compute ghost suggestion:
  // If the first match starts with the query, the ghost text is the remainder of that match's name.
  let ghostSuggestion: string | null = null;
  if (startsWithList.length > 0) {
    const firstMatch = startsWithList[0].name;
    // Keep user's typed casing and append the remainder
    ghostSuggestion = firstMatch.slice(cleanQuery.length);
  } else if (acronymList.length > 0) {
    ghostSuggestion = ` - ${acronymList[0].name}`;
  }

  return {
    matches: uniqueMatches,
    ghostSuggestion,
  };
}

/**
 * Maps any modality string to the server API bucket ('xray', 'ct', 'mri', 'ultrasound', 'other').
 */
export function mapModalityToApiBucket(modalityName: string): "xray" | "ct" | "mri" | "ultrasound" | "other" {
  const found = IMAGING_MODALITIES.find(
    (m) => m.name.toLowerCase() === modalityName.toLowerCase() || m.short?.toLowerCase() === modalityName.toLowerCase()
  );
  if (found) return found.apiBucket;

  const lower = modalityName.toLowerCase();
  if (lower.includes("ct") || lower.includes("tomograph")) return "ct";
  if (lower.includes("mr") || lower.includes("magnetic")) return "mri";
  if (lower.includes("ultrasound") || lower.includes("doppler") || lower.includes("echo") || lower.includes("sonograph")) return "ultrasound";
  if (lower.includes("x-ray") || lower.includes("radiograph") || lower.includes("fluoro") || lower.includes("mammograph") || lower.includes("dsa")) return "xray";
  return "other";
}
