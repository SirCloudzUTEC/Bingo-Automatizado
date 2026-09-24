
export function PatternPreview({ mask, onToggle, size = 'sm' }: { mask: boolean[]; onToggle?: (i: number) => void; size?: 'sm' | 'lg' }) {
  return (
    <div className={`grid grid-cols-5 ${size === 'lg' ? 'gap-1.5' : 'gap-0.5'}`}>
      {mask.map((on, i) => {
        const cls = `aspect-square rounded-[25%] transition ${on ? 'bg-brand' : 'bg-line'}`
        return onToggle ? (
          <button key={i} type="button" aria-pressed={on} aria-label={`Celda ${i + 1}`} onClick={() => onToggle(i)} className={`${cls} active:scale-90`} />
        ) : (
          <div key={i} className={cls} />
        )
      })}
    </div>
  )
}
