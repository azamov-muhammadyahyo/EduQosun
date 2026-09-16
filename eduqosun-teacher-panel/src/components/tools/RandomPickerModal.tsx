import { useEffect, useMemo, useRef, useState } from 'react'
import { History, RotateCcw, Shuffle, UserRound } from 'lucide-react'
import { cn } from '../../lib/cn'
import { liveRandom } from '../../lib/random'
import { fullName } from '../../domain/students'
import { useClassroom, useDefaultClassGroup } from '../../hooks/useClassroom'
import { useGroupOptions } from '../../hooks/useOptions'
import { notify } from '../../store/toastStore'
import { openDrawer } from '../../store/uiStore'
import { useSettings } from '../../hooks/useData'
import { playChime } from '../../lib/sound'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { Checkbox, Field, Select } from '../ui/Form'
import { Modal } from '../ui/Modal'

const ROLL_MS = 1200
const TICK_MS = 70

/** Darsda javob beruvchini adolatli tanlash: takrorlanmaydi, kelmaganlar chiqarib tashlanadi */
export function RandomPickerModal({ groupId, onClose }: { groupId?: string; onClose: () => void }) {
  const defaultGroup = useDefaultClassGroup()
  const options = useGroupOptions()
  const settings = useSettings()
  const [selectedGroup, setSelectedGroup] = useState(groupId ?? defaultGroup?.id ?? options[0]?.value ?? '')
  const { roster, presentIds } = useClassroom(selectedGroup)
  const [onlyPresent, setOnlyPresent] = useState(true)
  const [noRepeat, setNoRepeat] = useState(true)
  const [picked, setPicked] = useState<string[]>([])
  const [current, setCurrent] = useState<string | null>(null)
  const [rolling, setRolling] = useState(false)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), [])

  const pool = useMemo(
    () =>
      roster.filter(
        (s) => (!onlyPresent || !presentIds || presentIds.has(s.id)) && (!noRepeat || !picked.includes(s.id)),
      ),
    [roster, onlyPresent, presentIds, noRepeat, picked],
  )

  const byId = useMemo(() => new Map(roster.map((s) => [s.id, s])), [roster])
  const currentStudent = current ? byId.get(current) : undefined

  const changeGroup = (id: string) => {
    setSelectedGroup(id)
    setPicked([])
    setCurrent(null)
  }

  const pick = () => {
    if (rolling) return
    if (pool.length === 0) {
      notify.info("Hamma o'quvchi tanlandi", "Ro'yxatni yangilash uchun «Qayta boshlash» tugmasini bosing.")
      return
    }
    const winner = liveRandom.pick(pool)
    setRolling(true)
    const start = Date.now()
    const tick = () => {
      if (Date.now() - start >= ROLL_MS) {
        setCurrent(winner.id)
        setPicked((prev) => [winner.id, ...prev])
        setRolling(false)
        if (settings.sound) playChime('notify')
        return
      }
      setCurrent(liveRandom.pick(pool).id)
      timers.current.push(window.setTimeout(tick, TICK_MS))
    }
    tick()
  }

  const reset = () => {
    setPicked([])
    setCurrent(null)
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Tasodifiy o'quvchi"
      description="Savolga javob beradigan o'quvchini adolatli tanlang"
      icon={Shuffle}
      iconColor="teal"
      size="md"
      footer={
        <>
          <Button variant="secondary" icon={RotateCcw} onClick={reset} disabled={picked.length === 0 || rolling}>
            Qayta boshlash
          </Button>
          <Button icon={Shuffle} onClick={pick} loading={rolling} disabled={roster.length === 0}>
            {current ? 'Yana tanlash' : 'Tanlash'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Guruh">{(id) => <Select id={id} value={selectedGroup} onChange={changeGroup} options={options} />}</Field>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Checkbox
            checked={onlyPresent}
            onChange={setOnlyPresent}
            label="Faqat darsdagilar"
            description={presentIds ? `${presentIds.size} ta o'quvchi keldi` : 'Bugun davomat olinmagan'}
          />
          <Checkbox checked={noRepeat} onChange={setNoRepeat} label="Takrorlanmasin" description="Tanlanganlar qayta chiqmaydi" />
        </div>

        <div
          className={cn(
            'flex min-h-[180px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-colors',
            currentStudent && !rolling
              ? 'border-teal-300 bg-teal-50/60 dark:border-teal-500/40 dark:bg-teal-500/10'
              : 'border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900/30',
          )}
          aria-live="polite"
        >
          {currentStudent ? (
            <>
              <Avatar name={fullName(currentStudent)} color={currentStudent.color} size="2xl" variant="solid" className={cn(rolling && 'scale-95 opacity-80')} />
              <p className={cn('mt-3 text-2xl font-bold text-slate-900 transition-opacity dark:text-white', rolling && 'opacity-60')}>
                {fullName(currentStudent)}
              </p>
              {!rolling ? (
                <button
                  type="button"
                  onClick={() => openDrawer({ type: 'student', studentId: currentStudent.id })}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:underline dark:text-teal-300"
                >
                  <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                  Profilni ochish
                </button>
              ) : null}
            </>
          ) : (
            <>
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-teal-500 shadow-sm dark:bg-slate-800">
                <Shuffle className="h-8 w-8" aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                {roster.length === 0 ? "Bu guruhda o'quvchi yo'q" : '«Tanlash» tugmasini bosing'}
              </p>
              <p className="mt-1 text-xs text-slate-400">Tanlovda {pool.length} ta o'quvchi ishtirok etadi</p>
            </>
          )}
        </div>

        {picked.length > 0 ? (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <History className="h-3.5 w-3.5" aria-hidden="true" />
              Tanlanganlar ({picked.length})
            </p>
            <ol className="flex flex-wrap gap-1.5">
              {picked.map((id, index) => {
                const student = byId.get(id)
                if (!student) return null
                return (
                  <li
                    key={id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-1 pr-2.5 text-xs text-slate-700 dark:bg-slate-700/60 dark:text-slate-200"
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-500 dark:bg-slate-800">
                      {picked.length - index}
                    </span>
                    {fullName(student)}
                  </li>
                )
              })}
            </ol>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
