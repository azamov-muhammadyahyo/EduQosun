import type { AccentColor, DateKey, Gender, Group, Student, StudentStatus } from '../../types'
import type { Random } from '../../lib/random'
import { accentPalette } from '../../lib/colors'
import { addDays, diffDays } from '../../lib/date'
import { femaleNames, maleNames, parentFemaleNames, parentMaleNames, phonePrefixes, surnames } from './names'
import type { GroupBlueprint } from './groups'

/** Dizayndagi tanish o'quvchilar — birinchi bo'lib yaratiladi */
const featured: Record<string, { firstName: string; lastName: string; gender: Gender }[]> = {
  g1: [{ firstName: 'Bekzod', lastName: 'Rahimov', gender: 'male' }],
  g2: [{ firstName: 'Sardorbek', lastName: "To'xtayev", gender: 'male' }],
  g3: [
    { firstName: 'Dilshodbek', lastName: 'Xolikov', gender: 'male' },
    { firstName: 'Malika', lastName: 'Karimova', gender: 'female' },
  ],
}

export interface SeededStudent extends Student {
  /** Faqat generator uchun: o'quvchining tirishqoqligi (0.5–1) */
  diligence: number
}

function phone(random: Random): string {
  const digits = Array.from({ length: 7 }, () => random.int(0, 9)).join('')
  return `+998 ${random.pick(phonePrefixes)} ${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`
}

function femaleSurname(surname: string): string {
  return `${surname}a`
}

export function buildStudents(
  blueprints: GroupBlueprint[],
  groups: Group[],
  today: DateKey,
  random: Random,
): SeededStudent[] {
  const result: SeededStudent[] = []
  const usedNames = new Set<string>()
  let serial = 0

  const uniqueName = (gender: Gender) => {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const first = random.pick(gender === 'male' ? maleNames : femaleNames)
      const base = random.pick(surnames)
      const last = gender === 'male' ? base : femaleSurname(base)
      const key = `${first} ${last}`
      if (!usedNames.has(key)) {
        usedNames.add(key)
        return { firstName: first, lastName: last }
      }
    }
    return { firstName: random.pick(maleNames), lastName: `${random.pick(surnames)} ${serial}` }
  }

  blueprints.forEach((blueprint, groupIndex) => {
    const group = groups[groupIndex]
    const { active, left, transferred } = blueprint.roster
    const statuses: StudentStatus[] = [
      ...Array.from({ length: active }, (): StudentStatus => (group.status === 'completed' ? 'graduated' : 'active')),
      ...Array.from({ length: left }, (): StudentStatus => 'left'),
      ...Array.from({ length: transferred }, (): StudentStatus => 'transferred'),
    ]
    const pinned = featured[group.id] ?? []
    // Guruh faoliyatining oxirgi kuni: tugagan guruhda — tugash sanasi, aks holda — bugun
    const lastDay = group.endDate && group.endDate < today ? group.endDate : today
    const courseDays = Math.max(1, diffDays(lastDay, group.startDate))

    statuses.forEach((status, index) => {
      serial += 1
      const preset = status === 'active' || status === 'graduated' ? pinned[index] : undefined
      const gender: Gender = preset?.gender ?? (random.chance(0.55) ? 'male' : 'female')
      const name = preset ?? uniqueName(gender)
      if (preset) usedNames.add(`${preset.firstName} ${preset.lastName}`)

      // Ko'pchilik kurs boshida qo'shiladi, ba'zilar keyinroq
      const lateJoin = index > 2 && status !== 'left' && status !== 'transferred' && random.chance(0.18)
      const rawJoin = lateJoin
        ? addDays(group.startDate, random.int(7, Math.max(8, Math.floor(courseDays * 0.6))))
        : addDays(group.startDate, -random.int(0, 4))
      const joinedAt = rawJoin > lastDay ? lastDay : rawJoin

      // Chiqib ketganlar kamida bir necha hafta o'qigan bo'ladi
      let leftAt: DateKey | undefined
      if (status === 'left' || status === 'transferred') {
        const available = diffDays(lastDay, joinedAt) - 1
        const offset = available > 10 ? random.int(Math.min(14, available), available) : Math.max(1, available)
        leftAt = addDays(joinedAt, offset)
      }

      const parentMale = random.chance(0.4)
      const parentFirst = random.pick(parentMale ? parentMaleNames : parentFemaleNames)
      const lastBase = gender === 'male' ? name.lastName : name.lastName.replace(/a$/, '')
      const parentLast = parentMale ? lastBase : femaleSurname(lastBase)

      const age = group.name.startsWith('11') ? 17 : group.name.startsWith('10') ? 16 : group.name.startsWith('9') ? 15 : 14
      const birthDate = addDays(today, -(age * 365 + random.int(0, 364)))

      // Bir nechta o'quvchi ataylab "xavf zonasi"da — statistikada ko'rinsin
      const diligence =
        preset !== undefined
          ? 0.9 + random.next() * 0.08
          : random.chance(0.1)
            ? 0.5 + random.next() * 0.2
            : 0.8 + random.next() * 0.19

      const transferTarget =
        status === 'transferred'
          ? groups.filter((g) => g.id !== group.id && g.status === 'active')[random.int(0, 6)]?.id
          : undefined

      result.push({
        id: `s${serial}`,
        firstName: name.firstName,
        lastName: name.lastName,
        gender,
        groupId: group.id,
        status,
        phone: phone(random),
        parentName: `${parentFirst} ${parentLast}`,
        parentPhone: phone(random),
        birthDate,
        joinedAt,
        leftAt,
        transferredToGroupId: transferTarget,
        color: random.pick<AccentColor>(accentPalette),
        note: '',
        diligence,
      })
    })
  })

  return result
}
