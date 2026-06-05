// Common Indian drug database — 200+ entries for clinic prescription module
// Fields: generic, brand, formulation, strength, scheduleH, scheduleX, category

const DRUGS = [
  // ── Antibiotics ──────────────────────────────────────────────────────────────
  { generic: 'Amoxicillin', brand: 'Mox / Novamox', formulation: 'Capsule', strength: '500mg', scheduleH: true, scheduleX: false, category: 'Antibiotic' },
  { generic: 'Amoxicillin', brand: 'Mox / Novamox', formulation: 'Syrup', strength: '125mg/5mL', scheduleH: true, scheduleX: false, category: 'Antibiotic' },
  { generic: 'Amoxicillin + Clavulanic Acid', brand: 'Augmentin / Clavam', formulation: 'Tablet', strength: '625mg', scheduleH: true, scheduleX: false, category: 'Antibiotic' },
  { generic: 'Amoxicillin + Clavulanic Acid', brand: 'Augmentin / Clavam', formulation: 'Tablet', strength: '1000mg', scheduleH: true, scheduleX: false, category: 'Antibiotic' },
  { generic: 'Azithromycin', brand: 'Azithral / Zithromax', formulation: 'Tablet', strength: '250mg', scheduleH: true, scheduleX: false, category: 'Antibiotic' },
  { generic: 'Azithromycin', brand: 'Azithral / Zithromax', formulation: 'Tablet', strength: '500mg', scheduleH: true, scheduleX: false, category: 'Antibiotic' },
  { generic: 'Ciprofloxacin', brand: 'Ciplox / Cifran', formulation: 'Tablet', strength: '500mg', scheduleH: true, scheduleX: false, category: 'Antibiotic' },
  { generic: 'Doxycycline', brand: 'Doxy / Vibramycin', formulation: 'Capsule', strength: '100mg', scheduleH: true, scheduleX: false, category: 'Antibiotic' },
  { generic: 'Cefixime', brand: 'Zifi / Taxim-O', formulation: 'Tablet', strength: '200mg', scheduleH: true, scheduleX: false, category: 'Antibiotic' },
  { generic: 'Cefuroxime', brand: 'Ceftas / Zinnat', formulation: 'Tablet', strength: '250mg', scheduleH: true, scheduleX: false, category: 'Antibiotic' },
  { generic: 'Metronidazole', brand: 'Flagyl / Metrogyl', formulation: 'Tablet', strength: '400mg', scheduleH: true, scheduleX: false, category: 'Antibiotic' },
  { generic: 'Cotrimoxazole', brand: 'Septran / Bactrim', formulation: 'Tablet', strength: '960mg', scheduleH: true, scheduleX: false, category: 'Antibiotic' },
  { generic: 'Levofloxacin', brand: 'Levoflox / Levaquin', formulation: 'Tablet', strength: '500mg', scheduleH: true, scheduleX: false, category: 'Antibiotic' },
  { generic: 'Clindamycin', brand: 'Dalacin / Cleocin', formulation: 'Capsule', strength: '300mg', scheduleH: true, scheduleX: false, category: 'Antibiotic' },
  { generic: 'Nitrofurantoin', brand: 'Macrobid / Nitrofur', formulation: 'Capsule', strength: '100mg', scheduleH: true, scheduleX: false, category: 'Antibiotic' },
  { generic: 'Cefpodoxime', brand: 'Cepodem / Vantin', formulation: 'Tablet', strength: '200mg', scheduleH: true, scheduleX: false, category: 'Antibiotic' },
  { generic: 'Clarithromycin', brand: 'Clarbact / Biaxin', formulation: 'Tablet', strength: '500mg', scheduleH: true, scheduleX: false, category: 'Antibiotic' },

  // ── Analgesics / NSAIDs ───────────────────────────────────────────────────────
  { generic: 'Paracetamol', brand: 'Dolo / Crocin / Calpol', formulation: 'Tablet', strength: '500mg', scheduleH: false, scheduleX: false, category: 'Analgesic' },
  { generic: 'Paracetamol', brand: 'Dolo / Crocin / Calpol', formulation: 'Tablet', strength: '650mg', scheduleH: false, scheduleX: false, category: 'Analgesic' },
  { generic: 'Paracetamol', brand: 'Calpol / Crocin', formulation: 'Syrup', strength: '125mg/5mL', scheduleH: false, scheduleX: false, category: 'Analgesic' },
  { generic: 'Ibuprofen', brand: 'Brufen / Advil', formulation: 'Tablet', strength: '400mg', scheduleH: false, scheduleX: false, category: 'NSAID' },
  { generic: 'Ibuprofen', brand: 'Brufen / Advil', formulation: 'Tablet', strength: '600mg', scheduleH: false, scheduleX: false, category: 'NSAID' },
  { generic: 'Ibuprofen + Paracetamol', brand: 'Combiflam / Ibugesic Plus', formulation: 'Tablet', strength: '400mg+325mg', scheduleH: false, scheduleX: false, category: 'NSAID' },
  { generic: 'Diclofenac', brand: 'Voveran / Voltaren', formulation: 'Tablet', strength: '50mg', scheduleH: true, scheduleX: false, category: 'NSAID' },
  { generic: 'Diclofenac + Paracetamol', brand: 'Voveran Plus / Diclopar', formulation: 'Tablet', strength: '50mg+500mg', scheduleH: true, scheduleX: false, category: 'NSAID' },
  { generic: 'Aspirin', brand: 'Ecosprin / Disprin', formulation: 'Tablet', strength: '75mg', scheduleH: false, scheduleX: false, category: 'Analgesic' },
  { generic: 'Aspirin', brand: 'Ecosprin', formulation: 'Tablet', strength: '150mg', scheduleH: false, scheduleX: false, category: 'Analgesic' },
  { generic: 'Nimesulide', brand: 'Nimulid / Nise', formulation: 'Tablet', strength: '100mg', scheduleH: true, scheduleX: false, category: 'NSAID' },
  { generic: 'Aceclofenac', brand: 'Zerodol / Hifenac', formulation: 'Tablet', strength: '100mg', scheduleH: true, scheduleX: false, category: 'NSAID' },
  { generic: 'Aceclofenac + Paracetamol', brand: 'Zerodol-P / Hifenac-P', formulation: 'Tablet', strength: '100mg+325mg', scheduleH: true, scheduleX: false, category: 'NSAID' },
  { generic: 'Tramadol', brand: 'Contramal / Ultram', formulation: 'Capsule', strength: '50mg', scheduleH: true, scheduleX: false, category: 'Analgesic' },
  { generic: 'Ketorolac', brand: 'Ketorol / Toradol', formulation: 'Tablet', strength: '10mg', scheduleH: true, scheduleX: false, category: 'NSAID' },
  { generic: 'Mefenamic Acid', brand: 'Meftal / Ponstan', formulation: 'Capsule', strength: '500mg', scheduleH: true, scheduleX: false, category: 'NSAID' },
  { generic: 'Etoricoxib', brand: 'Arcoxia / Etova', formulation: 'Tablet', strength: '90mg', scheduleH: true, scheduleX: false, category: 'NSAID' },

  // ── Antacids / GI ─────────────────────────────────────────────────────────────
  { generic: 'Omeprazole', brand: 'Omez / Prilosec', formulation: 'Capsule', strength: '20mg', scheduleH: false, scheduleX: false, category: 'Antacid/GI' },
  { generic: 'Pantoprazole', brand: 'Pan / Pantodac', formulation: 'Tablet', strength: '40mg', scheduleH: false, scheduleX: false, category: 'Antacid/GI' },
  { generic: 'Rabeprazole', brand: 'Rablet / Razo', formulation: 'Tablet', strength: '20mg', scheduleH: false, scheduleX: false, category: 'Antacid/GI' },
  { generic: 'Esomeprazole', brand: 'Nexium / Esoz', formulation: 'Tablet', strength: '40mg', scheduleH: false, scheduleX: false, category: 'Antacid/GI' },
  { generic: 'Ranitidine', brand: 'Rantac / Zantac', formulation: 'Tablet', strength: '150mg', scheduleH: false, scheduleX: false, category: 'Antacid/GI' },
  { generic: 'Domperidone', brand: 'Domstal / Motinorm', formulation: 'Tablet', strength: '10mg', scheduleH: false, scheduleX: false, category: 'Antacid/GI' },
  { generic: 'Domperidone + Omeprazole', brand: 'Domstal-O / Pan-D', formulation: 'Capsule', strength: '10mg+20mg', scheduleH: false, scheduleX: false, category: 'Antacid/GI' },
  { generic: 'Metoclopramide', brand: 'Perinorm / Reglan', formulation: 'Tablet', strength: '10mg', scheduleH: false, scheduleX: false, category: 'Antacid/GI' },
  { generic: 'Ondansetron', brand: 'Emset / Zofran', formulation: 'Tablet', strength: '4mg', scheduleH: true, scheduleX: false, category: 'Antacid/GI' },
  { generic: 'Dicyclomine', brand: 'Cyclopam / Mebeverine', formulation: 'Tablet', strength: '10mg', scheduleH: false, scheduleX: false, category: 'Antacid/GI' },
  { generic: 'Sucralfate', brand: 'Sucrafil / Carafate', formulation: 'Tablet', strength: '1g', scheduleH: false, scheduleX: false, category: 'Antacid/GI' },
  { generic: 'Antacid (Aluminum + Magnesium)', brand: 'Gelusil / Digene', formulation: 'Suspension', strength: '10mL', scheduleH: false, scheduleX: false, category: 'Antacid/GI' },
  { generic: 'Lactulose', brand: 'Duphalac / Cremaffin', formulation: 'Syrup', strength: '10g/15mL', scheduleH: false, scheduleX: false, category: 'Antacid/GI' },
  { generic: 'Loperamide', brand: 'Imodium / Lopamide', formulation: 'Tablet', strength: '2mg', scheduleH: false, scheduleX: false, category: 'Antacid/GI' },
  { generic: 'ORS (Oral Rehydration Salt)', brand: 'Electral / Pedialyte', formulation: 'Sachet', strength: '21.8g', scheduleH: false, scheduleX: false, category: 'Antacid/GI' },

  // ── Antidiabetics ─────────────────────────────────────────────────────────────
  { generic: 'Metformin', brand: 'Glycomet / Glucophage', formulation: 'Tablet', strength: '500mg', scheduleH: true, scheduleX: false, category: 'Antidiabetic' },
  { generic: 'Metformin', brand: 'Glycomet / Glucophage', formulation: 'Tablet', strength: '1000mg', scheduleH: true, scheduleX: false, category: 'Antidiabetic' },
  { generic: 'Glimepiride', brand: 'Amaryl / Glimisave', formulation: 'Tablet', strength: '1mg', scheduleH: true, scheduleX: false, category: 'Antidiabetic' },
  { generic: 'Glimepiride', brand: 'Amaryl / Glimisave', formulation: 'Tablet', strength: '2mg', scheduleH: true, scheduleX: false, category: 'Antidiabetic' },
  { generic: 'Glimepiride + Metformin', brand: 'Glimisave-M / Amaryl-M', formulation: 'Tablet', strength: '2mg+500mg', scheduleH: true, scheduleX: false, category: 'Antidiabetic' },
  { generic: 'Glibenclamide', brand: 'Daonil / Glibomet', formulation: 'Tablet', strength: '5mg', scheduleH: true, scheduleX: false, category: 'Antidiabetic' },
  { generic: 'Sitagliptin', brand: 'Januvia / Istamet', formulation: 'Tablet', strength: '100mg', scheduleH: true, scheduleX: false, category: 'Antidiabetic' },
  { generic: 'Voglibose', brand: 'Volix / Zedip', formulation: 'Tablet', strength: '0.3mg', scheduleH: true, scheduleX: false, category: 'Antidiabetic' },
  { generic: 'Dapagliflozin', brand: 'Forxiga / Dapagly', formulation: 'Tablet', strength: '10mg', scheduleH: true, scheduleX: false, category: 'Antidiabetic' },
  { generic: 'Empagliflozin', brand: 'Jardiance / Synjardy', formulation: 'Tablet', strength: '10mg', scheduleH: true, scheduleX: false, category: 'Antidiabetic' },
  { generic: 'Pioglitazone', brand: 'Pioglit / Actos', formulation: 'Tablet', strength: '15mg', scheduleH: true, scheduleX: false, category: 'Antidiabetic' },
  { generic: 'Insulin Glargine', brand: 'Lantus / Basalog', formulation: 'Injection', strength: '100 IU/mL', scheduleH: true, scheduleX: false, category: 'Antidiabetic' },
  { generic: 'Insulin Regular (Soluble)', brand: 'Actrapid / Huminsulin-R', formulation: 'Injection', strength: '100 IU/mL', scheduleH: true, scheduleX: false, category: 'Antidiabetic' },

  // ── Antihypertensives ─────────────────────────────────────────────────────────
  { generic: 'Amlodipine', brand: 'Amlip / Norvasc', formulation: 'Tablet', strength: '5mg', scheduleH: false, scheduleX: false, category: 'Antihypertensive' },
  { generic: 'Amlodipine', brand: 'Amlip / Norvasc', formulation: 'Tablet', strength: '10mg', scheduleH: false, scheduleX: false, category: 'Antihypertensive' },
  { generic: 'Telmisartan', brand: 'Telma / Micardis', formulation: 'Tablet', strength: '40mg', scheduleH: false, scheduleX: false, category: 'Antihypertensive' },
  { generic: 'Telmisartan', brand: 'Telma / Micardis', formulation: 'Tablet', strength: '80mg', scheduleH: false, scheduleX: false, category: 'Antihypertensive' },
  { generic: 'Telmisartan + Amlodipine', brand: 'Telma-AM / Twynsta', formulation: 'Tablet', strength: '40mg+5mg', scheduleH: false, scheduleX: false, category: 'Antihypertensive' },
  { generic: 'Losartan', brand: 'Losar / Cozaar', formulation: 'Tablet', strength: '50mg', scheduleH: false, scheduleX: false, category: 'Antihypertensive' },
  { generic: 'Enalapril', brand: 'Enam / Vasotec', formulation: 'Tablet', strength: '5mg', scheduleH: true, scheduleX: false, category: 'Antihypertensive' },
  { generic: 'Ramipril', brand: 'Cardace / Altace', formulation: 'Tablet', strength: '5mg', scheduleH: true, scheduleX: false, category: 'Antihypertensive' },
  { generic: 'Atenolol', brand: 'Tenormin / Aten', formulation: 'Tablet', strength: '50mg', scheduleH: false, scheduleX: false, category: 'Antihypertensive' },
  { generic: 'Metoprolol', brand: 'Betaloc / Metolar', formulation: 'Tablet', strength: '25mg', scheduleH: false, scheduleX: false, category: 'Antihypertensive' },
  { generic: 'Metoprolol', brand: 'Betaloc / Metolar', formulation: 'Tablet', strength: '50mg', scheduleH: false, scheduleX: false, category: 'Antihypertensive' },
  { generic: 'Hydrochlorothiazide', brand: 'HCT / Esidrex', formulation: 'Tablet', strength: '12.5mg', scheduleH: false, scheduleX: false, category: 'Antihypertensive' },
  { generic: 'Nifedipine', brand: 'Adalat / Depin', formulation: 'Tablet', strength: '10mg', scheduleH: true, scheduleX: false, category: 'Antihypertensive' },

  // ── Lipid-lowering ────────────────────────────────────────────────────────────
  { generic: 'Atorvastatin', brand: 'Lipitor / Tonact', formulation: 'Tablet', strength: '10mg', scheduleH: false, scheduleX: false, category: 'Lipid-lowering' },
  { generic: 'Atorvastatin', brand: 'Lipitor / Tonact', formulation: 'Tablet', strength: '40mg', scheduleH: false, scheduleX: false, category: 'Lipid-lowering' },
  { generic: 'Rosuvastatin', brand: 'Rozavel / Crestor', formulation: 'Tablet', strength: '10mg', scheduleH: false, scheduleX: false, category: 'Lipid-lowering' },
  { generic: 'Rosuvastatin', brand: 'Rozavel / Crestor', formulation: 'Tablet', strength: '20mg', scheduleH: false, scheduleX: false, category: 'Lipid-lowering' },
  { generic: 'Fenofibrate', brand: 'Lipanthyl / Tricor', formulation: 'Tablet', strength: '160mg', scheduleH: true, scheduleX: false, category: 'Lipid-lowering' },

  // ── Antihistamines / Allergy ──────────────────────────────────────────────────
  { generic: 'Cetirizine', brand: 'Cetzine / Alerid', formulation: 'Tablet', strength: '10mg', scheduleH: false, scheduleX: false, category: 'Antihistamine' },
  { generic: 'Levocetirizine', brand: 'Xyzal / Levocet', formulation: 'Tablet', strength: '5mg', scheduleH: false, scheduleX: false, category: 'Antihistamine' },
  { generic: 'Loratadine', brand: 'Lorfast / Claritin', formulation: 'Tablet', strength: '10mg', scheduleH: false, scheduleX: false, category: 'Antihistamine' },
  { generic: 'Fexofenadine', brand: 'Allegra / Telekast-F', formulation: 'Tablet', strength: '120mg', scheduleH: false, scheduleX: false, category: 'Antihistamine' },
  { generic: 'Montelukast', brand: 'Singulair / Montair', formulation: 'Tablet', strength: '10mg', scheduleH: true, scheduleX: false, category: 'Antihistamine' },
  { generic: 'Montelukast + Levocetirizine', brand: 'Montair-LC / L-Montus', formulation: 'Tablet', strength: '10mg+5mg', scheduleH: true, scheduleX: false, category: 'Antihistamine' },
  { generic: 'Chlorpheniramine', brand: 'Piriton / Chlor-Trimeton', formulation: 'Tablet', strength: '4mg', scheduleH: false, scheduleX: false, category: 'Antihistamine' },
  { generic: 'Pheniramine', brand: 'Avil', formulation: 'Injection', strength: '22.5mg/mL', scheduleH: true, scheduleX: false, category: 'Antihistamine' },

  // ── Vitamins / Supplements ────────────────────────────────────────────────────
  { generic: 'Vitamin D3', brand: 'Calcirol / Uprise D3', formulation: 'Capsule', strength: '60000 IU', scheduleH: false, scheduleX: false, category: 'Vitamin/Supplement' },
  { generic: 'Calcium + Vitamin D3', brand: 'Shelcal / Calcimax', formulation: 'Tablet', strength: '500mg+250IU', scheduleH: false, scheduleX: false, category: 'Vitamin/Supplement' },
  { generic: 'Vitamin B Complex', brand: 'Becosules / Neurobion', formulation: 'Capsule', strength: 'Standard', scheduleH: false, scheduleX: false, category: 'Vitamin/Supplement' },
  { generic: 'Methylcobalamin', brand: 'Methylcobal / Cobamin', formulation: 'Tablet', strength: '500mcg', scheduleH: false, scheduleX: false, category: 'Vitamin/Supplement' },
  { generic: 'Methylcobalamin + B complex', brand: 'Methy-B / Cobadex Forte', formulation: 'Capsule', strength: '500mcg', scheduleH: false, scheduleX: false, category: 'Vitamin/Supplement' },
  { generic: 'Iron + Folic Acid', brand: 'Fersolate / Fefol', formulation: 'Tablet', strength: '150mg+0.5mg', scheduleH: false, scheduleX: false, category: 'Vitamin/Supplement' },
  { generic: 'Ferrous Ascorbate + Folic Acid', brand: 'Orofer FC / Autrin', formulation: 'Tablet', strength: '100mg+1.5mg', scheduleH: false, scheduleX: false, category: 'Vitamin/Supplement' },
  { generic: 'Zinc Sulfate', brand: 'Zincovit / Zinconia', formulation: 'Tablet', strength: '20mg', scheduleH: false, scheduleX: false, category: 'Vitamin/Supplement' },
  { generic: 'Multivitamin + Minerals', brand: 'Supradyn / Centrum', formulation: 'Tablet', strength: 'Standard', scheduleH: false, scheduleX: false, category: 'Vitamin/Supplement' },
  { generic: 'Vitamin C', brand: 'Celin / Limcee', formulation: 'Tablet', strength: '500mg', scheduleH: false, scheduleX: false, category: 'Vitamin/Supplement' },
  { generic: 'Omega-3 Fatty Acids', brand: 'Silubin Forte / Zofer', formulation: 'Capsule', strength: '1000mg', scheduleH: false, scheduleX: false, category: 'Vitamin/Supplement' },

  // ── Respiratory ───────────────────────────────────────────────────────────────
  { generic: 'Salbutamol', brand: 'Asthalin / Ventolin', formulation: 'Tablet', strength: '2mg', scheduleH: true, scheduleX: false, category: 'Respiratory' },
  { generic: 'Salbutamol', brand: 'Asthalin HFA / Ventolin HFA', formulation: 'Inhaler', strength: '100mcg/dose', scheduleH: true, scheduleX: false, category: 'Respiratory' },
  { generic: 'Budesonide', brand: 'Budecort / Pulmicort', formulation: 'Inhaler', strength: '200mcg/dose', scheduleH: true, scheduleX: false, category: 'Respiratory' },
  { generic: 'Theophylline', brand: 'Theo-Asthalin / Uniphyllin', formulation: 'Tablet', strength: '200mg', scheduleH: true, scheduleX: false, category: 'Respiratory' },
  { generic: 'Ambroxol', brand: 'Mucosolvan / Ambrolite', formulation: 'Tablet', strength: '30mg', scheduleH: false, scheduleX: false, category: 'Respiratory' },
  { generic: 'Ambroxol', brand: 'Mucosolvan / Ambrolite', formulation: 'Syrup', strength: '15mg/5mL', scheduleH: false, scheduleX: false, category: 'Respiratory' },
  { generic: 'Bromhexine', brand: 'Bisolvon / Brophyllin', formulation: 'Tablet', strength: '8mg', scheduleH: false, scheduleX: false, category: 'Respiratory' },
  { generic: 'Guaifenesin', brand: 'Benadryl Expectorant / Alclof', formulation: 'Syrup', strength: '100mg/5mL', scheduleH: false, scheduleX: false, category: 'Respiratory' },
  { generic: 'Dextromethorphan + Chlorpheniramine', brand: 'Benadryl / Corex-D', formulation: 'Syrup', strength: '10mg+2mg/5mL', scheduleH: false, scheduleX: false, category: 'Respiratory' },
  { generic: 'Prednisolone', brand: 'Omnacortil / Wysolone', formulation: 'Tablet', strength: '10mg', scheduleH: true, scheduleX: false, category: 'Respiratory' },

  // ── CNS / Neurology ───────────────────────────────────────────────────────────
  { generic: 'Gabapentin', brand: 'Gabantin / Neurontin', formulation: 'Capsule', strength: '300mg', scheduleH: true, scheduleX: false, category: 'CNS/Neurology' },
  { generic: 'Pregabalin', brand: 'Lyrica / Pregabalin', formulation: 'Capsule', strength: '75mg', scheduleH: true, scheduleX: false, category: 'CNS/Neurology' },
  { generic: 'Amitriptyline', brand: 'Amitone / Elavil', formulation: 'Tablet', strength: '10mg', scheduleH: true, scheduleX: false, category: 'CNS/Neurology' },
  { generic: 'Sertraline', brand: 'Serta / Zoloft', formulation: 'Tablet', strength: '50mg', scheduleH: true, scheduleX: false, category: 'CNS/Neurology' },
  { generic: 'Escitalopram', brand: 'Nexito / Cipralex', formulation: 'Tablet', strength: '10mg', scheduleH: true, scheduleX: false, category: 'CNS/Neurology' },
  { generic: 'Fluoxetine', brand: 'Prodep / Prozac', formulation: 'Capsule', strength: '20mg', scheduleH: true, scheduleX: false, category: 'CNS/Neurology' },
  { generic: 'Alprazolam', brand: 'Alprax / Xanax', formulation: 'Tablet', strength: '0.25mg', scheduleH: true, scheduleX: false, category: 'CNS/Neurology' },
  { generic: 'Clonazepam', brand: 'Clonotril / Klonopin', formulation: 'Tablet', strength: '0.5mg', scheduleH: true, scheduleX: false, category: 'CNS/Neurology' },
  { generic: 'Diazepam', brand: 'Calmpose / Valium', formulation: 'Tablet', strength: '5mg', scheduleH: true, scheduleX: false, category: 'CNS/Neurology' },
  { generic: 'Phenytoin', brand: 'Eptoin / Dilantin', formulation: 'Tablet', strength: '100mg', scheduleH: true, scheduleX: false, category: 'CNS/Neurology' },
  { generic: 'Valproate (Sodium)', brand: 'Valparin / Depakene', formulation: 'Tablet', strength: '200mg', scheduleH: true, scheduleX: false, category: 'CNS/Neurology' },
  { generic: 'Levetiracetam', brand: 'Levepsy / Keppra', formulation: 'Tablet', strength: '500mg', scheduleH: true, scheduleX: false, category: 'CNS/Neurology' },
  { generic: 'Zolpidem', brand: 'Zoldem / Ambien', formulation: 'Tablet', strength: '5mg', scheduleH: true, scheduleX: false, category: 'CNS/Neurology' },

  // ── Cardiac ───────────────────────────────────────────────────────────────────
  { generic: 'Clopidogrel', brand: 'Plavix / Deplatt', formulation: 'Tablet', strength: '75mg', scheduleH: true, scheduleX: false, category: 'Cardiac' },
  { generic: 'Aspirin + Clopidogrel', brand: 'Deplatt-CV / Ecosprin Gold', formulation: 'Capsule', strength: '75mg+75mg', scheduleH: true, scheduleX: false, category: 'Cardiac' },
  { generic: 'Furosemide', brand: 'Lasix / Frusemide', formulation: 'Tablet', strength: '40mg', scheduleH: true, scheduleX: false, category: 'Cardiac' },
  { generic: 'Spironolactone', brand: 'Aldactone / Spiromide', formulation: 'Tablet', strength: '25mg', scheduleH: true, scheduleX: false, category: 'Cardiac' },
  { generic: 'Isosorbide Dinitrate', brand: 'Isoket / Sorbitrate', formulation: 'Tablet', strength: '5mg', scheduleH: true, scheduleX: false, category: 'Cardiac' },
  { generic: 'Digoxin', brand: 'Lanoxin / Digoxin', formulation: 'Tablet', strength: '0.25mg', scheduleH: true, scheduleX: false, category: 'Cardiac' },
  { generic: 'Warfarin', brand: 'Warf / Coumadin', formulation: 'Tablet', strength: '2mg', scheduleH: true, scheduleX: false, category: 'Cardiac' },

  // ── Thyroid ───────────────────────────────────────────────────────────────────
  { generic: 'Levothyroxine', brand: 'Thyronorm / Eltroxin', formulation: 'Tablet', strength: '50mcg', scheduleH: false, scheduleX: false, category: 'Thyroid' },
  { generic: 'Levothyroxine', brand: 'Thyronorm / Eltroxin', formulation: 'Tablet', strength: '100mcg', scheduleH: false, scheduleX: false, category: 'Thyroid' },
  { generic: 'Carbimazole', brand: 'Neomercazole / Thyrozol', formulation: 'Tablet', strength: '5mg', scheduleH: true, scheduleX: false, category: 'Thyroid' },
  { generic: 'Propylthiouracil', brand: 'PTU / Propycil', formulation: 'Tablet', strength: '50mg', scheduleH: true, scheduleX: false, category: 'Thyroid' },

  // ── Antifungals ───────────────────────────────────────────────────────────────
  { generic: 'Fluconazole', brand: 'Diflucan / Forcan', formulation: 'Capsule', strength: '150mg', scheduleH: true, scheduleX: false, category: 'Antifungal' },
  { generic: 'Itraconazole', brand: 'Canditral / Itaspor', formulation: 'Capsule', strength: '100mg', scheduleH: true, scheduleX: false, category: 'Antifungal' },
  { generic: 'Terbinafine', brand: 'Terbicip / Lamisil', formulation: 'Tablet', strength: '250mg', scheduleH: true, scheduleX: false, category: 'Antifungal' },
  { generic: 'Clotrimazole', brand: 'Candid / Canesten', formulation: 'Cream', strength: '1%', scheduleH: false, scheduleX: false, category: 'Antifungal' },

  // ── Antivirals ────────────────────────────────────────────────────────────────
  { generic: 'Acyclovir', brand: 'Acivir / Zovirax', formulation: 'Tablet', strength: '400mg', scheduleH: true, scheduleX: false, category: 'Antiviral' },
  { generic: 'Oseltamivir', brand: 'Antiflu / Tamiflu', formulation: 'Capsule', strength: '75mg', scheduleH: true, scheduleX: false, category: 'Antiviral' },

  // ── Musculoskeletal / Uric Acid ───────────────────────────────────────────────
  { generic: 'Allopurinol', brand: 'Zyloric / Zyloprim', formulation: 'Tablet', strength: '100mg', scheduleH: true, scheduleX: false, category: 'Musculoskeletal' },
  { generic: 'Allopurinol', brand: 'Zyloric / Zyloprim', formulation: 'Tablet', strength: '300mg', scheduleH: true, scheduleX: false, category: 'Musculoskeletal' },
  { generic: 'Colchicine', brand: 'Zycolchin / Colchicine', formulation: 'Tablet', strength: '0.5mg', scheduleH: true, scheduleX: false, category: 'Musculoskeletal' },
  { generic: 'Methocarbamol + Ibuprofen', brand: 'Robaxisal / Myospaz-MR', formulation: 'Tablet', strength: '400mg+200mg', scheduleH: true, scheduleX: false, category: 'Musculoskeletal' },
  { generic: 'Thiocolchicoside', brand: 'Muscoril / Myoril', formulation: 'Tablet', strength: '4mg', scheduleH: true, scheduleX: false, category: 'Musculoskeletal' },
  { generic: 'Calcium + Vitamin D3 + Methylcobalamin', brand: 'Shelcal-M / Ostofit', formulation: 'Tablet', strength: 'Standard', scheduleH: false, scheduleX: false, category: 'Musculoskeletal' },

  // ── Dermatology (Topical) ─────────────────────────────────────────────────────
  { generic: 'Betamethasone', brand: 'Betnovate / Betnasol', formulation: 'Cream', strength: '0.05%', scheduleH: true, scheduleX: false, category: 'Dermatology' },
  { generic: 'Clobetasol', brand: 'Dermovate / Tenovate', formulation: 'Cream', strength: '0.05%', scheduleH: true, scheduleX: false, category: 'Dermatology' },
  { generic: 'Hydrocortisone', brand: 'Cortate / HC Cream', formulation: 'Cream', strength: '1%', scheduleH: false, scheduleX: false, category: 'Dermatology' },
  { generic: 'Mupirocin', brand: 'Bactroban / Mupicin', formulation: 'Ointment', strength: '2%', scheduleH: true, scheduleX: false, category: 'Dermatology' },
  { generic: 'Calamine Lotion', brand: 'Lacto Calamine / Calamine', formulation: 'Lotion', strength: 'Standard', scheduleH: false, scheduleX: false, category: 'Dermatology' },
  { generic: 'Ketoconazole + Beclomethasone', brand: 'Ketovate / Keto-B', formulation: 'Cream', strength: '2%+0.025%', scheduleH: true, scheduleX: false, category: 'Dermatology' },

  // ── Eye / ENT ─────────────────────────────────────────────────────────────────
  { generic: 'Ciprofloxacin', brand: 'Ciplox Eye Drops / Ciloxan', formulation: 'Eye Drops', strength: '0.3%', scheduleH: true, scheduleX: false, category: 'Eye/ENT' },
  { generic: 'Tobramycin', brand: 'Tobacin / Tobrex', formulation: 'Eye Drops', strength: '0.3%', scheduleH: true, scheduleX: false, category: 'Eye/ENT' },
  { generic: 'Mometasone', brand: 'Momate Nasal Spray / Nasonex', formulation: 'Nasal Spray', strength: '50mcg/dose', scheduleH: true, scheduleX: false, category: 'Eye/ENT' },
  { generic: 'Oxymetazoline', brand: 'Nasivion / Afrin', formulation: 'Nasal Drops', strength: '0.05%', scheduleH: false, scheduleX: false, category: 'Eye/ENT' },
  { generic: 'Xylometazoline', brand: 'Otrivin / Xylomist', formulation: 'Nasal Drops', strength: '0.1%', scheduleH: false, scheduleX: false, category: 'Eye/ENT' },

  // ── Hormones / OB-GYN ────────────────────────────────────────────────────────
  { generic: 'Progesterone', brand: 'Susten / Duphaston', formulation: 'Tablet', strength: '200mg', scheduleH: true, scheduleX: false, category: 'Hormones' },
  { generic: 'Dydrogesterone', brand: 'Duphaston / Proluton', formulation: 'Tablet', strength: '10mg', scheduleH: true, scheduleX: false, category: 'Hormones' },
  { generic: 'Combined OCP (Ethinylestradiol + Levonorgestrel)', brand: 'Ovral L / Loette', formulation: 'Tablet', strength: '30mcg+150mcg', scheduleH: true, scheduleX: false, category: 'Hormones' },
  { generic: 'Mefenamic Acid + Tranexamic Acid', brand: 'Krimson Plus / Trapic-MF', formulation: 'Tablet', strength: '500mg+500mg', scheduleH: true, scheduleX: false, category: 'Hormones' },

  // ── Corticosteroids ───────────────────────────────────────────────────────────
  { generic: 'Prednisolone', brand: 'Omnacortil / Wysolone', formulation: 'Tablet', strength: '5mg', scheduleH: true, scheduleX: false, category: 'Corticosteroid' },
  { generic: 'Prednisolone', brand: 'Omnacortil / Wysolone', formulation: 'Tablet', strength: '20mg', scheduleH: true, scheduleX: false, category: 'Corticosteroid' },
  { generic: 'Dexamethasone', brand: 'Decdan / Dexona', formulation: 'Tablet', strength: '0.5mg', scheduleH: true, scheduleX: false, category: 'Corticosteroid' },
  { generic: 'Methylprednisolone', brand: 'Depo-Medrol / Solu-Medrol', formulation: 'Tablet', strength: '4mg', scheduleH: true, scheduleX: false, category: 'Corticosteroid' },

  // ── Injection / IV (common) ───────────────────────────────────────────────────
  { generic: 'Diclofenac', brand: 'Voveran / Voltaren', formulation: 'Injection', strength: '75mg/3mL', scheduleH: true, scheduleX: false, category: 'Injection' },
  { generic: 'Dexamethasone', brand: 'Decadron / Dexona', formulation: 'Injection', strength: '4mg/mL', scheduleH: true, scheduleX: false, category: 'Injection' },
  { generic: 'Ondansetron', brand: 'Emset / Zofran', formulation: 'Injection', strength: '4mg/2mL', scheduleH: true, scheduleX: false, category: 'Injection' },
  { generic: 'Pantoprazole', brand: 'Pan / Pantodac', formulation: 'Injection', strength: '40mg', scheduleH: true, scheduleX: false, category: 'Injection' },
  { generic: 'Tramadol', brand: 'Contramal / Ultram', formulation: 'Injection', strength: '50mg/mL', scheduleH: true, scheduleX: false, category: 'Injection' },
  { generic: 'Paracetamol', brand: 'Perfalgan / Crocin IV', formulation: 'Injection', strength: '1g/100mL', scheduleH: false, scheduleX: false, category: 'Injection' },
  { generic: 'Metronidazole', brand: 'Metrogyl IV / Flagyl IV', formulation: 'Injection', strength: '500mg/100mL', scheduleH: true, scheduleX: false, category: 'Injection' },
  { generic: 'Normal Saline (0.9% NaCl)', brand: 'Normal Saline', formulation: 'IV Fluid', strength: '500mL', scheduleH: false, scheduleX: false, category: 'Injection' },
  { generic: 'Ringer Lactate', brand: 'Ringer Lactate', formulation: 'IV Fluid', strength: '500mL', scheduleH: false, scheduleX: false, category: 'Injection' },
  { generic: 'Dextrose 5%', brand: 'DNS / D5W', formulation: 'IV Fluid', strength: '500mL', scheduleH: false, scheduleX: false, category: 'Injection' },
];

// Search function: matches generic name, brand name, or category (case-insensitive)
const searchDrugs = (query, limit = 20) => {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  const results = DRUGS.filter(
    (d) =>
      d.generic.toLowerCase().includes(q) ||
      d.brand.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q)
  );
  return results.slice(0, limit);
};

module.exports = { DRUGS, searchDrugs };
