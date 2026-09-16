import type { Assignment, AssignmentStatus, Submission } from '../../types'
import { formatDate } from '../../lib/date'
import { createId } from '../../lib/id'
import { fullName } from '../../domain/students'
import { getAppState, updateApp } from '../appStore'
import { logActivity } from './feed'
import { sendToTarget } from './messages'

export type AssignmentInput = Pick<Assignment, 'groupId' | 'title' | 'description' | 'dueDate' | 'dueTime' | 'maxScore'>

function groupName(groupId: string): string {
  return getAppState().groups.find((g) => g.id === groupId)?.name ?? ''
}

export function announceAssignment(assignment: Assignment): void {
  sendToTarget(
    { kind: 'group', id: assignment.groupId },
    `Yangi topshiriq: «${assignment.title}». Muddat — ${formatDate(assignment.dueDate)}, soat ${assignment.dueTime} gacha.`,
  )
}

export function createAssignment(input: AssignmentInput, options: { announce: boolean }): Assignment {
  const assignment: Assignment = {
    ...input,
    title: input.title.trim(),
    description: input.description.trim(),
    id: createId('asg'),
    createdAt: new Date().toISOString(),
    status: 'active',
  }
  updateApp((state) => ({
    ...state,
    assignments: [assignment, ...state.assignments],
    submissions: { ...state.submissions, [assignment.id]: {} },
  }))
  if (options.announce) announceAssignment(assignment)
  logActivity('assignment', `Guruh ${groupName(assignment.groupId)} ga yangi topshiriq e'lon qilindi`)
  return assignment
}

export function updateAssignment(id: string, patch: Partial<AssignmentInput>): void {
  updateApp((state) => ({
    ...state,
    assignments: state.assignments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
  }))
}

export function setAssignmentStatus(id: string, status: AssignmentStatus): void {
  updateApp((state) => ({
    ...state,
    assignments: state.assignments.map((a) => (a.id === id ? { ...a, status } : a)),
  }))
}

/** Topshiriqni boshqa (yoki shu) guruhga nusxalash */
export function duplicateAssignment(id: string, targetGroupId: string): Assignment | null {
  const source = getAppState().assignments.find((a) => a.id === id)
  if (!source) return null
  return createAssignment(
    {
      groupId: targetGroupId,
      title: targetGroupId === source.groupId ? `${source.title} (nusxa)` : source.title,
      description: source.description,
      dueDate: source.dueDate,
      dueTime: source.dueTime,
      maxScore: source.maxScore,
    },
    { announce: false },
  )
}

export function deleteAssignment(id: string): void {
  updateApp((state) => {
    const submissions = { ...state.submissions }
    delete submissions[id]
    return { ...state, assignments: state.assignments.filter((a) => a.id !== id), submissions }
  })
}

export function gradeSubmission(assignmentId: string, studentId: string, score: number, feedback: string): void {
  const previous = getAppState().submissions[assignmentId]?.[studentId]
  updateApp((state) => {
    const record = { ...(state.submissions[assignmentId] ?? {}) }
    const now = new Date().toISOString()
    const base: Submission = record[studentId] ?? { studentId, submittedAt: now, answer: "Qog'ozda topshirilgan" }
    record[studentId] = { ...base, score, feedback: feedback.trim(), gradedAt: now }
    return { ...state, submissions: { ...state.submissions, [assignmentId]: record } }
  })
  const student = getAppState().students.find((s) => s.id === studentId)
  if (student && previous?.score === undefined) {
    logActivity('grade', `topshirig'i baholandi (${score} ball)`, fullName(student))
  }
}

export function clearSubmissionGrade(assignmentId: string, studentId: string): void {
  updateApp((state) => {
    const record = { ...(state.submissions[assignmentId] ?? {}) }
    const existing = record[studentId]
    if (!existing) return state
    const cleared: Submission = { ...existing }
    delete cleared.score
    delete cleared.gradedAt
    delete cleared.feedback
    record[studentId] = cleared
    return { ...state, submissions: { ...state.submissions, [assignmentId]: record } }
  })
}

/** Topshirmaganlarga shaxsiy eslatma yuborish; yuborilgan xabarlar soni qaytadi */
export function remindStudents(assignmentId: string, studentIds: string[]): number {
  const assignment = getAppState().assignments.find((a) => a.id === assignmentId)
  if (!assignment) return 0
  let sent = 0
  for (const studentId of studentIds) {
    const id = sendToTarget(
      { kind: 'student', id: studentId },
      `Eslatma: «${assignment.title}» topshirig'ini ${formatDate(assignment.dueDate)}, soat ${assignment.dueTime} gacha topshirishingizni so'rayman.`,
    )
    if (id) sent += 1
  }
  return sent
}
