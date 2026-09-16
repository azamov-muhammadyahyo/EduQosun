import { CalendarCheck, CalendarX2, Eye, PencilLine, Send, Trash2, Undo2 } from 'lucide-react'
import type { Group, Lesson } from '../../types'
import { formatDateWithWeekday } from '../../lib/date'
import { extraIdFromKey } from '../../domain/lessons'
import { navigateTo } from '../../router'
import { deleteExtraLesson, setLessonCanceled } from '../../store/actions/lessons'
import { runWithUndo } from '../../store/actions/undo'
import { notify } from '../../store/toastStore'
import { closeDrawer, confirmAction, openDrawer, openModal } from '../../store/uiStore'
import type { MenuItem } from '../ui/Menu'

/** Darsni bekor qilish (tasdiq bilan) yoki qayta tiklash */
export async function toggleLessonCanceled(lesson: Lesson, group: Group): Promise<void> {
  if (lesson.canceled) {
    setLessonCanceled(lesson.key, false)
    notify.success('Dars qayta tiklandi')
    return
  }
  const ok = await confirmAction({
    title: 'Darsni bekor qilish',
    message: `${group.name} guruhining ${formatDateWithWeekday(lesson.date)}, ${lesson.start} dagi darsi bekor qilinadi. O'quvchilarga xabar yuborishni unutmang.`,
    confirmLabel: 'Bekor qilish',
    cancelLabel: 'Ortga',
  })
  if (!ok) return
  setLessonCanceled(lesson.key, true)
  notify.warning('Dars bekor qilindi', "Guruhga xabar yuborish uchun «Guruhga xabar» amalidan foydalaning.")
}

export function lessonMessageText(lesson: Lesson): string {
  return lesson.canceled
    ? `Diqqat! ${formatDateWithWeekday(lesson.date)}, soat ${lesson.start} dagi dars bekor qilindi.`
    : `${formatDateWithWeekday(lesson.date)}, soat ${lesson.start} — «${lesson.topic}» mavzusidagi dars.`
}

export function openLessonAttendance(lesson: Lesson): void {
  closeDrawer()
  navigateTo('attendance', null, { group: lesson.groupId, date: lesson.date, lesson: lesson.key })
}

/** Dars qatoridagi "⋮" menyusi */
export function lessonMenuItems(lesson: Lesson, group: Group): MenuItem[] {
  const items: MenuItem[] = [
    { id: 'open', label: 'Batafsil', icon: Eye, onSelect: () => openDrawer({ type: 'lesson', lessonKey: lesson.key }) },
    {
      id: 'attendance',
      label: 'Davomat olish',
      icon: CalendarCheck,
      disabled: lesson.canceled,
      onSelect: () => openLessonAttendance(lesson),
    },
    { id: 'edit', label: 'Tahrirlash', icon: PencilLine, onSelect: () => openModal({ type: 'lesson-form', lessonKey: lesson.key }) },
    {
      id: 'message',
      label: 'Guruhga xabar',
      icon: Send,
      onSelect: () => openModal({ type: 'compose', target: { kind: 'group', id: group.id }, text: lessonMessageText(lesson) }),
    },
    {
      id: 'cancel',
      label: lesson.canceled ? 'Darsni tiklash' : 'Darsni bekor qilish',
      icon: lesson.canceled ? Undo2 : CalendarX2,
      tone: lesson.canceled ? 'default' : 'danger',
      divider: true,
      onSelect: () => void toggleLessonCanceled(lesson, group),
    },
  ]
  if (lesson.isExtra) {
    items.push({
      id: 'delete',
      label: "Darsni o'chirish",
      icon: Trash2,
      tone: 'danger',
      onSelect: async () => {
        const ok = await confirmAction({
          title: "Darsni o'chirish",
          message: `«${lesson.topic}» darsi va unga tegishli davomat butunlay o'chiriladi.`,
          confirmLabel: "O'chirish",
        })
        if (ok) runWithUndo("Dars o'chirildi", () => deleteExtraLesson(extraIdFromKey(lesson.key)))
      },
    })
  }
  return items
}
