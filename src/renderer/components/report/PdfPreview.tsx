import { useState } from 'react'
import { Button } from '../ui/Button'
import { useReportStore } from '../../store/reportStore'
import { buildDocDefinition } from '../../modules/pdfGenerator/reportTemplate'
import { createPdfBase64 } from '../../modules/pdfGenerator/pdfGenerator'

type Status =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'success'; path: string }
  | { type: 'error'; message: string }

export function PdfPreview() {
  const [status, setStatus] = useState<Status>({ type: 'idle' })
  const meta = useReportStore(state => state.meta)
  const changes = useReportStore(state => state.changes)

  async function handleGeneratePdf() {
    if (changes.length === 0) {
      setStatus({ type: 'error', message: 'No changes to export — parse scope first.' })
      return
    }

    setStatus({ type: 'loading' })

    try {
      const pdfBase64 = await createPdfBase64(buildDocDefinition({ meta, changes }))
      const depNum = `R_01.00.${(meta.deploymentSuffix || 'XX').padStart(2, '0')}.00`
      const defaultFilename = `${depNum}_report.pdf`

      if (!window.electronAPI) {
        setStatus({ type: 'error', message: 'PDF save requires the desktop app.' })
        return
      }

      const result = await window.electronAPI.pdf.generateReport(pdfBase64, defaultFilename)

      if (!result.success) {
        setStatus({ type: 'error', message: result.error ?? 'Unknown error' })
        return
      }

      if (result.data?.path) {
        setStatus({ type: 'success', path: result.data.path })
      } else {
        setStatus({ type: 'idle' })
      }
    } catch (err) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'PDF generation failed'
      })
    }
  }

  return (
    <div className="mt-4 flex items-center gap-4">
      <Button onClick={handleGeneratePdf} disabled={status.type === 'loading'}>
        {status.type === 'loading' ? 'Generating…' : 'Generate report PDF'}
      </Button>

      {status.type === 'success' && (
        <span className="text-sm text-green-400">✓ Saved: {status.path}</span>
      )}
      {status.type === 'error' && (
        <span className="text-sm text-status-danger">{status.message}</span>
      )}
    </div>
  )
}
