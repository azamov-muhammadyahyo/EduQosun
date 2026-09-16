import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import type { Option } from '../../types'
import { cn } from '../../lib/cn'

const controlBase =
  'w-full rounded-lg border bg-white text-sm text-slate-800 shadow-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:bg-slate-900/40 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-800'

const controlTone = (invalid?: boolean) =>
  invalid
    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-500/50'
    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 dark:border-slate-700'

/* ———————————— Maydon (label + xato) ———————————— */

interface FieldProps {
  label: string
  children: (id: string) => ReactNode
  error?: string
  hint?: string
  required?: boolean
  className?: string
  /** Label o'ngidagi qo'shimcha element */
  aside?: ReactNode
}

export function Field({ label, children, error, hint, required, className, aside }: FieldProps) {
  const id = useId()
  return (
    <div className={cn('min-w-0', className)}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-[13px] font-medium text-slate-700 dark:text-slate-200">
          {label}
          {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
        </label>
        {aside}
      </div>
      {children(id)}
      {error ? (
        <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  )
}

/* ———————————— Kiritish maydonlari ———————————— */

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { invalid, className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(controlBase, controlTone(invalid), 'h-10 px-3', className)}
      {...props}
    />
  )
})

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { invalid, className, rows = 3, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(controlBase, controlTone(invalid), 'resize-y px-3 py-2 leading-relaxed', className)}
      {...props}
    />
  )
})

export interface OptionGroup<T extends string> {
  label: string
  options: Option<T>[]
}

interface SelectProps<T extends string> extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value' | 'size'> {
  value: T
  onChange: (value: T) => void
  options: Option<T>[]
  /** Guruhlangan variantlar (options'dan keyin chiziladi) */
  groups?: OptionGroup<T>[]
  invalid?: boolean
  size?: 'sm' | 'md'
}

/** Uslublangan tabiiy select (klaviatura va mobil qurilmalarda ham qulay) */
export function Select<T extends string>({
  value,
  onChange,
  options,
  groups,
  invalid,
  size = 'md',
  className,
  ...props
}: SelectProps<T>) {
  return (
    <div className={cn('relative min-w-0', className)}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className={cn(
          controlBase,
          controlTone(invalid),
          'cursor-pointer appearance-none pr-9',
          size === 'sm' ? 'h-9 pl-3 text-[13px] font-medium' : 'h-10 pl-3',
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        {groups?.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
    </div>
  )
}

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'size'> {
  value: string
  onChange: (value: string) => void
  size?: 'sm' | 'md'
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, onChange, className, size = 'md', placeholder = 'Qidirish...', ...props },
  ref,
) {
  return (
    <div className={cn('relative min-w-0', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        ref={ref}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && value) {
            event.stopPropagation()
            onChange('')
          }
        }}
        className={cn(
          controlBase,
          controlTone(false),
          'pl-9 pr-8 [&::-webkit-search-cancel-button]:hidden',
          size === 'sm' ? 'h-9 text-[13px]' : 'h-10',
        )}
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
          aria-label="Qidiruvni tozalash"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
})

/* ———————————— Belgilash elementlari ———————————— */

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
  description?: string
  indeterminate?: boolean
  disabled?: boolean
  className?: string
  ariaLabel?: string
}

export function Checkbox({ checked, onChange, label, description, indeterminate, disabled, className, ariaLabel }: CheckboxProps) {
  return (
    <label className={cn('inline-flex cursor-pointer items-start gap-2.5', disabled && 'cursor-not-allowed opacity-60', className)}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        ref={(el) => {
          if (el) el.indeterminate = !!indeterminate && !checked
        }}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-blue-600 dark:border-slate-600"
      />
      {label || description ? (
        <span className="min-w-0">
          {label ? <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span> : null}
          {description ? <span className="block text-xs text-slate-500 dark:text-slate-400">{description}</span> : null}
        </span>
      ) : null}
    </label>
  )
}

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
  className?: string
}

export function Switch({ checked, onChange, label, description, disabled, className }: SwitchProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</p>
        {description ? <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:focus-visible:ring-offset-slate-800',
          checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600',
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  )
}
