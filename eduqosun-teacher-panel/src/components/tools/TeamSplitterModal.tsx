import { useMemo, useState } from 'react'
import { Copy, Send, Shuffle, Split } from 'lucide-react'
import type { AccentColor, Student } from '../../types'
import { accent } from '../../lib/colors'
import { cn } from '../../lib/cn'
import { liveRandom } from '../../lib/random'
import { fullName } from '../../domain/students'
import { useClassroom, useDefaultClassGroup } from '../../hooks/useClassroom'
import { useGroupOptions } from '../../hooks/useOptions'
import { sendToTarget } from '../../store/actions/messages'
import { notify } from '../../store/toastStore'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { Checkbox, Field, Select } from '../ui/Form'
import { Modal } from '../ui/Modal'
import { SegmentedControl } from '../ui/Tabs'

type Mode = 'count' | 'size'

const TEAM_COLORS: AccentColor[] = ['blue', 'green', 'violet', 'amber', 'pink', 'teal', 'orange', 'indigo']

/** O'quvchilarni teng jamoalarga bo'lish */
function splitIntoTeams(students: Student[], mode: Mode, value: number): Student[][] {
  const shuffled = liveRandom.shuffle(students)
  const count = mode === 'count' ? Math.min(value, shuffled.length) : Math.max(1, Math.round(shuffled.length / value))
  const teams: Student[][] = Array.from({ length: Math.max(1, count) }, () => [])
  shuffled.forEach((student, index) => teams[index % teams.length].push(student))
  return teams.filter((team) => team.length > 0)
}

export function TeamSplitterModal({ groupId, onClose }: { groupId?: string; onClose: () => void }) {
  const defaultGroup = useDefaultClassGroup()
  const options = useGroupOptions()
  const [selectedGroup, setSelectedGroup] = useState(groupId ?? defaultGroup?.id ?? options[0]?.value ?? '')
  const { roster, presentIds } = useClassroom(selectedGroup)
  const [mode, setMode] = useState<Mode>('count')
  const [value, setValue] = useState(4)
  const [onlyPresent, setOnlyPresent] = useState(true)
  const [teams, setTeams] = useState<Student[][] | null>(null)

  const pool = useMemo(
    () => roster.filter((s) => !onlyPresent || !presentIds || presentIds.has(s.id)),
    [roster, onlyPresent, presentIds],
  )

  const valueOptions = (mode === 'count' ? [2, 3, 4, 5, 6, 8] : [2, 3, 4, 5, 6]).map((n) => ({
    value: String(n),
    label: mode === 'count' ? `${n} ta jamoa` : `${n} kishidan`,
  }))

  const generate = () => {
    if (pool.length < 2) {
      notify.warning("O'quvchilar yetarli emas", "Jamoalarga bo'lish uchun kamida 2 ta o'quvchi kerak.")
      return
    }
    setTeams(splitIntoTeams(pool, mode, value))
  }

  const asText = () =>
    (teams ?? []).map((team, index) => `${index + 1}-jamoa: ${team.map((s) => fullName(s)).join(', ')}`).join('\n')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(asText())
      notify.success('Nusxa olindi', "Jamoalar ro'yxati buferga ko'chirildi.")
    } catch {
      notify.error("Nusxa olib bo'lmadi", 'Brauzer buferga yozishga ruxsat bermadi.')
    }
  }

  const share = () => {
    const id = sendToTarget({ kind: 'group', id: selectedGroup }, `Bugungi jamoalar:\n${asText()}`)
    if (id) notify.success('Guruh chatiga yuborildi', "O'quvchilar o'z jamoalarini ko'rishadi.")
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Jamoalarga bo'lish"
      description="Guruh ishi uchun o'quvchilarni tasodifiy va teng jamoalarga ajrating"
      icon={Split}
      iconColor="violet"
      size="lg"
      footer={
        teams ? (
          <>
            <Button variant="secondary" icon={Copy} onClick={() => void copy()}>
              Nusxa olish
            </Button>
            <Button variant="secondary" icon={Send} onClick={share}>
              Guruh chatiga yuborish
            </Button>
            <Button icon={Shuffle} onClick={generate}>
              Qayta aralashtirish
            </Button>
          </>
        ) : (
          <Button icon={Split} onClick={generate}>
            Jamoalarga bo'lish
          </Button>
        )
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Guruh">
            {(id) => (
              <Select
                id={id}
                value={selectedGroup}
                onChange={(next) => {
                  setSelectedGroup(next)
                  setTeams(null)
                }}
                options={options}
              />
            )}
          </Field>
          <div>
            <p className="mb-1.5 text-[13px] font-medium text-slate-700 dark:text-slate-200">Bo'lish usuli</p>
            <div className="flex gap-2">
              <SegmentedControl<Mode>
                label="Bo'lish usuli"
                items={[
                  { value: 'count', label: 'Soni' },
                  { value: 'size', label: 'Hajmi' },
                ]}
                value={mode}
                onChange={(next) => {
                  setMode(next)
                  setValue(next === 'count' ? 4 : 3)
                }}
              />
              <Select className="flex-1" value={String(value)} onChange={(v) => setValue(Number(v))} options={valueOptions} aria-label="Qiymat" />
            </div>
          </div>
        </div>
        <Checkbox
          checked={onlyPresent}
          onChange={setOnlyPresent}
          label="Faqat darsdagi o'quvchilar"
          description={presentIds ? `Bugun ${presentIds.size} ta o'quvchi keldi` : `Davomat olinmagan — ${roster.length} ta o'quvchi`}
        />

        {teams ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team, index) => {
              const color = TEAM_COLORS[index % TEAM_COLORS.length]
              return (
                <div key={index} className={cn('rounded-2xl border p-3', accent[color].softBorder, accent[color].softBg)}>
                  <p className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-800 dark:text-slate-100">
                    <span className="inline-flex items-center gap-2">
                      <span className={cn('h-2.5 w-2.5 rounded-full', accent[color].solidBg)} />
                      {index + 1}-jamoa
                    </span>
                    <span className="text-xs font-medium text-slate-500">{team.length} kishi</span>
                  </p>
                  <ul className="space-y-1.5">
                    {team.map((student) => (
                      <li key={student.id} className="flex items-center gap-2 text-[13px] text-slate-700 dark:text-slate-200">
                        <Avatar name={fullName(student)} color={student.color} size="xs" />
                        <span className="truncate">{fullName(student)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center dark:border-slate-700">
            <Split className="mx-auto h-8 w-8 text-violet-400" aria-hidden="true" />
            <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              {pool.length} ta o'quvchi jamoalarga bo'linadi
            </p>
            <p className="mt-1 text-xs text-slate-400">Sozlamalarni tanlang va «Jamoalarga bo'lish» tugmasini bosing</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
