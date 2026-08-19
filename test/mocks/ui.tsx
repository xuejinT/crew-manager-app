import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from 'react'

export function Badge({ children, ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: string }) {
  const { variant: _variant, ...spanProps } = props
  return <span {...spanProps}>{children}</span>
}

export function Btn(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} />
}

export function SendBtn(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} />
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} />
}

export function SearchInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="search" {...props} />
}

export function ContentSkeleton({ rows = 1 }: { rows?: number }) {
  return <div aria-label="Loading">{rows}</div>
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon?: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return <div>{icon}<h2>{title}</h2>{subtitle && <p>{subtitle}</p>}{action}</div>
}

export function PageHeader({ title, subtitle }: { title: React.ReactNode; subtitle?: string }) {
  return <header><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</header>
}
