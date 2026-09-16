import type { DateKey, Test, TestQuestion, TestResult, TestStatus } from '../../types'
import type { Random } from '../../lib/random'
import { addDays, isoAt } from '../../lib/date'
import { isEnrolledOn } from '../../domain/students'
import type { SeededStudent } from './students'

type QuestionSeed = [text: string, options: string[], correct: number]

const q = (prefix: string, list: QuestionSeed[]): TestQuestion[] =>
  list.map(([text, options, correct], index) => ({ id: `${prefix}q${index + 1}`, text, options, correct }))

const javascriptQuestions = q('js', [
  ["JavaScript'da o'zgarmas qiymat e'lon qilish uchun qaysi kalit so'z ishlatiladi?", ['var', 'let', 'const', 'static'], 2],
  ['typeof null ifodasi qanday natija qaytaradi?', ['"null"', '"undefined"', '"object"', '"number"'], 2],
  ["Massiv oxiriga element qo'shuvchi metod qaysi?", ['push()', 'pop()', 'shift()', 'slice()'], 0],
  ["'5' + 3 ifodasining natijasi nima?", ['8', '"53"', 'NaN', 'Xatolik'], 1],
  ["Qat'iy tenglikni tekshiruvchi operator qaysi?", ['=', '==', '===', '!='], 2],
  ["Funksiyadan qiymat qaytarish uchun qaysi kalit so'z ishlatiladi?", ['break', 'return', 'yield', 'exit'], 1],
  ["DOM'da elementni id bo'yicha topuvchi metod qaysi?", ['querySelectorAll', 'getElementById', 'getElementsByName', 'createElement'], 1],
  ['Array.prototype.map() metodi nima qaytaradi?', ['Yangi massiv', 'Mantiqiy qiymat', 'Birinchi element', 'undefined'], 0],
])

const pythonQuestions = q('py', [
  ["Python'da shart operatori qaysi kalit so'z bilan boshlanadi?", ['if', 'when', 'case', 'cond'], 0],
  ['range(5) nechta son hosil qiladi?', ['4', '5', '6', 'Cheksiz'], 1],
  ["Sikldan butunlay chiqish uchun qaysi operator ishlatiladi?", ['continue', 'pass', 'break', 'exit'], 2],
  ["elif kalit so'zi nimani anglatadi?", ['else if', 'end if', 'else loop', 'element if'], 0],
  ["while True: sikli qachon to'xtaydi?", ["break bo'lmasa — hech qachon", '10 marta takrorlangach', 'Darhol', 'Xatolik chiqadi'], 0],
  ['for i in range(1, 4): print(i) — natija qanday?', ['1 2 3', '0 1 2 3', '1 2 3 4', '0 1 2'], 0],
])

const htmlQuestions = q('hc', [
  ['Eng katta sarlavha tegi qaysi?', ['<h6>', '<head>', '<h1>', '<title>'], 2],
  ['Havola yaratish uchun qaysi teg ishlatiladi?', ['<link>', '<a>', '<href>', '<nav>'], 1],
  ["CSS'da matn rangini o'zgartiruvchi xususiyat qaysi?", ['font-color', 'text-color', 'color', 'background'], 2],
  ["Flexbox'da elementlarni gorizontal markazlash uchun nima yoziladi?", ['align-items: center', 'justify-content: center', 'text-align: center', 'float: center'], 1],
  ['Box model tarkibiga nimalar kiradi?', ['content, padding, border, margin', 'header, main, footer', 'faqat width va height', 'color va font'], 0],
  ["Rasm qo'shish tegi qaysi?", ['<picture-src>', '<img>', '<image>', '<src>'], 1],
  ["CSS'da id selektori qaysi belgi bilan yoziladi?", ['.', '#', '*', '@'], 1],
  ["Media so'rov nima uchun ishlatiladi?", ['Responsiv dizayn uchun', "Video qo'shish uchun", "Ma'lumotlar bazasi uchun", 'Animatsiya uchun'], 0],
])

const reactQuestions = q('re', [
  ['Holat (state) yaratish uchun qaysi hook ishlatiladi?', ['useEffect', 'useState', 'useRef', 'useMemo'], 1],
  ['useEffect qachon ishga tushadi?', ['Render tugagach', 'Render boshlanishidan oldin', 'Faqat serverda', 'Hech qachon'], 0],
  ["Ro'yxatni chiqarishda har bir elementga nima berilishi kerak?", ['id atributi', 'key prop', 'name prop', 'index hook'], 1],
  ["Komponentga ma'lumot nima orqali uzatiladi?", ['state', 'props', 'context menu', 'refs'], 1],
  ['useRef nima qaytaradi?', ['.current xususiyatli obyekt', 'Yangi state', 'Promise', 'Massiv'], 0],
])

const csQuestions = q('cs', [
  ["Kompyuterning \"miyasi\" deb qaysi qurilma ataladi?", ['Monitor', 'Protsessor', 'Klaviatura', 'Printer'], 1],
  ['Operativ xotira qisqacha qanday ataladi?', ['ROM', 'RAM', 'CPU', 'SSD'], 1],
  ['Qaysi biri kiritish qurilmasi?', ['Monitor', 'Kolonka', 'Sichqoncha', 'Printer'], 2],
  ['1 bayt necha bitdan iborat?', ['4', '8', '16', '32'], 1],
  ['Operatsion tizimga misol keltiring.', ['Windows', 'Excel', 'Chrome', 'Telegram'], 0],
  ['Ikkilik sanoq sistemasida 5 soni qanday yoziladi?', ['101', '110', '111', '100'], 0],
])

interface TestPlan {
  id: string
  groupId: string
  title: string
  description: string
  questions: TestQuestion[]
  durationMin: number
  status: TestStatus
  dateIn: number
  /** Natija topshirganlar ulushi */
  participation: number
}

const plans: TestPlan[] = [
  {
    id: 't1',
    groupId: 'g1',
    title: 'JavaScript asoslari',
    description: "O'zgaruvchilar, operatorlar, massivlar va DOM bo'yicha oraliq test.",
    questions: javascriptQuestions,
    durationMin: 20,
    status: 'finished',
    dateIn: -10,
    participation: 0.9,
  },
  {
    id: 't2',
    groupId: 'g3',
    title: 'Python: shartlar va sikllar',
    description: "if/elif/else va sikllar mavzusi bo'yicha qisqa test.",
    questions: pythonQuestions,
    durationMin: 15,
    status: 'published',
    dateIn: -1,
    participation: 0.6,
  },
  {
    id: 't3',
    groupId: 'g2',
    title: 'HTML va CSS asoslari',
    description: "Teglar, selektorlar, Box model va Flexbox bo'yicha test.",
    questions: htmlQuestions,
    durationMin: 20,
    status: 'finished',
    dateIn: -17,
    participation: 0.95,
  },
  {
    id: 't4',
    groupId: 'g7',
    title: 'React Hooks',
    description: "useState, useEffect va useRef bo'yicha test (qoralama).",
    questions: reactQuestions,
    durationMin: 15,
    status: 'draft',
    dateIn: 5,
    participation: 0,
  },
  {
    id: 't5',
    groupId: 'g5',
    title: 'Kompyuter qurilmalari',
    description: "Kompyuter qurilmalari va xotira turlari bo'yicha test.",
    questions: csQuestions,
    durationMin: 15,
    status: 'published',
    dateIn: 2,
    participation: 0,
  },
]

export function buildTests(students: SeededStudent[], today: DateKey, random: Random): Test[] {
  return plans.map((plan) => {
    const date = addDays(today, plan.dateIn)
    const results: TestResult[] = []
    if (plan.participation > 0) {
      for (const student of students) {
        if (student.groupId !== plan.groupId || !isEnrolledOn(student, date)) continue
        if (!random.chance(plan.participation)) continue
        const answers = plan.questions.map((question) => {
          if (random.chance(Math.min(0.97, student.diligence * 0.92 + 0.04))) return question.correct
          const wrong = question.options.map((_, i) => i).filter((i) => i !== question.correct)
          return random.chance(0.08) ? -1 : random.pick(wrong)
        })
        results.push({
          studentId: student.id,
          answers,
          finishedAt: isoAt(date, `${String(random.int(9, 18)).padStart(2, '0')}:${String(random.int(0, 59)).padStart(2, '0')}`),
          durationSec: random.int(Math.floor(plan.durationMin * 30), plan.durationMin * 60),
        })
      }
    }
    return {
      id: plan.id,
      title: plan.title,
      description: plan.description,
      groupId: plan.groupId,
      durationMin: plan.durationMin,
      status: plan.status,
      createdAt: isoAt(addDays(date, -4), '11:00'),
      date,
      questions: plan.questions,
      results,
    }
  })
}
