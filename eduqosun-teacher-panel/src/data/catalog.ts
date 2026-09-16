import type {
  AssessmentType,
  AttendanceStatus,
  ConversationKind,
  GroupIconKey,
  LessonKind,
  ReminderCategory,
  ReminderPriority,
  StudentStatus,
  TestStatus,
} from '../types'

/*
 * Ilova bo'ylab ishlatiladigan yorliqlar (label) va ro'yxatlar.
 * Barcha matnlar o'zbek (lotin) tilida.
 */

export const directions = ['Dasturlash', 'Python', 'Web', 'IT Asoslari', 'Dizayn'] as const

export const lessonKindLabel: Record<LessonKind, string> = {
  practice: 'Amaliy dars',
  theory: 'Nazariy dars',
  mixed: 'Nazariy + amaliy',
}

export const studentStatusLabel: Record<StudentStatus, string> = {
  active: "O'qiyotgan",
  left: 'Chiqqan',
  transferred: "Guruhga o'tgan",
  graduated: 'Bitirgan',
}

export const attendanceLabel: Record<AttendanceStatus, string> = {
  present: 'Keldi',
  late: 'Kechikdi',
  absent: 'Kelmadi',
  excused: 'Sababli',
}

/** Oylik jurnaldagi qisqa belgi */
export const attendanceShort: Record<AttendanceStatus, string> = {
  present: '+',
  late: 'K',
  absent: '–',
  excused: 'S',
}

export const assessmentTypeLabel: Record<AssessmentType, string> = {
  classwork: 'Darsdagi faollik',
  oral: "Og'zaki so'rov",
  quiz: 'Nazorat ishi',
  exam: 'Imtihon',
}

export const reminderPriorityLabel: Record<ReminderPriority, string> = {
  high: 'Yuqori',
  medium: "O'rta",
  low: 'Past',
}

export const reminderCategoryLabel: Record<ReminderCategory, string> = {
  lesson: 'Dars',
  group: 'Guruh',
  meeting: "Yig'ilish",
  personal: 'Shaxsiy',
}

export const testStatusLabel: Record<TestStatus, string> = {
  draft: 'Qoralama',
  published: 'Faol',
  finished: 'Yakunlangan',
}

export const conversationKindLabel: Record<ConversationKind, string> = {
  student: "O'quvchi",
  parent: 'Ota-ona',
  group: 'Guruh',
}

export const groupIconLabel: Record<GroupIconKey, string> = {
  code: 'Kod',
  globe: 'Veb',
  js: 'JavaScript',
  react: 'React',
  node: 'Node.js',
  python: 'Python',
  html: 'HTML',
  figma: 'Dizayn',
  cpu: 'Kompyuter',
  database: "Ma'lumotlar bazasi",
}

export const groupIconKeys = Object.keys(groupIconLabel) as GroupIconKey[]

/** Dars davomiyligi tanlovlari (daqiqa) */
export const lessonDurations = [45, 60, 80, 90, 120] as const

/** Xabarlar uchun tezkor javob shablonlari */
export const messageTemplates = [
  'Rahmat, qabul qilindi!',
  'Ertaga darsda batafsil muhokama qilamiz.',
  "Iltimos, uy vazifasini o'z vaqtida topshiring.",
  "Materiallarni guruh chatiga joylab qo'ydim.",
  "Savolingiz bo'lsa, darsdan keyin murojaat qiling.",
  'Farzandingiz bugungi darsda faol qatnashdi. Rahmat!',
] as const

/** Ilhomlantiruvchi iqtiboslar (sidebar va Darslarim kartochkasi) */
export const quotes = [
  { title: 'Bugungi mehnat ertangi natija!', subtitle: 'Har bir kichik qadam katta maqsad sari.' },
  { title: 'Bilim – eng katta boylik!', subtitle: "Har kuni o'zingning eng yaxshi versiyang bo'l!" },
  { title: "Yaxshi o'qituvchi — bu ilhom manbai!", subtitle: 'Har bir dars — yangi imkoniyat.' },
  { title: "O'rgatish — ikki marta o'rganish.", subtitle: 'Sabr va izchillik — muvaffaqiyat kaliti.' },
  { title: "Har bir o'quvchi — alohida olam.", subtitle: "E'tibor va mehr — eng yaxshi metodika." },
] as const
