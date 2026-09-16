import { ArrowRightLeft, Eye, MessageSquare, PencilLine, Phone, Trash2, UserMinus, UserRoundCheck, UsersRound } from 'lucide-react'
import type { Student } from '../../types'
import { phoneHref } from '../../lib/format'
import { fullName } from '../../domain/students'
import { deleteStudent, removeFromGroup, restoreStudent } from '../../store/actions/students'
import { runWithUndo } from '../../store/actions/undo'
import { notify } from '../../store/toastStore'
import { closeDrawer, confirmAction, openDrawer, openModal } from '../../store/uiStore'
import type { MenuItem } from '../ui/Menu'

export async function removeStudentFromGroup(student: Student, groupName: string): Promise<void> {
  const name = fullName(student)
  const ok = await confirmAction({
    title: "O'quvchini guruhdan chiqarish",
    message: `${name} «${groupName}» guruhidan chiqariladi. Davomat va baholar tarixi saqlanib qoladi.`,
    confirmLabel: 'Chiqarish',
  })
  if (ok) runWithUndo("O'quvchi guruhdan chiqarildi", () => removeFromGroup(student.id), name)
}

export async function deleteStudentForever(student: Student): Promise<void> {
  const name = fullName(student)
  const ok = await confirmAction({
    title: "O'quvchini butunlay o'chirish",
    message: `${name} va uning barcha davomat, baho va javoblari o'chiriladi.`,
    confirmLabel: "O'chirish",
  })
  if (!ok) return
  closeDrawer()
  runWithUndo("O'quvchi o'chirildi", () => deleteStudent(student.id), name)
}

/** O'quvchi qatoridagi "⋮" menyusi */
export function studentMenuItems(student: Student, groupName: string): MenuItem[] {
  const items: MenuItem[] = [
    { id: 'open', label: "Profilni ko'rish", icon: Eye, onSelect: () => openDrawer({ type: 'student', studentId: student.id }) },
    { id: 'edit', label: 'Tahrirlash', icon: PencilLine, onSelect: () => openModal({ type: 'student-form', studentId: student.id }) },
    {
      id: 'message',
      label: 'Xabar yozish',
      icon: MessageSquare,
      onSelect: () => openModal({ type: 'compose', target: { kind: 'student', id: student.id } }),
    },
    {
      id: 'parent',
      label: 'Ota-onaga xabar',
      icon: UsersRound,
      disabled: !student.parentPhone && !student.parentName,
      onSelect: () => openModal({ type: 'compose', target: { kind: 'parent', id: student.id } }),
    },
    {
      id: 'call',
      label: "Qo'ng'iroq qilish",
      icon: Phone,
      hint: student.phone,
      onSelect: () => {
        window.location.href = phoneHref(student.phone)
        notify.info("Qo'ng'iroq", `${fullName(student)}: ${student.phone}`)
      },
    },
  ]

  if (student.status === 'active') {
    items.push(
      {
        id: 'transfer',
        label: "Boshqa guruhga o'tkazish",
        icon: ArrowRightLeft,
        divider: true,
        onSelect: () => openModal({ type: 'student-transfer', studentId: student.id }),
      },
      { id: 'remove', label: 'Guruhdan chiqarish', icon: UserMinus, onSelect: () => void removeStudentFromGroup(student, groupName) },
    )
  }
  if (student.status === 'left') {
    items.push({
      id: 'restore',
      label: 'Guruhga qaytarish',
      icon: UserRoundCheck,
      divider: true,
      onSelect: () => {
        restoreStudent(student.id)
        notify.success("O'quvchi guruhga qaytarildi", fullName(student))
      },
    })
  }
  items.push({
    id: 'delete',
    label: "Butunlay o'chirish",
    icon: Trash2,
    tone: 'danger',
    divider: student.status !== 'active' && student.status !== 'left',
    onSelect: () => void deleteStudentForever(student),
  })
  return items
}
