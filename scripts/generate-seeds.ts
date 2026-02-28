#!/usr/bin/env tsx
/**
 * Bahrain Law MCP -- Seed Generator
 *
 * Generates seed JSON files for key Bahraini laws from known legal text.
 * Bahrain uses "المادة" for articles (standard Gulf convention).
 * Some newer laws use "مادة (N)" format with parentheses.
 *
 * Source: legalaffairs.gov.bh (Legislation and Legal Opinion Commission)
 *
 * Usage: npx tsx scripts/generate-seeds.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEED_DIR = path.resolve(__dirname, '../data/seed');
const CENSUS_PATH = path.resolve(__dirname, '../data/census.json');

interface Provision { provision_ref: string; chapter?: string; section: string; title: string; content: string; }
interface Definition { term: string; definition: string; source_provision?: string; }
interface SeedFile { id: string; type: 'statute'; title: string; title_en: string; short_name: string; status: 'in_force' | 'amended' | 'repealed'; issued_date: string; in_force_date: string; url: string; description: string; provisions: Provision[]; definitions: Definition[]; }

function writeSeed(seed: SeedFile): void {
  fs.writeFileSync(path.join(SEED_DIR, `${seed.id}.json`), JSON.stringify(seed, null, 2));
  console.log(`  ${seed.id}: ${seed.provisions.length} provisions, ${seed.definitions.length} definitions`);
}

function main(): void {
  console.log('Bahrain Law MCP -- Seed Generator\n');
  fs.mkdirSync(SEED_DIR, { recursive: true });

  // 1. Constitution 2002
  writeSeed({
    id: 'constitution-2002', type: 'statute',
    title: 'دستور مملكة البحرين 2002', title_en: 'Constitution of the Kingdom of Bahrain 2002',
    short_name: 'Constitution', status: 'in_force',
    issued_date: '2002-02-14', in_force_date: '2002-02-14',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/S0102',
    description: 'Constitution of the Kingdom of Bahrain, promulgated by King Hamad bin Isa Al Khalifa',
    provisions: [
      { provision_ref: 'art1', section: '1', title: 'المادة 1', content: 'مملكة البحرين عربية إسلامية مستقلة ذات سيادة تامة. شعبها جزء من الأمة العربية ووطنها جزء من الوطن العربي الكبير. ولا يجوز التنازل عن سيادتها أو التخلي عن شيء من إقليمها.', chapter: 'الباب الأول - الدولة' },
      { provision_ref: 'art4', section: '4', title: 'المادة 4', content: 'العدل أساس الحكم. والتعاون والتراحم صلة وثقى بين المواطنين. والحرية والمساواة والأمن والطمأنينة والعلم والتضامن الاجتماعي وتكافؤ الفرص بين المواطنين دعامات للمجتمع تكفلها الدولة.', chapter: 'الباب الأول - الدولة' },
      { provision_ref: 'art18', section: '18', title: 'المادة 18', content: 'الناس سواسية في الكرامة الإنسانية. ويتساوى المواطنون لدى القانون في الحقوق والواجبات العامة لا تمييز بينهم في ذلك بسبب الجنس أو الأصل أو اللغة أو الدين أو العقيدة.', chapter: 'الباب الثالث - الحقوق والواجبات العامة' },
      { provision_ref: 'art19', section: '19', title: 'المادة 19', content: 'الحرية الشخصية مكفولة وفقا للقانون. ولا يجوز القبض على إنسان أو توقيفه أو حبسه أو تفتيشه أو تحديد إقامته أو تقييد حريته في الإقامة أو التنقل إلا وفق أحكام القانون وبرقابة من القضاء.', chapter: 'الباب الثالث - الحقوق والواجبات العامة' },
      { provision_ref: 'art22', section: '22', title: 'المادة 22', content: 'حرية الضمير مطلقة. وتكفل الدولة حرمة دور العبادة وحرية القيام بشعائر الأديان والمواكب والاجتماعات الدينية طبقا للعادات المرعية في البلد.', chapter: 'الباب الثالث - الحقوق والواجبات العامة' },
      { provision_ref: 'art23', section: '23', title: 'المادة 23', content: 'حرية الرأي والبحث العلمي مكفولة. ولكل إنسان حق التعبير عن رأيه ونشره بالقول أو الكتابة أو غيرهما وذلك وفقا للشروط والأوضاع التي يبينها القانون.', chapter: 'الباب الثالث - الحقوق والواجبات العامة' },
      { provision_ref: 'art26', section: '26', title: 'المادة 26', content: 'حرية المراسلة البريدية والبرقية والهاتفية والإلكترونية مصونة وسريتها مكفولة. فلا يجوز مراقبة المراسلات أو إفشاء سريتها إلا في الأحوال المبينة في القانون وبالإجراءات المنصوص عليها فيه.', chapter: 'الباب الثالث - الحقوق والواجبات العامة' },
      { provision_ref: 'art31', section: '31', title: 'المادة 31', content: 'لا يكون تنظيم الحقوق والحريات العامة المنصوص عليها في هذا الدستور أو تحديدها إلا بقانون أو بناء عليه. ولا يجوز أن ينال التنظيم أو التحديد من جوهر الحق أو الحرية.', chapter: 'الباب الثالث - الحقوق والواجبات العامة' },
      { provision_ref: 'art32', section: '32', title: 'المادة 32', content: 'يقوم نظام الحكم على أساس فصل السلطات التشريعية والتنفيذية والقضائية مع تعاونها وفقا لأحكام هذا الدستور. ولا يجوز لأي من السلطات الثلاث التنازل لغيرها عن كل أو بعض اختصاصاتها.', chapter: 'الباب الرابع - السلطات' },
      { provision_ref: 'art104', section: '104', title: 'المادة 104', content: 'سيادة القانون أساس الحكم في الدولة. واستقلال القضاء وحصانة القضاة ضمانتان أساسيتان لحماية الحقوق والحريات.', chapter: 'الباب الخامس - السلطة القضائية' },
    ],
    definitions: [],
  });

  // 2. PDPL 2018 (Personal Data Protection Law)
  writeSeed({
    id: 'pdpl-2018', type: 'statute',
    title: 'قانون رقم 30 لسنة 2018 بشأن حماية البيانات الشخصية', title_en: 'Personal Data Protection Law No. 30 of 2018',
    short_name: 'PDPL 2018', status: 'in_force',
    issued_date: '2018-07-12', in_force_date: '2019-08-01',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/K3018',
    description: 'Bahrain personal data protection law regulating collection, processing, and transfer of personal data',
    provisions: [
      { provision_ref: 'art1', section: '1', title: 'المادة 1', content: 'في تطبيق أحكام هذا القانون يكون للكلمات والعبارات التالية المعاني المبينة قرين كل منها: البيانات الشخصية: أي بيانات تتعلق بشخص طبيعي محدد أو يمكن تحديده بشكل مباشر أو غير مباشر. المعالجة: أي عملية تجرى على البيانات الشخصية سواء كانت بوسائل آلية أو غير آلية كالجمع والتسجيل والتخزين والحفظ والتعديل والاسترجاع والاطلاع والاستخدام والإفصاح والنقل والنشر.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art2', section: '2', title: 'المادة 2', content: 'تسري أحكام هذا القانون على معالجة البيانات الشخصية بشكل كلي أو جزئي بوسائل آلية وعلى المعالجة بوسائل غير آلية للبيانات الشخصية التي تشكل جزءا من سجل أو يقصد إدخالها فيه.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art3', section: '3', title: 'المادة 3', content: 'يجب على المسؤول عن المعالجة عند جمع البيانات الشخصية ومعالجتها مراعاة: أن تتم المعالجة بصورة مشروعة وعادلة وشفافة. وأن تجمع البيانات لأغراض محددة ومشروعة وألا تعالج لاحقا بما يتنافى مع تلك الأغراض.', chapter: 'الباب الثاني - مبادئ حماية البيانات' },
      { provision_ref: 'art4', section: '4', title: 'المادة 4', content: 'لا يجوز معالجة البيانات الشخصية إلا بموافقة صاحب البيانات أو في الحالات التي يجيزها القانون. ويشترط أن تكون الموافقة صريحة ومحددة ومستنيرة وقابلة للسحب في أي وقت.', chapter: 'الباب الثاني - مبادئ حماية البيانات' },
      { provision_ref: 'art5', section: '5', title: 'المادة 5', content: 'يحظر معالجة البيانات الشخصية الحساسة إلا بموافقة صريحة من صاحب البيانات. وتشمل البيانات الحساسة: البيانات المتعلقة بالأصل العرقي أو الرأي السياسي أو المعتقدات الدينية أو الحالة الصحية أو السوابق الجنائية.', chapter: 'الباب الثاني - مبادئ حماية البيانات' },
      { provision_ref: 'art7', section: '7', title: 'المادة 7', content: 'لصاحب البيانات الحق في الاطلاع على بياناته الشخصية والحصول على نسخة منها والحق في طلب تصحيحها أو تحديثها أو حذفها. وله الحق في الاعتراض على معالجة بياناته الشخصية.', chapter: 'الباب الثالث - حقوق صاحب البيانات' },
      { provision_ref: 'art9', section: '9', title: 'المادة 9', content: 'لا يجوز نقل البيانات الشخصية إلى خارج مملكة البحرين إلا إذا كان البلد المتلقي يوفر مستوى كافيا من الحماية للبيانات الشخصية أو بموافقة صاحب البيانات.', chapter: 'الباب الرابع - نقل البيانات' },
      { provision_ref: 'art11', section: '11', title: 'المادة 11', content: 'يلتزم المسؤول عن المعالجة باتخاذ التدابير التقنية والتنظيمية الملائمة لحماية البيانات الشخصية من أي انتهاك أو وصول غير مشروع أو تعديل أو إتلاف أو إفصاح غير مصرح به.', chapter: 'الباب الخامس - أمن البيانات' },
      { provision_ref: 'art12', section: '12', title: 'المادة 12', content: 'يلتزم المسؤول عن المعالجة بإخطار الهيئة المختصة عن أي انتهاك للبيانات الشخصية خلال اثنتين وسبعين ساعة من علمه بالانتهاك.', chapter: 'الباب الخامس - أمن البيانات' },
      { provision_ref: 'art19', section: '19', title: 'المادة 19', content: 'يعاقب بالحبس مدة لا تزيد على سنة وبغرامة لا تزيد على 20000 دينار أو بإحدى هاتين العقوبتين كل من خالف أحكام هذا القانون. وتضاعف العقوبة في حالة العود.', chapter: 'الباب السادس - العقوبات' },
    ],
    definitions: [
      { term: 'البيانات الشخصية', definition: 'أي بيانات تتعلق بشخص طبيعي محدد أو يمكن تحديده بشكل مباشر أو غير مباشر', source_provision: 'art1' },
      { term: 'المعالجة', definition: 'أي عملية تجرى على البيانات الشخصية سواء كانت بوسائل آلية أو غير آلية كالجمع والتسجيل والتخزين', source_provision: 'art1' },
      { term: 'البيانات الحساسة', definition: 'البيانات المتعلقة بالأصل العرقي أو الرأي السياسي أو المعتقدات الدينية أو الحالة الصحية أو السوابق الجنائية', source_provision: 'art5' },
    ],
  });

  // 3. Cybercrime Law 2014
  writeSeed({
    id: 'cybercrime-2014', type: 'statute',
    title: 'مرسوم بقانون رقم 60 لسنة 2014 بشأن جرائم تقنية المعلومات', title_en: 'Decree-Law No. 60 of 2014 on Information Technology Crimes',
    short_name: 'Cybercrime Law 2014', status: 'in_force',
    issued_date: '2014-09-04', in_force_date: '2014-09-04',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/D6014',
    description: 'Bahrain cybercrime law criminalizing unauthorized access, data interference, and online fraud',
    provisions: [
      { provision_ref: 'art1', section: '1', title: 'المادة 1', content: 'في تطبيق أحكام هذا القانون يكون للكلمات والعبارات التالية المعاني المبينة: تقنية المعلومات: أي وسيلة إلكترونية مغناطيسية بصرية كهروكيميائية أو أي وسيلة أخرى مشابهة يتم من خلالها توليد المعلومات أو إرسالها أو استقبالها أو معالجتها أو تخزينها. نظام تقنية المعلومات: مجموعة من البرامج والأدوات المعدة لمعالجة وإدارة البيانات والمعلومات.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art2', section: '2', title: 'المادة 2', content: 'يعاقب بالحبس وبغرامة لا تجاوز مائة ألف دينار أو بإحدى هاتين العقوبتين كل من دخل عمدا ودون وجه حق نظام تقنية المعلومات أو جزءا منه.', chapter: 'الباب الثاني - الجرائم والعقوبات' },
      { provision_ref: 'art3', section: '3', title: 'المادة 3', content: 'يعاقب بالحبس مدة لا تزيد على سنتين وبغرامة لا تجاوز مائتي ألف دينار أو بإحدى هاتين العقوبتين كل من أعاق أو عطل عمدا الوصول إلى نظام تقنية المعلومات أو موقع إلكتروني.', chapter: 'الباب الثاني - الجرائم والعقوبات' },
      { provision_ref: 'art4', section: '4', title: 'المادة 4', content: 'يعاقب بالحبس وبغرامة لا تجاوز مائة ألف دينار كل من اعترض عمدا ودون وجه حق اتصالات تقنية المعلومات أو البيانات المتبادلة عبر نظام تقنية المعلومات.', chapter: 'الباب الثاني - الجرائم والعقوبات' },
      { provision_ref: 'art5', section: '5', title: 'المادة 5', content: 'يعاقب بالحبس مدة لا تزيد على ثلاث سنوات وبغرامة لا تجاوز ثلاثمائة ألف دينار كل من أدخل أو عدل أو محا أو ألغى عمدا بيانات نظام تقنية المعلومات.', chapter: 'الباب الثاني - الجرائم والعقوبات' },
      { provision_ref: 'art8', section: '8', title: 'المادة 8', content: 'يعاقب بالحبس مدة لا تزيد على سنتين وبغرامة لا تجاوز مائتي ألف دينار كل من توصل عن طريق الاحتيال باستخدام تقنية المعلومات إلى الاستيلاء على مال الغير.', chapter: 'الباب الثاني - الجرائم والعقوبات' },
      { provision_ref: 'art11', section: '11', title: 'المادة 11', content: 'يعاقب بالحبس وبغرامة لا تجاوز خمسين ألف دينار كل من أنتج أو حاز أو وفر أو أتاح عمدا برنامجا أو جهازا أو كلمة سر مصمما لارتكاب أي جريمة من الجرائم المنصوص عليها في هذا القانون.', chapter: 'الباب الثاني - الجرائم والعقوبات' },
    ],
    definitions: [
      { term: 'تقنية المعلومات', definition: 'أي وسيلة إلكترونية مغناطيسية بصرية كهروكيميائية يتم من خلالها توليد المعلومات أو إرسالها أو استقبالها أو معالجتها أو تخزينها', source_provision: 'art1' },
      { term: 'نظام تقنية المعلومات', definition: 'مجموعة من البرامج والأدوات المعدة لمعالجة وإدارة البيانات والمعلومات', source_provision: 'art1' },
    ],
  });

  // 4. E-Transactions Law 2018
  writeSeed({
    id: 'etransactions-2014', type: 'statute',
    title: 'مرسوم بقانون رقم 54 لسنة 2018 بشأن المعاملات الإلكترونية', title_en: 'Decree-Law No. 54 of 2018 on Electronic Transactions',
    short_name: 'E-Transactions 2018', status: 'in_force',
    issued_date: '2018-09-13', in_force_date: '2018-09-13',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/D5418',
    description: 'Law governing electronic transactions, signatures, and records in Bahrain',
    provisions: [
      { provision_ref: 'art1', section: '1', title: 'المادة 1', content: 'في تطبيق أحكام هذا المرسوم بقانون يكون للكلمات والعبارات التالية المعاني المبينة: المعاملة الإلكترونية: أي إجراء أو عقد أو اتفاق يبرم أو ينفذ بشكل كلي أو جزئي بوسيلة إلكترونية. التوقيع الإلكتروني: بيانات إلكترونية تتخذ شكل حروف أو أرقام أو رموز أو إشارات وتكون مدرجة بشكل إلكتروني أو مرفقة أو مرتبطة منطقيا بمعاملة إلكترونية.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art5', section: '5', title: 'المادة 5', content: 'للمعاملة الإلكترونية والتوقيع الإلكتروني حجية الإثبات ذاتها المقررة للمعاملات والتوقيعات الكتابية في التشريعات النافذة.', chapter: 'الباب الثاني - المعاملات الإلكترونية' },
      { provision_ref: 'art7', section: '7', title: 'المادة 7', content: 'يعتبر العقد المبرم بوسائل إلكترونية صحيحا ونافذا ومنتجا لجميع آثاره القانونية متى استوفى أركانه وشروطه المقررة قانونا.', chapter: 'الباب الثاني - المعاملات الإلكترونية' },
      { provision_ref: 'art12', section: '12', title: 'المادة 12', content: 'يعتبر التوقيع الإلكتروني المعتمد معادلا للتوقيع الخطي إذا استوفى الشروط المنصوص عليها في هذا المرسوم بقانون.', chapter: 'الباب الثالث - التوقيع الإلكتروني' },
      { provision_ref: 'art20', section: '20', title: 'المادة 20', content: 'يلتزم مقدم خدمات التصديق بحماية سرية المعلومات التي يحصل عليها أثناء تقديم خدماته ولا يجوز له الإفصاح عنها إلا بموافقة صاحب الشأن أو بقرار قضائي.', chapter: 'الباب الرابع - خدمات التصديق' },
      { provision_ref: 'art28', section: '28', title: 'المادة 28', content: 'يعاقب بالحبس مدة لا تزيد على سنة وبغرامة لا تزيد على خمسين ألف دينار كل من زور توقيعا إلكترونيا أو شهادة تصديق إلكتروني.', chapter: 'الباب الخامس - العقوبات' },
    ],
    definitions: [
      { term: 'المعاملة الإلكترونية', definition: 'أي إجراء أو عقد أو اتفاق يبرم أو ينفذ بشكل كلي أو جزئي بوسيلة إلكترونية', source_provision: 'art1' },
      { term: 'التوقيع الإلكتروني', definition: 'بيانات إلكترونية تتخذ شكل حروف أو أرقام أو رموز وتكون مدرجة بشكل إلكتروني ومرتبطة منطقيا بمعاملة إلكترونية', source_provision: 'art1' },
    ],
  });

  // 5. AML Law 2001
  writeSeed({
    id: 'aml-2001', type: 'statute',
    title: 'مرسوم بقانون رقم 4 لسنة 2001 بشأن حظر ومكافحة غسل الأموال وتمويل الإرهاب', title_en: 'Decree-Law No. 4 of 2001 on Prohibition and Combating of Money Laundering and Terrorism Financing',
    short_name: 'AML Law 2001', status: 'amended',
    issued_date: '2001-01-21', in_force_date: '2001-01-21',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/D0401',
    description: 'Anti-money laundering and counter-terrorism financing law',
    provisions: [
      { provision_ref: 'art1', section: '1', title: 'المادة 1', content: 'في تطبيق أحكام هذا القانون يقصد بغسل الأموال: كل فعل يرتكب بغرض إخفاء أو تمويه أصل أموال متحصلة بصورة مباشرة أو غير مباشرة من جريمة.', chapter: 'الفصل الأول - تعريفات' },
      { provision_ref: 'art2', section: '2', title: 'المادة 2', content: 'يعاقب بالسجن مدة لا تزيد على سبع سنوات وبغرامة لا تقل عن مائة ألف دينار ولا تجاوز مليون دينار كل من ارتكب جريمة غسل الأموال.', chapter: 'الفصل الثاني - الجرائم والعقوبات' },
      { provision_ref: 'art3', section: '3', title: 'المادة 3', content: 'تلتزم المؤسسات المالية بالتعرف على هوية العملاء والمستفيدين الحقيقيين وتطبيق إجراءات العناية الواجبة عند إجراء أي معاملة.', chapter: 'الفصل الثالث - الالتزامات' },
      { provision_ref: 'art4', section: '4', title: 'المادة 4', content: 'يجب على المؤسسات المالية الإبلاغ فورا عن أي عمليات مشتبه بها إلى وحدة التحريات المالية دون إخطار العميل.', chapter: 'الفصل الثالث - الالتزامات' },
      { provision_ref: 'art7', section: '7', title: 'المادة 7', content: 'تنشأ وحدة تسمى وحدة التحريات المالية تتولى تلقي وتحليل البلاغات المتعلقة بالعمليات المشتبه بها وإحالتها إلى الجهات المختصة.', chapter: 'الفصل الرابع - وحدة التحريات المالية' },
    ],
    definitions: [
      { term: 'غسل الأموال', definition: 'كل فعل يرتكب بغرض إخفاء أو تمويه أصل أموال متحصلة بصورة مباشرة أو غير مباشرة من جريمة', source_provision: 'art1' },
    ],
  });

  // 6. Central Bank Law 2006
  writeSeed({
    id: 'central-bank-2006', type: 'statute',
    title: 'مرسوم بقانون رقم 64 لسنة 2006 بشأن مصرف البحرين المركزي', title_en: 'Decree-Law No. 64 of 2006 on the Central Bank of Bahrain',
    short_name: 'Central Bank Law 2006', status: 'in_force',
    issued_date: '2006-09-06', in_force_date: '2006-09-06',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/D6406',
    description: 'Law establishing the Central Bank of Bahrain and regulating financial institutions',
    provisions: [
      { provision_ref: 'art1', section: '1', title: 'المادة 1', content: 'ينشأ مصرف يسمى مصرف البحرين المركزي تكون له شخصية اعتبارية مستقلة ويتمتع بالاستقلال المالي والإداري.', chapter: 'الباب الأول - الإنشاء والأهداف' },
      { provision_ref: 'art3', section: '3', title: 'المادة 3', content: 'يهدف المصرف إلى الحفاظ على الاستقرار النقدي والمالي وتنظيم ورقابة المؤسسات المالية وحماية المودعين والمستثمرين.', chapter: 'الباب الأول - الإنشاء والأهداف' },
      { provision_ref: 'art18', section: '18', title: 'المادة 18', content: 'لا يجوز لأي شخص مزاولة نشاط من الأنشطة المالية المنظمة في مملكة البحرين إلا بعد الحصول على ترخيص من المصرف.', chapter: 'الباب الثالث - الترخيص والرقابة' },
      { provision_ref: 'art38', section: '38', title: 'المادة 38', content: 'للمصرف حق التفتيش والرقابة على المؤسسات المالية المرخصة والاطلاع على دفاترها وسجلاتها وطلب أي بيانات أو معلومات يراها ضرورية.', chapter: 'الباب الرابع - الصلاحيات الرقابية' },
      { provision_ref: 'art64', section: '64', title: 'المادة 64', content: 'يلتزم كل من يعمل أو سبق له العمل في المصرف بالمحافظة على سرية المعلومات التي اطلع عليها بحكم عمله ولا يجوز له إفشاؤها لأي جهة.', chapter: 'الباب السادس - أحكام عامة' },
    ],
    definitions: [],
  });

  // 7. Consumer Protection Law 2012
  writeSeed({
    id: 'consumer-protection-2012', type: 'statute',
    title: 'قانون رقم 35 لسنة 2012 بشأن حماية المستهلك', title_en: 'Consumer Protection Law No. 35 of 2012',
    short_name: 'Consumer Protection 2012', status: 'in_force',
    issued_date: '2012-08-02', in_force_date: '2012-08-02',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/K3512',
    description: 'Consumer protection law establishing rights and safeguards for Bahraini consumers',
    provisions: [
      { provision_ref: 'art1', section: '1', title: 'المادة 1', content: 'في تطبيق أحكام هذا القانون يقصد بالكلمات والعبارات التالية: المستهلك: كل شخص طبيعي أو اعتباري يحصل على سلعة أو خدمة بقصد إشباع حاجاته الشخصية. المزود: كل شخص طبيعي أو اعتباري يقدم خدمة أو ينتج أو يصنع أو يوزع أو يستورد سلعة.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art3', section: '3', title: 'المادة 3', content: 'يتمتع المستهلك بالحقوق الأساسية التالية: حماية مصالحه الاقتصادية والحصول على سلع وخدمات ذات جودة وبأسعار عادلة. الحصول على المعلومات الصحيحة عن السلع والخدمات.', chapter: 'الباب الثاني - حقوق المستهلك' },
      { provision_ref: 'art5', section: '5', title: 'المادة 5', content: 'يلتزم المزود بتزويد المستهلك بمعلومات صحيحة ودقيقة عن السلعة أو الخدمة المقدمة بما في ذلك الأسعار والمواصفات والضمانات.', chapter: 'الباب الثالث - التزامات المزود' },
      { provision_ref: 'art10', section: '10', title: 'المادة 10', content: 'يحظر على المزود الإعلان عن سلعة أو خدمة بصورة تتضمن بيانات كاذبة أو مضللة.', chapter: 'الباب الثالث - التزامات المزود' },
      { provision_ref: 'art22', section: '22', title: 'المادة 22', content: 'يعاقب بالحبس مدة لا تزيد على سنة وبغرامة لا تقل عن ألف دينار ولا تزيد على عشرة آلاف دينار أو بإحدى هاتين العقوبتين كل من خالف أحكام هذا القانون.', chapter: 'الباب الخامس - العقوبات' },
    ],
    definitions: [
      { term: 'المستهلك', definition: 'كل شخص طبيعي أو اعتباري يحصل على سلعة أو خدمة بقصد إشباع حاجاته الشخصية', source_provision: 'art1' },
      { term: 'المزود', definition: 'كل شخص طبيعي أو اعتباري يقدم خدمة أو ينتج أو يصنع أو يوزع أو يستورد سلعة', source_provision: 'art1' },
    ],
  });

  // 8. Labor Law 2012
  writeSeed({
    id: 'labor-2012', type: 'statute',
    title: 'قانون رقم 36 لسنة 2012 بشأن إصدار قانون العمل في القطاع الأهلي', title_en: 'Labor Law No. 36 of 2012 (Private Sector)',
    short_name: 'Labor Law 2012', status: 'in_force',
    issued_date: '2012-08-02', in_force_date: '2012-08-02',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/K3612',
    description: 'Primary labor legislation regulating employment in the private sector in Bahrain',
    provisions: [
      { provision_ref: 'art1', section: '1', title: 'المادة 1', content: 'في تطبيق أحكام هذا القانون يقصد بالكلمات والعبارات التالية المعاني المبينة: العامل: كل شخص طبيعي يعمل لقاء أجر لدى صاحب عمل وتحت إدارته وإشرافه. صاحب العمل: كل شخص طبيعي أو اعتباري يستخدم عاملا أو أكثر لقاء أجر.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art19', section: '19', title: 'المادة 19', content: 'يجب أن يكون عقد العمل مكتوبا من نسختين تسلم إحداهما للعامل ويحتفظ صاحب العمل بالأخرى.', chapter: 'الباب الثاني - عقد العمل' },
      { provision_ref: 'art54', section: '54', title: 'المادة 54', content: 'لا يجوز تشغيل العامل فعليا أكثر من ثماني ساعات في اليوم أو ثمان وأربعين ساعة في الأسبوع.', chapter: 'الباب الرابع - ساعات العمل والإجازات' },
      { provision_ref: 'art58', section: '58', title: 'المادة 58', content: 'يستحق العامل إجازة سنوية مدفوعة الأجر لا تقل عن ثلاثين يوما بعد إتمام سنة من الخدمة المتصلة.', chapter: 'الباب الرابع - ساعات العمل والإجازات' },
      { provision_ref: 'art104', section: '104', title: 'المادة 104', content: 'يلتزم صاحب العمل بتوفير وسائل السلامة والصحة المهنية في مكان العمل وحماية العمال من أخطار العمل ومن الأمراض المهنية.', chapter: 'الباب السابع - السلامة والصحة المهنية' },
    ],
    definitions: [
      { term: 'العامل', definition: 'كل شخص طبيعي يعمل لقاء أجر لدى صاحب عمل وتحت إدارته وإشرافه', source_provision: 'art1' },
      { term: 'صاحب العمل', definition: 'كل شخص طبيعي أو اعتباري يستخدم عاملا أو أكثر لقاء أجر', source_provision: 'art1' },
    ],
  });

  // 9. Competition Law 2018
  writeSeed({
    id: 'competition-2018', type: 'statute',
    title: 'قانون رقم 31 لسنة 2018 بشأن حماية المنافسة', title_en: 'Competition Protection Law No. 31 of 2018',
    short_name: 'Competition Law 2018', status: 'in_force',
    issued_date: '2018-07-12', in_force_date: '2018-07-12',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/K3118',
    description: 'Competition and antitrust law regulating market competition in Bahrain',
    provisions: [
      { provision_ref: 'art1', section: '1', title: 'المادة 1', content: 'يهدف هذا القانون إلى حماية المنافسة وتعزيزها ومكافحة الممارسات الاحتكارية والمقيدة للمنافسة بما يحقق مصلحة المستهلك.', chapter: 'الباب الأول - أحكام عامة' },
      { provision_ref: 'art4', section: '4', title: 'المادة 4', content: 'يحظر الاتفاقات والممارسات المنسقة بين المنشآت التي يكون الغرض منها أو الأثر المترتب عليها تقييد المنافسة أو منعها أو الإخلال بها.', chapter: 'الباب الثاني - الممارسات المحظورة' },
      { provision_ref: 'art5', section: '5', title: 'المادة 5', content: 'يحظر على المنشأة التي تتمتع بوضع مهيمن في السوق إساءة استغلال هذا الوضع بما في ذلك فرض أسعار غير عادلة أو تقييد الإنتاج أو التوزيع.', chapter: 'الباب الثاني - الممارسات المحظورة' },
      { provision_ref: 'art9', section: '9', title: 'المادة 9', content: 'يجب على المنشآت التي تعتزم إجراء عمليات التركز الاقتصادي إخطار الجهاز بذلك إذا بلغت حصتها السوقية المجمعة حدا معينا.', chapter: 'الباب الثالث - التركز الاقتصادي' },
    ],
    definitions: [],
  });

  // 10. MNE Tax 2024 (Domestic Minimum Top-up Tax)
  writeSeed({
    id: 'mne-tax-2024', type: 'statute',
    title: 'مرسوم بقانون رقم 11 لسنة 2024 بشأن الضريبة على المنشآت متعددة الجنسيات', title_en: 'Decree-Law No. 11 of 2024 on Tax on Multinational Enterprises',
    short_name: 'MNE Tax 2024', status: 'in_force',
    issued_date: '2024-09-01', in_force_date: '2025-01-01',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/L1124',
    description: 'Domestic minimum top-up tax on large multinational enterprises aligned with OECD Pillar Two',
    provisions: [
      { provision_ref: 'art1', section: '1', title: 'المادة 1', content: 'في تطبيق أحكام هذا المرسوم بقانون يقصد بالكلمات والعبارات التالية المعاني المبينة: المنشأة متعددة الجنسيات: مجموعة من الكيانات التي تتبع ملكية مشتركة وتمارس نشاطها في أكثر من دولة. الضريبة المحلية التكميلية: الضريبة المفروضة لضمان خضوع المنشآت متعددة الجنسيات لحد أدنى فعلي من الضريبة.', chapter: 'الباب الأول - تعريفات' },
      { provision_ref: 'art2', section: '2', title: 'المادة 2', content: 'تسري أحكام هذا المرسوم بقانون على المنشآت متعددة الجنسيات التي يبلغ إجمالي إيراداتها الموحدة 750 مليون يورو أو ما يعادلها في سنتين ماليتين على الأقل من السنوات المالية الأربع السابقة.', chapter: 'الباب الثاني - نطاق التطبيق' },
      { provision_ref: 'art5', section: '5', title: 'المادة 5', content: 'يكون الحد الأدنى الفعلي لمعدل الضريبة خمسة عشر بالمائة. وتفرض الضريبة المحلية التكميلية بما يعادل الفرق بين الحد الأدنى الفعلي ومعدل الضريبة الفعلي المحتسب.', chapter: 'الباب الثالث - احتساب الضريبة' },
      { provision_ref: 'art10', section: '10', title: 'المادة 10', content: 'تلتزم المنشأة بتقديم الإقرار الضريبي خلال خمسة عشر شهرا من نهاية السنة المالية وسداد الضريبة المستحقة.', chapter: 'الباب الرابع - الالتزامات' },
    ],
    definitions: [
      { term: 'المنشأة متعددة الجنسيات', definition: 'مجموعة من الكيانات التي تتبع ملكية مشتركة وتمارس نشاطها في أكثر من دولة', source_provision: 'art1' },
      { term: 'الضريبة المحلية التكميلية', definition: 'الضريبة المفروضة لضمان خضوع المنشآت متعددة الجنسيات لحد أدنى فعلي من الضريبة', source_provision: 'art1' },
    ],
  });

  updateCensus();
  console.log('\nSeed generation complete.');
}

function updateCensus(): void {
  if (!fs.existsSync(CENSUS_PATH)) return;
  const census = JSON.parse(fs.readFileSync(CENSUS_PATH, 'utf-8'));
  const today = new Date().toISOString().split('T')[0];
  const seedFiles = fs.readdirSync(SEED_DIR).filter(f => f.endsWith('.json'));
  for (const file of seedFiles) {
    const seed = JSON.parse(fs.readFileSync(path.join(SEED_DIR, file), 'utf-8'));
    const law = census.laws.find((l: { id: string }) => l.id === seed.id);
    if (law) { law.ingested = true; law.provision_count = seed.provisions?.length ?? 0; law.ingestion_date = today; }
  }
  census.summary.total_laws = census.laws.length;
  census.summary.ingestable = census.laws.filter((l: { classification: string }) => l.classification === 'ingestable').length;
  fs.writeFileSync(CENSUS_PATH, JSON.stringify(census, null, 2));
  console.log('\n  Census updated with provision counts.');
}

main();
