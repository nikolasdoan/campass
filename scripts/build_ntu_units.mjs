#!/usr/bin/env node
// Regenerates data/schools/ntu-units.json: NTU's colleges and the departments / institutes / degree
// programs under them. Deals can be tagged with these (`units` in data/sources/*.json, validated by
// scripts/import_deals.py), src/units.ts serves them, and a student may declare one on their NTU card.
//
//   node scripts/build_ntu_units.mjs
//
// SOURCES, FETCHED and TABLE are copied verbatim from fishpond's ops/build-departments.mjs (commit
// 65e4382; same founder, reuse approved), so this runs without fishpond checked out. The judgement
// calls are documented there. In short: ids are NTU's own four-character course-system unit codes,
// and a department uses its undergraduate code (9020 資訊工程學系 also stands for its graduate
// institute); retired codes are left out; 5080 醫學工程學系 is filed under `eng` and H060 under
// `intl`; `deg` (b / m / d / md) is set only where the official name states the level.
// To update: edit TABLE (or recopy it from fishpond), rerun, and commit both files.

import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SOURCES = [
  'https://www.ntu.edu.tw/academics/academics.html',
  'https://www.ntu.edu.tw/academics/academics_list.html',
  'https://www.ntu.edu.tw/english/academics/academics.html',
  'https://nol.ntu.edu.tw/nol/coursesearch/search_for_02_dpt.php',
];
const FETCHED = '2026-09-26';

// [college id, zh, en, [[unit code, zh, en, deg?], …]]
const TABLE = [
  ['lib', '文學院', 'College of Liberal Arts', [
    ['1010', '中國文學系', 'Department of Chinese Literature'],
    ['1020', '外國語文學系', 'Department of Foreign Languages & Literatures'],
    ['1030', '歷史學系', 'Department of History'],
    ['1040', '哲學系', 'Department of Philosophy'],
    ['1050', '人類學系', 'Department of Anthropology'],
    ['1060', '圖書資訊學系', 'Department of Library & Information Science'],
    ['1070', '日本語文學系', 'Department of Japanese Language & Literature'],
    ['1090', '戲劇學系', 'Department of Drama & Theatre'],
    ['1410', '藝術史研究所', 'Graduate Institute of Art History'],
    ['1420', '語言學研究所', 'Graduate Institute of Linguistics'],
    ['1440', '音樂學研究所', 'Graduate Institute of Musicology'],
    ['1450', '臺灣文學研究所', 'Graduate Institute of Taiwan Literature'],
    ['1460', '華語教學碩士學位學程', 'Graduate Program of Teaching Chinese as a Second Language', 'm'],
    ['1470', '翻譯碩士學位學程', 'Graduate Program in Translation & Interpretation', 'm'],
  ]],
  ['sci', '理學院', 'College of Science', [
    ['2010', '數學系', 'Department of Mathematics'],
    ['2020', '物理學系', 'Department of Physics'],
    ['2030', '化學系', 'Department of Chemistry'],
    ['2040', '地質科學系', 'Department of Geosciences'],
    ['2070', '心理學系', 'Department of Psychology'],
    ['2080', '地理環境資源學系', 'Department of Geography'],
    ['2090', '大氣科學系', 'Department of Atmospheric Sciences'],
    ['2410', '海洋研究所', 'Institute of Oceanography'],
    ['2440', '天文物理研究所', 'Institute of Astrophysics'],
    ['2450', '應用物理研究所', 'Graduate Institute of Applied Physics'],
    ['2460', '應用數學科學研究所', 'Institute of Applied Mathematical Sciences'],
    ['2500', '統計與數據科學研究所', 'Institute of Statistics and Data Science'],
    ['2470', '氣候變遷與永續發展國際學位學程', 'International Master/Doctoral Degree Program in Climate Change and Sustainable Development', 'md'],
    ['2490', '地球系統科學國際研究生博士學位學程', 'Taiwan International Graduate Program in Earth System Science', 'd'],
  ]],
  ['soc', '社會科學院', 'College of Social Sciences', [
    ['3020', '政治學系', 'Department of Political Science'],
    ['3030', '經濟學系', 'Department of Economics'],
    ['3050', '社會學系', 'Department of Sociology'],
    ['3100', '社會工作學系', 'Department of Social Work'],
    ['3410', '國家發展研究所', 'Graduate Institute of National Development'],
    ['3420', '新聞研究所', 'Graduate Institute of Journalism'],
    ['3430', '公共事務研究所', 'Graduate Institute of Public Affairs'],
  ]],
  ['med', '醫學院', 'College of Medicine', [
    ['4010', '醫學系', 'School of Medicine'],
    ['4020', '牙醫學系', 'School of Dentistry'],
    ['4220', '臨床牙醫學研究所', 'Graduate Institute of Clinical Dentistry'],
    ['4500', '口腔生物科學研究所', 'Graduate Institute of Oral Biology'],
    ['4030', '藥學系', 'School of Pharmacy'],
    ['4510', '臨床藥學研究所', 'Graduate Institute of Clinical Pharmacy'],
    ['4130', '生技製藥學士學位學程', "Bachelor's Degree Program in Biotechnology and Pharmaceutical Sciences", 'b'],
    ['4600', '醫藥法規科學碩士學位學程', "Master's Program in Regulatory Science for Medicine", 'm'],
    ['4060', '護理學系', 'School of Nursing'],
    ['4120', '學士後護理學系', 'Second Degree Bachelor of Science in Nursing', 'b'],
    ['4040', '醫學檢驗暨生物技術學系', 'Department of Clinical Laboratory Sciences & Medical Biotechnology'],
    ['4080', '物理治療學系', 'School of Physical Therapy'],
    ['4090', '職能治療學系', 'School of Occupational Therapy'],
    ['4210', '臨床醫學研究所', 'Graduate Institute of Clinical Medicine'],
    ['4470', '毒理學研究所', 'Graduate Institute of Toxicology'],
    ['4480', '分子醫學研究所', 'Institute of Molecular Medicine'],
    ['4490', '免疫學研究所', 'Graduate Institute of Immunology'],
    ['4530', '腫瘤醫學研究所', 'Graduate Institute of Oncology'],
    ['4550', '基因體暨蛋白體醫學研究所', 'Graduate Institute of Medical Genomics & Proteomics'],
    ['4540', '腦與心智科學研究所', 'Graduate Institute of Brain & Mind Sciences'],
    ['4580', '醫療器材與醫學影像研究所', 'Institute of Medical Device and Imaging'],
    ['4460', '解剖學暨細胞生物學研究所', 'Graduate Institute of Anatomy & Cell Biology'],
    ['4420', '生物化學暨分子生物學研究所', 'Graduate Institute of Biochemistry & Molecular Biology'],
    ['4410', '生理學研究所', 'Graduate Institute of Physiology'],
    ['4450', '微生物學研究所', 'Graduate Institute of Microbiology'],
    ['4430', '藥理學研究所', 'Graduate Institute of Pharmacology'],
    ['4570', '醫學教育暨生醫倫理研究所', 'Graduate Institute of Medical Education & Bioethics'],
    ['4440', '病理學研究所', 'Graduate Institute of Pathology'],
    ['4520', '法醫學研究所', 'Graduate Institute of Forensic Medicine'],
    ['4560', '轉譯醫學博士學位學程', 'Ph.D. Program in Translational Medicine', 'd'],
    ['4590', '國際三校農業生技與健康醫療碩士學位學程', "GIP-TRIAD Master's Degree in Agro-Biomedical Science", 'm'],
  ]],
  ['eng', '工學院', 'College of Engineering', [
    ['5010', '土木工程學系', 'Department of Civil Engineering'],
    ['5020', '機械工程學系', 'Department of Mechanical Engineering'],
    ['5040', '化學工程學系', 'Department of Chemical Engineering'],
    ['5050', '工程科學及海洋工程學系', 'Department of Engineering Science & Ocean Engineering'],
    ['5070', '材料科學與工程學系', 'Department of Materials Science & Engineering'],
    ['5080', '醫學工程學系', 'Department of Biomedical Engineering'],
    ['5410', '環境工程學研究所', 'Graduate Institute of Environmental Engineering'],
    ['5430', '應用力學研究所', 'Institute of Applied Mechanics'],
    ['5440', '建築與城鄉研究所', 'Graduate Institute of Building & Planning'],
    ['5460', '工業工程學研究所', 'Institute of Industrial Engineering'],
    ['5490', '高分子科學與工程學研究所', 'Institute of Polymer Science & Engineering'],
    ['5500', '綠色永續材料與精密元件博士學位學程', 'Ph.D. Program of Green Materials and Precision Devices', 'd'],
    ['5510', '分子科學與技術國際研究生博士學位學程', 'International Graduate Program of Molecular Science and Technology', 'd'],
    ['5520', '永續化學科技國際研究生博士學位學程', 'Taiwan International Graduate Program for Sustainable Chemical Science and Technology', 'd'],
    ['5090', '智慧工程科技全英語學士學位學程', 'English-Taught Intelligent Engineering and Technology Undergraduate Program', 'b'],
  ]],
  ['bioagri', '生物資源暨農學院', 'College of Bio-Resources & Agriculture', [
    ['6090', '獸醫學系', 'School of Veterinary Medicine'],
    ['6430', '臨床動物醫學研究所', 'Institute of Veterinary Clinical Science'],
    ['6440', '分子暨比較病理生物學研究所', 'Graduate Institute of Molecular and Comparative Pathobiology'],
    ['6010', '農藝學系', 'Department of Agronomy'],
    ['6020', '生物環境系統工程學系', 'Department of Bioenvironmental Systems Engineering'],
    ['6030', '農業化學系', 'Department of Agricultural Chemistry'],
    ['6050', '森林環境暨資源學系', 'School of Forestry & Resource Conservation'],
    ['6060', '動物科學技術學系', 'Department of Animal Science & Technology'],
    ['6070', '農業經濟學系', 'Department of Agricultural Economics'],
    ['6080', '園藝暨景觀學系', 'Department of Horticulture & Landscape Architecture'],
    ['6100', '生物產業傳播暨發展學系', 'Department of Bio-industry Communication & Development'],
    ['6110', '生物機電工程學系', 'Department of Biomechatronics Engineering'],
    ['6120', '昆蟲學系', 'Department of Entomology'],
    ['6130', '植物病理與微生物學系', 'Department of Plant Pathology & Microbiology'],
    ['6410', '食品科技研究所', 'Institute of Food Science & Technology'],
    ['6420', '生物科技研究所', 'Institute of Biotechnology'],
    ['6450', '植物醫學碩士學位學程', 'Master Program for Plant Medicine', 'm'],
    ['6150', '生物科技與食品營養學士學位學程', 'Bachelor Program of Biotechnology and Food Nutrition', 'b'],
  ]],
  ['mgmt', '管理學院', 'College of Management', [
    ['7010', '工商管理學系', 'Department of Business Administration'],
    ['7020', '會計學系', 'Department of Accounting'],
    ['7030', '財務金融學系', 'Department of Finance'],
    ['7040', '國際企業學系', 'Department of International Business'],
    ['7050', '資訊管理學系', 'Department of Information Management'],
    ['7410', '商學研究所', 'Graduate Institute of Business Administration'],
    ['7400', '管理學院碩士在職專班(EMBA)', 'Executive MBA Program', 'm'],
    ['7490', '管理學院企業管理專班(Global MBA)', 'Global MBA', 'm'],
    ['7510', '創業創新管理碩士在職專班(EiMBA)', 'Entrepreneurship and Innovation MBA Program (EiMBA)', 'm'],
  ]],
  ['ph', '公共衛生學院', 'College of Public Health', [
    ['8010', '公共衛生學系', 'Department of Public Health'],
    ['8480', '健康政策與管理研究所', 'Institute of Health Policy & Management'],
    ['8520', '環境與職業健康科學研究所', 'Institute of Environmental and Occupational Health Sciences'],
    ['8490', '流行病學與預防醫學研究所', 'Institute of Epidemiology and Preventive Medicine'],
    ['8500', '健康行為與社區科學研究所', 'Institute of Health Behaviors and Community Sciences'],
    ['8510', '食品安全與健康研究所', 'Institute of Food Safety and Health'],
    ['8550', '健康數據拓析統計研究所', 'Institute of Health Data Analytics and Statistics'],
    ['8530', '全球衛生碩士/博士學位學程', 'Global Health Program (MSc & Ph.D.)', 'md'],
    ['8470', '公共衛生碩士學位學程', 'Master of Public Health (MPH)', 'm'],
  ]],
  ['eecs', '電機資訊學院', 'College of Electrical Engineering & Computer Science', [
    ['9010', '電機工程學系', 'Department of Electrical Engineering'],
    ['9020', '資訊工程學系', 'Department of Computer Science & Information Engineering'],
    ['9410', '光電工程學研究所', 'Graduate Institute of Photonics & Optoelectronics'],
    ['9420', '電信工程學研究所', 'Graduate Institute of Communication Engineering'],
    ['9430', '電子工程學研究所', 'Graduate Institute of Electronics Engineering'],
    ['9440', '資訊網路與多媒體研究所', 'Graduate Institute of Networking and Multimedia'],
    ['9450', '生醫電子與資訊學研究所', 'Graduate Institute of Biomedical Electronics and Bioinformatics'],
    ['9460', '資料科學學位學程', 'Data Science Degree Program', 'md'],
    ['9470', '生物資訊學國際研究生博士學位學程', 'Taiwan International Graduate Program on Bioinformatics', 'd'],
    ['9490', '智慧聯網國際研究生博士學位學程', 'Taiwan International Graduate Program on Artificial Intelligence of Things', 'd'],
  ]],
  ['law', '法律學院', 'College of Law', [
    ['A010', '法律學系', 'Department of Law'],
    ['A410', '科際整合法律學研究所', 'Graduate Institute of Interdisciplinary Legal Studies'],
  ]],
  ['life', '生命科學院', 'College of Life Science', [
    ['B010', '生命科學系', 'Department of Life Science'],
    ['B020', '生化科技學系', 'Department of Biochemical Science & Technology'],
    ['B420', '植物科學研究所', 'Institute of Plant Biology'],
    ['B430', '分子與細胞生物學研究所', 'Institute of Molecular & Cellular Biology'],
    ['B440', '生態學與演化生物學研究所', 'Institute of Ecology & Evolutionary Biology'],
    ['B450', '漁業科學研究所', 'Institute of Fisheries Science'],
    ['B460', '生化科學研究所', 'Institute of Biochemical Sciences'],
    ['B480', '基因體與系統生物學學位學程', 'Genome & Systems Biology Degree Program'],
    ['B490', '跨領域神經科學國際研究生博士學位學程', 'Taiwan International Graduate Program in Interdisciplinary Neuroscience', 'd'],
    ['B500', '植物生物科技產學研發博士學位學程', 'Ph.D. Program in Plant Biotechnology Development of Industry-Academia Cooperation', 'd'],
  ]],
  ['spe', '國際政經學院', 'School of Political Science and Economics', [
    ['C410', '政治經濟碩士學位學程', 'Master of Arts in Political Economy', 'm'],
    ['C420', '財金碩士學位學程', 'Master of Science in Finance', 'm'],
    ['C430', '領導與管理碩士學位學程', "Professional Master's Degree in Leadership and Management", 'm'],
  ]],
  ['intl', '國際學院', 'International College', [
    ['H430', '全球農業科技與基因體科學碩士學位學程', 'Master Program in Global Agriculture Technology and Genomic Science', 'm'],
    ['H440', '生物多樣性國際碩士學位學程', "Master's Program in Biodiversity", 'm'],
    ['H450', '智慧醫療與健康資訊碩士學位學程', "Master's Program in Smart Medicine and Health Informatics", 'm'],
    ['H460', '防災減害與韌性碩士學位學程', 'MS Program in Disaster Risk Reduction and Resilience', 'm'],
    ['H060', '國際半導體學士學位學程', 'Global Undergraduate Program in Semiconductors', 'b'],
  ]],
  ['dschool', '創新設計學院', 'College of Design and Innovation (D-School)', [
    ['Z010', '創新領域學士學位學程', 'Trans-disciplinary Bachelor Degree Program', 'b'],
  ]],
  ['gsat', '重點科技研究學院', 'Graduate School of Advanced Technology', [
    ['K410', '積體電路設計與自動化學位學程', 'Program for Integrated Circuit Design and Automation', 'md'],
    ['K430', '元件材料與異質整合學位學程', 'Program for Semiconductor Devices, Materials, and Hetero-integration', 'md'],
    ['K450', '奈米工程與科學學位學程', 'Program for Nanoengineering and Nanoscience', 'md'],
    ['K470', '精準健康學位學程', 'Program for Precision Health and Intelligent Medicine', 'md'],
  ]],
  ['cge', '共同教育中心', 'Center for General Education', [
    ['H410', '統計碩士學位學程', "Master's Program in Statistics", 'm'],
    ['H420', '運動設施與健康管理碩士學位學程', 'Master Program of Sport Facility Management and Health Promotion', 'm'],
    ['H040', '國際體育運動事務學士學位學程', 'Bachelor Program of International Sports Affairs', 'b'],
  ]],
  ['specs', '進修推廣學院', 'School of Professional Education and Continuing Studies', [
    ['E410', '事業經營碩士在職學位學程(PMBA)', "Professional Master's Program in Business Administration (PMBA)", 'm'],
    ['E420', '事業經營法務碩士在職學位學程(PMLBA)', "Professional Master's Program of Law in Business Administration (PMLBA)", 'm'],
    ['E430', '生物科技管理碩士在職學位學程(PMBM)', "Professional Master's Program of Biotechnology Management (PMBM)", 'm'],
  ]],
];

// The shape GET /api/schools/:code/units serves: colleges, each holding its departments.
const COLLEGE = TABLE.map(([code, zh, en, rows]) => ({
  code,
  zh,
  en,
  depts: rows.map(([code, zh, en, deg]) => (deg ? { code, zh, en, deg } : { code, zh, en })),
}));
const deptCount = COLLEGE.reduce((n, c) => n + c.depts.length, 0);

// A deal's `units` mixes college codes and department codes, so a code must be unique across both.
const codes = COLLEGE.flatMap((c) => [c.code, ...c.depts.map((d) => d.code)]);
const dup = codes.find((code, i) => codes.indexOf(code) !== i);
if (dup) throw new Error(`duplicate unit code ${dup}`);

// One department per line: small diffs when a unit is renamed, and still compact.
const college = (c) => `    {
      "code": ${JSON.stringify(c.code)}, "zh": ${JSON.stringify(c.zh)}, "en": ${JSON.stringify(c.en)},
      "depts": [
${c.depts.map((d) => '        ' + JSON.stringify(d)).join(',\n')}
      ]
    }`;

const json = `{
  "school": "NTU",
  "source": ${JSON.stringify(SOURCES)},
  "fetched": "${FETCHED}",
  "college": [
${COLLEGE.map(college).join(',\n')}
  ]
}
`;
JSON.parse(json); // hand-laid-out JSON: fail here, not in the importer

const dir = fileURLToPath(new URL('../data/schools/', import.meta.url));
mkdirSync(dir, { recursive: true });
writeFileSync(dir + 'ntu-units.json', json);
console.log(`${COLLEGE.length} colleges, ${deptCount} departments`);
