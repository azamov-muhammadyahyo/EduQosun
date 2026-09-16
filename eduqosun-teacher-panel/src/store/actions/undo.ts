import { getAppState } from '../appStore'
import { notify, toast } from '../toastStore'
import { restoreSnapshot } from './account'

/**
 * O'chirish kabi amallarni "Qaytarish" imkoniyati bilan bajaradi.
 * Amaldan oldingi holat nusxasi saqlanadi va bildirishnomadagi tugma uni tiklaydi.
 */
export function runWithUndo(title: string, run: () => void, description?: string): void {
  const snapshot = getAppState()
  run()
  toast({
    tone: 'success',
    title,
    description,
    actionLabel: 'Qaytarish',
    onAction: () => {
      restoreSnapshot(snapshot)
      notify.info('Amal bekor qilindi', "Ma'lumotlar avvalgi holatiga qaytarildi.")
    },
  })
}
