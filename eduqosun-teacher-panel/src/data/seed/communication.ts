import type {
  ActivityEntry,
  AppNotification,
  ChatMessage,
  Conversation,
  DateKey,
  Group,
  Reminder,
  Student,
} from '../../types'
import { addDays, isoAt } from '../../lib/date'
import { fullName } from '../../domain/students'

const MINUTE = 60_000

function ago(now: Date, minutes: number): string {
  return new Date(now.getTime() - minutes * MINUTE).toISOString()
}

function msg(id: string, from: 'me' | 'them', text: string, sentAt: string, author?: string): ChatMessage {
  return { id, from, text, sentAt, read: from === 'me', author }
}

function findStudent(students: Student[], first: string, last: string): Student | undefined {
  return students.find((s) => s.firstName === first && s.lastName === last)
}

export function buildConversations(
  students: Student[],
  groups: Group[],
  today: DateKey,
  now: Date,
): Conversation[] {
  const yesterday = addDays(today, -1)
  const bekzod = findStudent(students, 'Bekzod', 'Rahimov')
  const dilshod = findStudent(students, 'Dilshodbek', 'Xolikov')
  const sardor = findStudent(students, 'Sardorbek', "To'xtayev")
  const malika = findStudent(students, 'Malika', 'Karimova')
  const group11a = groups.find((g) => g.id === 'g1')
  const group10b = groups.find((g) => g.id === 'g4')
  const classmate = students.find((s) => s.groupId === 'g1' && s.status === 'active' && s.id !== bekzod?.id)

  const groupLabel = (student?: Student) => groups.find((g) => g.id === student?.groupId)?.name ?? ''
  const conversations: Conversation[] = []

  if (bekzod) {
    conversations.push({
      id: 'c1',
      kind: 'student',
      studentId: bekzod.id,
      title: fullName(bekzod),
      subtitle: groupLabel(bekzod),
      color: 'blue',
      pinned: true,
      unread: 1,
      messages: [
        msg('c1m1', 'them', "Assalomu alaykum, ustoz! Array metodlari bo'yicha savolim bor edi.", isoAt(addDays(today, -2), '18:20')),
        msg('c1m2', 'me', "Va alaykum assalom, Bekzod. Bemalol, qaysi joyi tushunarsiz bo'ldi?", isoAt(addDays(today, -2), '18:45')),
        msg('c1m3', 'them', 'reduce metodi qanday ishlashini tushunmadim.', isoAt(addDays(today, -2), '18:52')),
        msg('c1m4', 'me', "Ertaga darsda misollar bilan batafsil ko'rib chiqamiz.", isoAt(addDays(today, -2), '19:05')),
        msg('c1m5', 'them', 'Assalomu alaykum, javobni tekshirib bera olasizmi? Topshiriqni yubordim.', ago(now, 34)),
      ],
    })
  }

  if (dilshod) {
    conversations.push({
      id: 'c2',
      kind: 'student',
      studentId: dilshod.id,
      title: fullName(dilshod),
      subtitle: groupLabel(dilshod),
      color: 'green',
      pinned: false,
      unread: 1,
      messages: [
        msg('c2m1', 'me', "Dilshodbek, bugungi darsda yo'q edingiz. Hammasi joyidami?", isoAt(addDays(today, -2), '14:00')),
        msg('c2m2', 'them', "Ha ustoz, shifokorga borgandim. Mavzuni o'zim o'qib chiqaman.", isoAt(addDays(today, -2), '14:30')),
        msg('c2m3', 'them', "Topshiriqni kechroq topshira olamanmi? Kasal bo'lib qoldim.", ago(now, 68)),
      ],
    })
  }

  if (sardor) {
    conversations.push({
      id: 'c3',
      kind: 'student',
      studentId: sardor.id,
      title: fullName(sardor),
      subtitle: groupLabel(sardor),
      color: 'violet',
      pinned: false,
      unread: 1,
      messages: [
        msg('c3m1', 'me', "Bugungi mavzu bo'yicha qo'shimcha materiallarni guruhga joyladim.", isoAt(yesterday, '16:10')),
        msg('c3m2', 'them', 'Dars materialini menga ham yuborishingiz mumkinmi?', ago(now, 86)),
      ],
    })
  }

  if (group11a) {
    conversations.push({
      id: 'c4',
      kind: 'group',
      groupId: group11a.id,
      title: `Guruh ${group11a.name}`,
      subtitle: group11a.course,
      color: 'amber',
      pinned: true,
      unread: 0,
      messages: [
        msg('c4m1', 'them', 'Ustoz, ertangi dars soat nechida boshlanadi?', ago(now, 190), classmate ? fullName(classmate) : "O'quvchi"),
        msg('c4m2', 'me', 'Odatdagidek, 08:30 da. Kechikmaslikka harakat qiling!', ago(now, 175)),
        msg('c4m3', 'me', "Yangi topshiriq e'lon qilindi. Muddat — ertaga soat 23:59 gacha.", ago(now, 131)),
      ],
    })
  }

  if (malika) {
    conversations.push({
      id: 'c5',
      kind: 'student',
      studentId: malika.id,
      title: fullName(malika),
      subtitle: groupLabel(malika),
      color: 'rose',
      pinned: false,
      unread: 0,
      messages: [
        msg('c5m1', 'me', "Malika, nazorat ishingiz a'lo darajada bo'ldi. Shunday davom eting!", isoAt(yesterday, '19:30')),
        msg('c5m2', 'them', "Rahmat ustoz, tushunarli bo'ldi!", isoAt(yesterday, '19:42')),
      ],
    })
  }

  if (bekzod) {
    conversations.push({
      id: 'c6',
      kind: 'parent',
      studentId: bekzod.id,
      title: bekzod.parentName,
      subtitle: `${fullName(bekzod)}ning ota-onasi`,
      color: 'teal',
      pinned: false,
      unread: 0,
      messages: [
        msg('c6m1', 'them', "Assalomu alaykum. Bekzodning o'qishi qanday ketyapti?", isoAt(addDays(today, -3), '20:10')),
        msg('c6m2', 'me', "Va alaykum assalom! Bekzod darslarda faol, topshiriqlarni o'z vaqtida bajaryapti.", isoAt(addDays(today, -3), '20:30')),
        msg('c6m3', 'them', 'Rahmat, ustoz. Uyda ham nazorat qilib boramiz.', isoAt(addDays(today, -3), '20:34')),
      ],
    })
  }

  if (group10b) {
    conversations.push({
      id: 'c7',
      kind: 'group',
      groupId: group10b.id,
      title: `Guruh ${group10b.name}`,
      subtitle: group10b.course,
      color: 'indigo',
      pinned: false,
      unread: 0,
      messages: [
        msg('c7m1', 'me', "Juma kungi dars soat 15:00 da bo'ladi. Noutbuklaringizni olib keling.", isoAt(addDays(today, -4), '12:00')),
      ],
    })
  }

  return conversations
}

export function buildReminders(today: DateKey, now: Date): Reminder[] {
  const created = ago(now, 60 * 30)
  return [
    {
      id: 'r1',
      title: '11-A guruhi uchun nazorat ishi tayyorlash',
      note: "Array metodlari va obyektlar bo'yicha 10 ta savol.",
      date: addDays(today, 1),
      time: '10:00',
      priority: 'high',
      category: 'lesson',
      groupId: 'g1',
      done: false,
      createdAt: created,
    },
    {
      id: 'r2',
      title: "Ota-onalar yig'ilishi",
      note: "Choraklik natijalar va davomat bo'yicha qisqa hisobot tayyorlash.",
      date: addDays(today, 3),
      time: '18:00',
      priority: 'high',
      category: 'meeting',
      done: false,
      createdAt: created,
    },
    {
      id: 'r3',
      title: 'Topshiriqlarni tekshirish (11-B)',
      note: 'Flexbox amaliyoti — tekshirilmagan javoblar bor.',
      date: today,
      time: '17:00',
      priority: 'medium',
      category: 'group',
      groupId: 'g2',
      done: false,
      createdAt: created,
    },
    {
      id: 'r4',
      title: 'Metodik birlashma hisobotini topshirish',
      note: '',
      date: addDays(today, 5),
      priority: 'low',
      category: 'meeting',
      done: false,
      createdAt: created,
    },
    {
      id: 'r5',
      title: "Yangi o'quvchilar ro'yxatini yangilash",
      note: "Qabul bo'limidan kelgan ro'yxat asosida.",
      date: addDays(today, -1),
      time: '12:00',
      priority: 'medium',
      category: 'personal',
      done: true,
      doneAt: ago(now, 60 * 20),
      createdAt: created,
    },
    {
      id: 'r6',
      title: "Davomat jurnalini to'ldirish",
      note: "O'tgan haftadagi qo'shimcha dars uchun.",
      date: addDays(today, -1),
      time: '16:00',
      priority: 'medium',
      category: 'lesson',
      done: false,
      createdAt: created,
    },
    {
      id: 'r7',
      title: "«Samarali o'qitish usullari» kitobi — 3-bob",
      note: 'Guruhda ishlash metodlari haqida qaydlar yozib olish.',
      date: addDays(today, 7),
      priority: 'low',
      category: 'personal',
      done: false,
      createdAt: created,
    },
  ]
}

export function buildNotifications(now: Date, lowAttendance?: { group: string; rate: number }): AppNotification[] {
  const list: AppNotification[] = [
    {
      id: 'n1',
      kind: 'submission',
      title: 'Yangi javob topshirildi',
      text: "Bekzod Rahimov «Array metodlari» topshirig'ini yubordi.",
      createdAt: ago(now, 34),
      read: false,
      route: 'tasks',
    },
    {
      id: 'n2',
      kind: 'message',
      title: 'Yangi xabar',
      text: 'Dilshodbek Xolikov: Topshiriqni kechroq topshira olamanmi?',
      createdAt: ago(now, 68),
      read: false,
      route: 'messages/c2',
    },
    {
      id: 'n3',
      kind: 'reminder',
      title: 'Bugungi eslatma',
      text: '17:00 — Topshiriqlarni tekshirish (11-B)',
      createdAt: ago(now, 180),
      read: false,
      route: 'reminders',
    },
    {
      id: 'n5',
      kind: 'system',
      title: 'Yangi imkoniyatlar',
      text: "Endi darsda tasodifiy o'quvchi tanlash, taymer va jamoalarga bo'lish vositalaridan foydalanishingiz mumkin.",
      createdAt: ago(now, 60 * 48),
      read: true,
    },
  ]
  if (lowAttendance) {
    list.splice(3, 0, {
      id: 'n4',
      kind: 'attendance',
      title: 'Davomat pasaygan',
      text: `${lowAttendance.group} guruhida so'nggi haftalardagi davomat ${lowAttendance.rate}% ni tashkil qildi.`,
      createdAt: ago(now, 60 * 26),
      read: true,
      route: 'attendance',
    })
  }
  return list
}

export function buildActivity(now: Date): ActivityEntry[] {
  return [
    { id: 'ac1', kind: 'submission', actor: 'Bekzod Rahimov', text: 'topshiriqni topshirdi', createdAt: ago(now, 34) },
    { id: 'ac2', kind: 'message', actor: 'Dilshodbek Xolikov', text: 'xabar yubordi', createdAt: ago(now, 68) },
    { id: 'ac3', kind: 'assignment', text: "Guruh 11-A ga yangi topshiriq e'lon qilindi", createdAt: ago(now, 131) },
    { id: 'ac4', kind: 'grade', actor: 'Malika Karimova', text: 'bahosi yangilandi (9 → 10)', createdAt: ago(now, 60 * 20) },
    { id: 'ac5', kind: 'student', text: "Yangi o'quvchi qo'shildi (11-B)", createdAt: ago(now, 60 * 27) },
    { id: 'ac6', kind: 'attendance', text: '10-A guruhi davomati saqlandi', createdAt: ago(now, 60 * 30) },
    { id: 'ac7', kind: 'test', text: '«JavaScript asoslari» testi yakunlandi', createdAt: ago(now, 60 * 24 * 10) },
  ]
}
