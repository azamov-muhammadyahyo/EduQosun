import type { Assignment, AssignmentStatus, DateKey, Submission } from '../../types'
import type { Random } from '../../lib/random'
import { addDays, diffDays, isoAt } from '../../lib/date'
import { clamp } from '../../lib/format'
import { slugify } from '../../lib/text'
import { assignmentRoster } from '../../domain/assignments'
import type { SeededStudent } from './students'

interface AssignmentPlan {
  groupId: string
  title: string
  description: string
  /** Muddat: bugundan necha kun keyin (manfiy — o'tib ketgan) */
  dueIn: number
  status: AssignmentStatus
  maxScore: number
}

const plans: AssignmentPlan[] = [
  {
    groupId: 'g1',
    title: 'DOM bilan ishlash',
    description: "Sahifadagi elementlarni JavaScript orqali o'zgartiruvchi interaktiv ro'yxat yarating.",
    dueIn: -9,
    status: 'closed',
    maxScore: 10,
  },
  {
    groupId: 'g1',
    title: 'Array metodlari mavzusidan topshiriq',
    description: 'map, filter va reduce metodlaridan foydalanib 10 ta masalani yeching.',
    dueIn: 1,
    status: 'active',
    maxScore: 10,
  },
  {
    groupId: 'g2',
    title: 'Flexbox amaliyoti',
    description: 'Flexbox yordamida mahsulotlar kartochkalari sahifasini yarating.',
    dueIn: -4,
    status: 'active',
    maxScore: 10,
  },
  {
    groupId: 'g2',
    title: 'Responsiv landing sahifa',
    description: 'Mobil, planshet va kompyuter uchun moslashuvchan landing sahifa yarating.',
    dueIn: 4,
    status: 'active',
    maxScore: 10,
  },
  {
    groupId: 'g3',
    title: "Sikllar bo'yicha masalalar",
    description: 'for va while sikllari yordamida 8 ta masalani yeching.',
    dueIn: -6,
    status: 'closed',
    maxScore: 10,
  },
  {
    groupId: 'g3',
    title: 'Dastur tuzish (amaliy ish)',
    description: "Foydalanuvchi kiritgan sonlar ro'yxatidan statistik ma'lumot chiqaruvchi dastur yozing.",
    dueIn: 2,
    status: 'active',
    maxScore: 10,
  },
  {
    groupId: 'g4',
    title: 'Promise va async/await',
    description: "Ochiq API'dan ma'lumot olib, sahifada ko'rsatuvchi funksiyalar yozing.",
    dueIn: 5,
    status: 'active',
    maxScore: 10,
  },
  {
    groupId: 'g5',
    title: 'Kompyuter qurilmalari taqdimoti',
    description: "Kompyuterning asosiy qurilmalari haqida 8–10 slayddan iborat taqdimot tayyorlang.",
    dueIn: 6,
    status: 'active',
    maxScore: 10,
  },
  {
    groupId: 'g6',
    title: 'Mobil ilova dizayni',
    description: "Figma'da ovqat yetkazib berish ilovasining 3 ta asosiy ekranini chizing.",
    dueIn: 8,
    status: 'active',
    maxScore: 10,
  },
  {
    groupId: 'g7',
    title: 'useState amaliyoti',
    description: "Hisoblagich va vazifalar ro'yxati komponentlarini yarating.",
    dueIn: -2,
    status: 'active',
    maxScore: 10,
  },
  {
    groupId: 'g7',
    title: 'Komponentlar bilan ishlash',
    description: "Props orqali ma'lumot uzatadigan kartochka komponentlarini yarating.",
    dueIn: 3,
    status: 'active',
    maxScore: 10,
  },
  {
    groupId: 'g8',
    title: 'REST API yaratish',
    description: "Express yordamida kitoblar ro'yxati uchun CRUD API yozing.",
    dueIn: 3,
    status: 'active',
    maxScore: 100,
  },
]

const feedbacks = [
  'Juda yaxshi ish! Kod toza va tushunarli.',
  "Yaxshi. Funksiyalarni kichikroq qismlarga ajratishga harakat qiling.",
  "Asosiy talablar bajarilgan, lekin ba'zi holatlar hisobga olinmagan.",
  "A'lo! Qo'shimcha imkoniyatlar ham qo'shibsiz.",
  "Qayta ko'rib chiqing: xatoliklarni tekshirish yetishmayapti.",
]

function answerFor(studentName: string, title: string, random: Random): string {
  const login = slugify(studentName)
  const variants = [
    `GitHub havola: https://github.com/${login}/${slugify(title)}`,
    `Topshiriq bajarildi. Kod havolasi: https://codepen.io/${login}/pen/${random.int(1000, 9999)}`,
    "Ustoz, topshiriqni bajardim. Fayllarni guruh chatiga ham yubordim.",
    `Loyiha: https://${login}.github.io/${slugify(title)}`,
  ]
  return random.pick(variants)
}

export function buildAssignments(
  students: SeededStudent[],
  today: DateKey,
  now: Date,
  random: Random,
): { assignments: Assignment[]; submissions: Record<string, Record<string, Submission>> } {
  const assignments: Assignment[] = []
  const submissions: Record<string, Record<string, Submission>> = {}

  plans.forEach((plan, index) => {
    const dueDate = addDays(today, plan.dueIn)
    const createdCandidate = addDays(dueDate, -7)
    const createdDate = createdCandidate < today ? createdCandidate : addDays(today, -1)
    const assignment: Assignment = {
      id: `h${index + 1}`,
      groupId: plan.groupId,
      title: plan.title,
      description: plan.description,
      createdAt: isoAt(createdDate, '10:00'),
      dueDate,
      dueTime: '23:59',
      maxScore: plan.maxScore,
      status: plan.status,
    }
    assignments.push(assignment)

    const record: Record<string, Submission> = {}
    const pastDue = plan.dueIn < 0
    const byId = new Map(students.map((s) => [s.id, s]))

    for (const member of assignmentRoster(assignment, students)) {
      const student = byId.get(member.id)
      if (!student) continue
      const chance = pastDue
        ? 0.45 + student.diligence * 0.5
        : student.diligence * (1 - Math.max(0, plan.dueIn) / 10) * 0.9
      if (!random.chance(chance)) continue

      // Javob topshiriq berilgan kundan muddatgacha (yoki bugungacha) bo'lgan oraliqda yuborilgan
      const late = pastDue && random.chance(0.12)
      const windowDays = Math.max(0, diffDays(pastDue ? dueDate : today, createdDate))
      const submittedDate = late ? addDays(dueDate, 1) : addDays(createdDate, random.int(0, windowDays))
      let submittedAt = isoAt(submittedDate, `${String(random.int(14, 22)).padStart(2, '0')}:${String(random.int(0, 59)).padStart(2, '0')}`)
      if (new Date(submittedAt).getTime() > now.getTime()) {
        submittedAt = new Date(now.getTime() - random.int(20, 600) * 60_000).toISOString()
      }

      const submission: Submission = {
        studentId: student.id,
        submittedAt,
        answer: answerFor(`${student.firstName} ${student.lastName}`, plan.title, random),
      }

      const shouldGrade = plan.status === 'closed' || (pastDue && random.chance(0.45))
      if (shouldGrade) {
        const base = clamp(Math.round(random.normal(3 + student.diligence * 7, 1)), 3, 10)
        submission.score = Math.round((base / 10) * plan.maxScore)
        submission.feedback = random.pick(feedbacks)
        submission.gradedAt = new Date(Math.min(now.getTime(), new Date(submittedAt).getTime() + 86_400_000)).toISOString()
      }
      record[student.id] = submission
    }
    submissions[assignment.id] = record
  })

  return { assignments, submissions }
}
