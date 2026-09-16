import { useMemo, useState, type KeyboardEvent } from 'react'
import { Save, Undo2, X } from 'lucide-react'
import type { TeacherProfile } from '../../types'
import { formatPhone, isValidEmail, isValidPhone } from '../../lib/format'
import { useProfile } from '../../hooks/useData'
import { updateProfile } from '../../store/actions/account'
import { notify } from '../../store/toastStore'
import { ColorPicker } from '../forms/Pickers'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { Field, TextArea, TextInput } from '../ui/Form'
import { SettingsSection } from './SettingsSection'

type Errors = Partial<Record<keyof TeacherProfile, string>>

function validate(form: TeacherProfile): Errors {
  const errors: Errors = {}
  if (!form.firstName.trim()) errors.firstName = 'Ismni kiriting'
  if (!form.lastName.trim()) errors.lastName = 'Familiyani kiriting'
  if (!isValidPhone(form.phone)) errors.phone = "Telefon raqami noto'g'ri"
  if (form.email && !isValidEmail(form.email)) errors.email = "E-pochta manzili noto'g'ri"
  if (form.experienceYears < 0 || form.experienceYears > 60) errors.experienceYears = "Tajriba 0–60 yil oralig'ida bo'lsin"
  return errors
}

/** Shaxsiy ma'lumotlar: ism, aloqa, fanlar, avatar rangi */
export function ProfileSettings() {
  const profile = useProfile()
  const [form, setForm] = useState<TeacherProfile>(profile)
  const [subject, setSubject] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const errors = useMemo(() => validate(form), [form])
  const dirty = JSON.stringify(form) !== JSON.stringify(profile)
  const set = <K extends keyof TeacherProfile>(key: K, value: TeacherProfile[K]) => setForm((prev) => ({ ...prev, [key]: value }))

  const addSubject = () => {
    const value = subject.trim()
    if (!value || form.subjects.some((s) => s.toLowerCase() === value.toLowerCase())) {
      setSubject('')
      return
    }
    set('subjects', [...form.subjects, value])
    setSubject('')
  }

  const onSubjectKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addSubject()
    } else if (event.key === 'Backspace' && !subject && form.subjects.length > 0) {
      set('subjects', form.subjects.slice(0, -1))
    }
  }

  const save = () => {
    setSubmitted(true)
    if (Object.keys(errors).length > 0) {
      notify.error("Ma'lumotlarni tekshiring", "Qizil bilan belgilangan maydonlarni to'g'rilang.")
      return
    }
    const clean: TeacherProfile = {
      ...form,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: formatPhone(form.phone),
      email: form.email.trim(),
      bio: form.bio.trim(),
      centerName: form.centerName.trim(),
    }
    updateProfile(clean)
    setForm(clean)
    setSubmitted(false)
    notify.success('Profil saqlandi')
  }

  const error = (key: keyof TeacherProfile) => (submitted ? errors[key] : undefined)
  const name = `${form.firstName} ${form.lastName}`.trim() || "O'qituvchi"

  return (
    <SettingsSection
      title="Mening profilim"
      description="Bu ma'lumotlar o'quvchi va ota-onalarga yuboriladigan xabarlarda ko'rinadi"
      footer={
        <>
          <Button variant="ghost" icon={Undo2} disabled={!dirty} onClick={() => setForm(profile)}>
            Bekor qilish
          </Button>
          <Button icon={Save} disabled={!dirty} onClick={save}>
            Saqlash
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <Avatar name={name} color={form.color} size="2xl" variant="solid" />
        <div>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">{`${form.lastName} ${form.firstName}`.trim()}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">O'qituvchi · {form.centerName}</p>
          <p className="mb-2 mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">Avatar rangi</p>
          <ColorPicker value={form.color} onChange={(color) => set('color', color)} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Ism" required error={error('firstName')}>
          {(id) => <TextInput id={id} value={form.firstName} invalid={!!error('firstName')} onChange={(e) => set('firstName', e.target.value)} />}
        </Field>
        <Field label="Familiya" required error={error('lastName')}>
          {(id) => <TextInput id={id} value={form.lastName} invalid={!!error('lastName')} onChange={(e) => set('lastName', e.target.value)} />}
        </Field>
        <Field label="Telefon" required error={error('phone')}>
          {(id) => <TextInput id={id} type="tel" value={form.phone} invalid={!!error('phone')} onChange={(e) => set('phone', e.target.value)} />}
        </Field>
        <Field label="E-pochta" error={error('email')}>
          {(id) => <TextInput id={id} type="email" value={form.email} invalid={!!error('email')} onChange={(e) => set('email', e.target.value)} />}
        </Field>
        <Field label="O'quv markazi">
          {(id) => <TextInput id={id} value={form.centerName} onChange={(e) => set('centerName', e.target.value)} />}
        </Field>
        <Field label="Tajriba (yil)" error={error('experienceYears')}>
          {(id) => (
            <TextInput
              id={id}
              type="number"
              min={0}
              max={60}
              value={form.experienceYears}
              invalid={!!error('experienceYears')}
              onChange={(e) => set('experienceYears', Number(e.target.value) || 0)}
            />
          )}
        </Field>
        <Field label="Fanlar" className="sm:col-span-2" hint="Fan nomini yozib Enter bosing">
          {(id) => (
            <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900/40">
              {form.subjects.map((item) => (
                <span key={item} className="inline-flex items-center gap-1 rounded-md bg-blue-50 py-0.5 pl-2 pr-1 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                  {item}
                  <button
                    type="button"
                    onClick={() => set('subjects', form.subjects.filter((s) => s !== item))}
                    className="rounded p-0.5 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                    aria-label={`${item} fanini olib tashlash`}
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
              <input
                id={id}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onKeyDown={onSubjectKey}
                onBlur={addSubject}
                placeholder={form.subjects.length === 0 ? 'Masalan: JavaScript' : ''}
                className="min-w-[120px] flex-1 bg-transparent px-1 text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
              />
            </div>
          )}
        </Field>
        <Field label="O'zim haqimda" className="sm:col-span-2">
          {(id) => <TextArea id={id} rows={3} maxLength={400} value={form.bio} onChange={(e) => set('bio', e.target.value)} />}
        </Field>
      </div>
    </SettingsSection>
  )
}
