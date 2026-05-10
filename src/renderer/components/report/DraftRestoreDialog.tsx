import { Button } from '../ui/Button'

interface Props {
  savedAt: string
  onLoad: () => void
  onDiscard: () => void
}

function formatSavedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export function DraftRestoreDialog({ savedAt, onLoad, onDiscard }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-[400px] bg-bg-secondary border border-border rounded-xl shadow-2xl p-6">
        <h2 className="text-text-primary font-semibold text-base mb-2">Draft detected</h2>
        <p className="text-text-secondary text-sm mb-1">
          An unsaved draft was found from a previous session.
        </p>
        <p className="text-text-muted text-xs mb-6">Saved: {formatSavedAt(savedAt)}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onDiscard}>Discard</Button>
          <Button variant="primary" size="sm" onClick={onLoad}>Load draft</Button>
        </div>
      </div>
    </div>
  )
}
