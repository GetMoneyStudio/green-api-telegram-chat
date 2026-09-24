const COLORS = ['#e17076', '#7bc862', '#65aadd', '#a695e7', '#ee7aae', '#6ec9cb', '#faa774']

export function Avatar({ name }: { name: string }) {
  const clean = name.replace(/^[@+]/, '')
  const hash = [...clean].reduce((a, ch) => a + ch.charCodeAt(0), 0)
  return (
    <span className="avatar" style={{ background: COLORS[hash % COLORS.length] }} aria-hidden>
      {clean.slice(0, 1).toUpperCase() || '?'}
    </span>
  )
}
