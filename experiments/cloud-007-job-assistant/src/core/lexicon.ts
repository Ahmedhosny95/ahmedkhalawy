// Bilingual concept lexicon (English / Arabic). Each concept is a capability the evidence can show.
// `cred` concepts denote possession of a credential and are ONLY satisfied by evidence of kind 'credential'.
export interface Concept {id: string; en: string; ar: string; re: RegExp; cred?: boolean}
const r = (s: string) => new RegExp(s, 'iu');
export const CONCEPTS: Concept[] = [
  {id: 'qms', en: 'Quality management systems', ar: 'أنظمة إدارة الجودة', re: r('\\bQMS\\b|quality management system|نظام إدارة الجودة|أنظمة إدارة الجودة')},
  {id: 'iso9001', en: 'ISO 9001', ar: 'ISO 9001', re: r('ISO\\s*9001|أيزو\\s*9001|ايزو\\s*9001')},
  {id: 'iso14001', en: 'ISO 14001', ar: 'ISO 14001', re: r('ISO\\s*14001')},
  {id: 'iso45001', en: 'ISO 45001', ar: 'ISO 45001', re: r('ISO\\s*45001')},
  {id: 'audit', en: 'Audits', ar: 'التدقيق', re: r('\\baudit(s|ing|or|ors)?\\b|تدقيق|مراجعة داخلية')},
  {id: 'inspection', en: 'Inspection', ar: 'الفحص', re: r('\\binspect(ion|ions|ing|or|ors)?\\b|\\bincoming\\b|in-process|final inspection|فحص|تفتيش')},
  {id: 'itp', en: 'Inspection & test plans', ar: 'خطط الفحص والاختبار', re: r('\\bITPs?\\b|inspection and test plan|خطط? الفحص والاختبار')},
  {id: 'spc', en: 'SPC', ar: 'ضبط العمليات إحصائياً', re: r('\\bSPC\\b|statistical process control|ضبط العمليات الإحصائي')},
  {id: 'msa', en: 'Measurement systems (MSA)', ar: 'تحليل أنظمة القياس', re: r('\\bMSA\\b|gage r&r|gauge r&r|measurement system|تحليل نظام القياس')},
  {id: 'calibration', en: 'Calibration', ar: 'المعايرة', re: r('calibrat|معايرة')},
  {id: '8d', en: '8D problem solving', ar: 'منهجية 8D', re: r('(?<![\\w.])8D(?![\\w])')},
  {id: 'capa', en: 'Corrective action', ar: 'الإجراءات التصحيحية', re: r('\\bCAPA\\b|corrective (and preventive )?action|إجراءات? تصحيحية')},
  {id: 'rca', en: 'Root-cause analysis', ar: 'تحليل السبب الجذري', re: r('root[- ]cause|\\bRCA\\b|5 ?whys?|fishbone|ishikawa|السبب الجذري')},
  {id: '5s', en: '5S', ar: '5S', re: r('(?<![\\w.])5S(?![\\w])')},
  {id: 'lean', en: 'Lean / continuous improvement', ar: 'التحسين المستمر', re: r('\\blean\\b|kaizen|continuous improvement|التحسين المستمر')},
  {id: 'six-sigma', en: 'Six Sigma methods', ar: 'منهجية سيجما', re: r('six sigma|\\bDMAIC\\b|سيجما')},
  {id: 'data', en: 'Data analysis & reporting', ar: 'تحليل البيانات والتقارير', re: r('data analy|dashboard|\\bKPIs?\\b|power ?bi|minitab|\\bexcel\\b|تحليل البيانات|لوحات? المؤشرات')},
  {id: 'erp', en: 'ERP / SAP', ar: 'أنظمة ERP', re: r('\\bSAP\\b|\\bERP\\b')},
  {id: 'cad', en: 'CAD & drawings', ar: 'الرسم الهندسي', re: r('solidworks|autocad|\\bCAD\\b|drawings?|blueprints?|GD&T|المخططات|الرسومات الهندسية')},
  {id: 'change-control', en: 'BOM & engineering change control', ar: 'التحكم في التغييرات الهندسية', re: r('\\bBOM\\b|engineering change|\\bECN\\b|\\bECR\\b|configuration control')},
  {id: 'supplier', en: 'Supplier quality', ar: 'جودة الموردين', re: r('supplier|vendor|\\bSQE\\b|موردين|المورد')},
  {id: 'leadership', en: 'Team leadership', ar: 'قيادة الفرق', re: r('lead(ing)? (a |the )?team|team lead|supervis|people management|manage (a )?team|قيادة (ال)?فريق|الإشراف')},
  {id: 'training', en: 'Training & coaching', ar: 'التدريب والتوجيه', re: r('\\btrain(ing)? (staff|inspectors|teams?|operators)|coach|mentor|تدريب (ال)?(فريق|الموظفين)')},
  {id: 'electrical', en: 'Electrical panels & LV assembly', ar: 'اللوحات الكهربائية', re: r('switchgear|\\bLV\\b|IEC\\s*61439|electrical (panel|assembl)|panel build|لوحات كهربائية')},
  {id: 'testing', en: 'Product testing', ar: 'اختبار المنتجات', re: r('\\btesting\\b|hipot|insulation test|functional test|اختبار')},
  {id: 'welding', en: 'Welding & fabrication', ar: 'اللحام', re: r('weld|fabricat|لحام')},
  {id: 'coating', en: 'Coating & painting', ar: 'الطلاء', re: r('coating|painting|powder coat|طلاء')},
  {id: 'construction', en: 'Construction projects', ar: 'مشاريع الإنشاءات', re: r('construction|infrastructure|civil works|site quality|إنشاءات|البنية التحتية')},
  {id: 'manufacturing', en: 'Manufacturing operations', ar: 'عمليات التصنيع', re: r('manufactur|production line|factory|assembly line|تصنيع|مصنع|خطوط الإنتاج')},
  {id: 'documentation', en: 'Document control & procedures', ar: 'ضبط الوثائق والإجراءات', re: r('document control|controlled document|procedures?|\\bSOPs?\\b|ضبط الوثائق|الإجراءات')},
  {id: 'complaints', en: 'Customer complaints & returns', ar: 'شكاوى العملاء', re: r('customer complaint|returns|\\bRMA\\b|شكاوى العملاء')},
  {id: 'lang-en', en: 'English', ar: 'اللغة الإنجليزية', re: r('\\benglish\\b|الإنجليزية|الانجليزية')},
  {id: 'lang-ar', en: 'Arabic', ar: 'اللغة العربية', re: r('\\barabic\\b|العربية')},
  {id: 'edu-engineering', en: 'Engineering degree', ar: 'شهادة هندسية', re: r('(degree|bachelor|b\\.?\\s?sc|b\\.?\\s?eng)[^.\\n]{0,40}engineering|engineering (degree|graduate)|بكالوريوس[^.\\n]{0,20}هندسة|هندسة (ميكانيكية|كهربائية|صناعية)')},
  // credentials: possession only via kind 'credential'
  {id: 'cert-lead-auditor', en: 'Registered/certified lead auditor', ar: 'مدقق رئيسي معتمد', cred: true, re: r('(certified|registered|accredited)\\s+(lead\\s+)?auditor|lead auditor (certificate|certification|registration)|مدقق رئيسي معتمد')},
  {id: 'cert-six-sigma', en: 'Six Sigma belt certification', ar: 'شهادة الحزام في سيجما', cred: true, re: r('(green|black) belt(\\s+(certified|certification|certificate))?|six sigma certif|certified six sigma|الحزام (الأخضر|الأسود)')},
  {id: 'cert-pmp', en: 'PMP certification', ar: 'شهادة PMP', cred: true, re: r('\\bPMP\\b')},
  {id: 'cert-nebosh', en: 'NEBOSH', ar: 'NEBOSH', cred: true, re: r('NEBOSH')},
  {id: 'cert-ndt', en: 'Welding/NDT inspector certification', ar: 'شهادة مفتش لحام/NDT', cred: true, re: r('CSWIP|ASNT|\\bNDT level|CWI\\b')},
  {id: 'cert-pe', en: 'Professional engineering registration', ar: 'عضوية/تسجيل هندسي', cred: true, re: r('professional engineer(ing)? (licen[cs]e|registration)|\\bSCE\\b|Saudi Council of Engineers|الهيئة السعودية للمهندسين')},
];
export const conceptById = new Map(CONCEPTS.map(c => [c.id, c]));
export function conceptsIn(text: string): string[] {
  const out: string[] = [];
  for (const c of CONCEPTS) if (c.re.test(text)) out.push(c.id);
  return out;
}
