import { closeDrawer, closeModal, useUI } from '../../store/uiStore'
import { AssignmentReviewDrawer } from '../drawers/AssignmentReviewDrawer'
import { LessonDrawer } from '../drawers/LessonDrawer'
import { StudentDrawer } from '../drawers/StudentDrawer'
import { TestResultsDrawer } from '../drawers/TestResultsDrawer'
import { GroupDrawer } from '../groups/GroupDetailPanel'
import { AssessmentFormModal } from '../modals/AssessmentFormModal'
import { AssignmentFormModal } from '../modals/AssignmentFormModal'
import { ComposeModal } from '../modals/ComposeModal'
import { GroupFormModal } from '../modals/GroupFormModal'
import { ActivityLogModal, ShortcutsModal } from '../modals/InfoModals'
import { LessonFormModal } from '../modals/LessonFormModal'
import { ReminderFormModal } from '../modals/ReminderFormModal'
import { StudentFormModal, TransferStudentModal } from '../modals/StudentModals'
import { TestBuilderModal } from '../modals/TestBuilderModal'
import { TestPreviewModal } from '../modals/TestPreviewModal'
import { RandomPickerModal } from '../tools/RandomPickerModal'
import { TeamSplitterModal } from '../tools/TeamSplitterModal'
import { TimerModal } from '../tools/TimerModal'

function ModalSwitch() {
  const modal = useUI((s) => s.modal)
  if (!modal) return null
  // `key` — bir turdagi oyna boshqa ma'lumot bilan qayta ochilganda holat yangidan boshlanadi
  switch (modal.type) {
    case 'group-form':
      return <GroupFormModal key={modal.groupId ?? 'new'} groupId={modal.groupId} onClose={closeModal} />
    case 'student-form':
      return <StudentFormModal key={modal.studentId ?? 'new'} studentId={modal.studentId} groupId={modal.groupId} onClose={closeModal} />
    case 'student-transfer':
      return <TransferStudentModal key={modal.studentId} studentId={modal.studentId} onClose={closeModal} />
    case 'lesson-form':
      return <LessonFormModal key={modal.lessonKey ?? 'new'} lessonKey={modal.lessonKey} groupId={modal.groupId} date={modal.date} onClose={closeModal} />
    case 'assignment-form':
      return <AssignmentFormModal key={modal.assignmentId ?? 'new'} assignmentId={modal.assignmentId} groupId={modal.groupId} onClose={closeModal} />
    case 'test-builder':
      return <TestBuilderModal key={modal.testId ?? 'new'} testId={modal.testId} groupId={modal.groupId} onClose={closeModal} />
    case 'test-preview':
      return <TestPreviewModal key={modal.testId} testId={modal.testId} onClose={closeModal} />
    case 'compose':
      return <ComposeModal key={`${modal.target?.kind ?? ''}-${modal.target?.id ?? ''}`} target={modal.target} text={modal.text} onClose={closeModal} />
    case 'reminder-form':
      return <ReminderFormModal key={modal.reminderId ?? 'new'} reminderId={modal.reminderId} date={modal.date} onClose={closeModal} />
    case 'assessment-form':
      return <AssessmentFormModal key={modal.assessmentId ?? 'new'} groupId={modal.groupId} assessmentId={modal.assessmentId} onClose={closeModal} />
    case 'random-picker':
      return <RandomPickerModal groupId={modal.groupId} onClose={closeModal} />
    case 'timer':
      return <TimerModal onClose={closeModal} />
    case 'team-splitter':
      return <TeamSplitterModal groupId={modal.groupId} onClose={closeModal} />
    case 'shortcuts':
      return <ShortcutsModal onClose={closeModal} />
    case 'activity-log':
      return <ActivityLogModal onClose={closeModal} />
  }
}

function DrawerSwitch() {
  const drawer = useUI((s) => s.drawer)
  if (!drawer) return null
  switch (drawer.type) {
    case 'lesson':
      return <LessonDrawer key={drawer.lessonKey} lessonKey={drawer.lessonKey} />
    case 'student':
      return <StudentDrawer key={drawer.studentId} studentId={drawer.studentId} />
    case 'group':
      return <GroupDrawer key={drawer.groupId} groupId={drawer.groupId} onClose={closeDrawer} />
    case 'assignment-review':
      return <AssignmentReviewDrawer key={drawer.assignmentId} assignmentId={drawer.assignmentId} />
    case 'test-results':
      return <TestResultsDrawer key={drawer.testId} testId={drawer.testId} />
  }
}

/** Global modal va yon panellar (istalgan sahifadan ochiladi) */
export function OverlayHost() {
  return (
    <>
      <DrawerSwitch />
      <ModalSwitch />
    </>
  )
}
