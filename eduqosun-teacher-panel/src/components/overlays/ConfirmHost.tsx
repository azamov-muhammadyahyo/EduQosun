import { CircleHelp, TriangleAlert } from 'lucide-react'
import { resolveConfirm, useUI } from '../../store/uiStore'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

/** `confirmAction()` chaqirilganda ochiladigan tasdiqlash oynasi */
export function ConfirmHost() {
  const request = useUI((s) => s.confirm)
  if (!request) return null
  const danger = request.tone !== 'primary'
  return (
    <Modal
      open
      onClose={() => resolveConfirm(false)}
      title={request.title}
      icon={danger ? TriangleAlert : CircleHelp}
      iconColor={danger ? 'rose' : 'blue'}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={() => resolveConfirm(false)}>
            {request.cancelLabel ?? 'Bekor qilish'}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={() => resolveConfirm(true)} data-autofocus>
            {request.confirmLabel ?? 'Tasdiqlash'}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {request.message ?? "Bu amalni bajarishni xohlaysizmi?"}
      </p>
    </Modal>
  )
}
