import { useEffect, useRef, useCallback, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Image } from '@tiptap/extension-image'
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  ImagePlus,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '../ui/Button'
import {
  PX_TO_PT_RATIO,
  IMAGE_MAX_WIDTH_PT,
  IMAGE_MAX_HEIGHT_PT,
} from '../../modules/pdfGenerator/constants'

// A pasted image counts as "low resolution" when BOTH its natural width
// and its natural height (converted to pt) fall under these fractions of
// the maximum block size used in the PDF — i.e. it would only fill a small
// part of a Section 2 block even at native size.
const LOW_RES_WIDTH_FRACTION = 0.25
const LOW_RES_HEIGHT_FRACTION = 0.5

interface Props {
  initialContent: string
  onSave: (content: string) => void
  onClose: () => void
}

const BTN = 'p-1.5 rounded transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default'
const BTN_IDLE = 'text-text-secondary hover:bg-bg-primary/60'
const BTN_ACTIVE = 'bg-accent/20 text-accent'

const EDITOR_CLASS =
  'outline-none min-h-[180px] text-text-primary text-sm leading-relaxed ' +
  '[&_strong]:font-bold [&_em]:italic [&_p]:mb-2 [&_p:last-child]:mb-0 ' +
  '[&_img]:max-w-full [&_img]:rounded-md [&_img]:my-2 ' +
  '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-3 [&_h1]:mb-2 ' +
  '[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-2 ' +
  '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-2 ' +
  '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-2 ' +
  '[&_li]:mb-1 ' +
  '[&_blockquote]:border-l-4 [&_blockquote]:border-accent/40 [&_blockquote]:pl-4 ' +
  '[&_blockquote]:italic [&_blockquote]:text-text-secondary [&_blockquote]:my-2 ' +
  '[&_code]:bg-bg-primary/60 [&_code]:px-1 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono ' +
  '[&_pre]:bg-bg-primary/60 [&_pre]:p-2 [&_pre]:rounded [&_pre]:my-2 [&_pre]:overflow-x-auto ' +
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0'

function insertImage(
  editor: Editor,
  file: File,
  onWarn: (msg: string | null) => void
): void {
  if (!file.type.startsWith('image/')) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const src = e.target?.result
    if (typeof src !== 'string') return
    const probe = new window.Image()
    probe.onload = () => {
      const widthPx = probe.naturalWidth
      const heightPx = probe.naturalHeight
      const widthPt = widthPx * PX_TO_PT_RATIO
      const heightPt = heightPx * PX_TO_PT_RATIO
      const lowRes =
        widthPt < IMAGE_MAX_WIDTH_PT * LOW_RES_WIDTH_FRACTION &&
        heightPt < IMAGE_MAX_HEIGHT_PT * LOW_RES_HEIGHT_FRACTION
      onWarn(
        lowRes
          ? `Low-resolution image (${widthPx}×${heightPx} px) — may be hard to read in the exported PDF.`
          : null
      )
      editor.chain().focus().setImage({ src }).run()
    }
    probe.onerror = () => {
      onWarn(null)
      editor.chain().focus().setImage({ src }).run()
    }
    probe.src = src
  }
  reader.readAsDataURL(file)
}

export function ResultEditorModal({ initialContent, onSave, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<Editor | null>(null)
  const [imageWarning, setImageWarning] = useState<string | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false }),
    ],
    content: initialContent ? JSON.parse(initialContent) : undefined,
    onCreate({ editor: e }) { editorRef.current = e },
    onDestroy() { editorRef.current = null },
    editorProps: {
      attributes: { class: EDITOR_CLASS },
      handlePaste(_view, event) {
        const items = event.clipboardData?.items
        if (!items) return false
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault()
            const file = item.getAsFile()
            if (file && editorRef.current) {
              insertImage(editorRef.current, file, setImageWarning)
            }
            return true
          }
        }
        return false
      },
      handleDrop(_view, event) {
        const files = event.dataTransfer?.files
        if (!files?.length) return false
        for (const file of Array.from(files)) {
          if (file.type.startsWith('image/')) {
            event.preventDefault()
            if (editorRef.current) {
              insertImage(editorRef.current, file, setImageWarning)
            }
            return true
          }
        }
        return false
      },
    },
  })

  const handleSave = useCallback(() => {
    if (!editor) return
    onSave(JSON.stringify(editor.getJSON()))
  }, [editor, onSave])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="flex flex-col w-[700px] max-h-[80vh] bg-bg-secondary border border-border rounded-xl shadow-2xl">

        {/* Toolbar */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-border shrink-0">
          <button
            type="button"
            title="Bold"
            disabled={!editor?.can().chain().focus().toggleBold().run()}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`${BTN} ${editor?.isActive('bold') ? BTN_ACTIVE : BTN_IDLE}`}
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            title="Italic"
            disabled={!editor?.can().chain().focus().toggleItalic().run()}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`${BTN} ${editor?.isActive('italic') ? BTN_ACTIVE : BTN_IDLE}`}
          >
            <Italic size={14} />
          </button>
          <div className="w-px h-4 bg-border mx-1 shrink-0" />
          <button
            type="button"
            title="Heading 1"
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`${BTN} ${editor?.isActive('heading', { level: 1 }) ? BTN_ACTIVE : BTN_IDLE}`}
          >
            <Heading1 size={14} />
          </button>
          <button
            type="button"
            title="Heading 2"
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`${BTN} ${editor?.isActive('heading', { level: 2 }) ? BTN_ACTIVE : BTN_IDLE}`}
          >
            <Heading2 size={14} />
          </button>
          <button
            type="button"
            title="Bullet list"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={`${BTN} ${editor?.isActive('bulletList') ? BTN_ACTIVE : BTN_IDLE}`}
          >
            <List size={14} />
          </button>
          <button
            type="button"
            title="Ordered list"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={`${BTN} ${editor?.isActive('orderedList') ? BTN_ACTIVE : BTN_IDLE}`}
          >
            <ListOrdered size={14} />
          </button>
          <button
            type="button"
            title="Blockquote"
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            className={`${BTN} ${editor?.isActive('blockquote') ? BTN_ACTIVE : BTN_IDLE}`}
          >
            <Quote size={14} />
          </button>
          <button
            type="button"
            title="Code block"
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            className={`${BTN} ${editor?.isActive('codeBlock') ? BTN_ACTIVE : BTN_IDLE}`}
          >
            <Code size={14} />
          </button>
          <div className="w-px h-4 bg-border mx-1 shrink-0" />
          <button
            type="button"
            title="Dodaj obraz"
            onClick={() => fileRef.current?.click()}
            className={`${BTN} ${BTN_IDLE}`}
          >
            <ImagePlus size={14} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file && editor) insertImage(editor, file, setImageWarning)
              e.target.value = ''
            }}
          />
        </div>

        {/* Low-resolution image warning */}
        {imageWarning && (
          <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/10 border-b border-amber-500/30 text-amber-200 text-xs shrink-0">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span className="flex-1">{imageWarning}</span>
            <button
              type="button"
              onClick={() => setImageWarning(null)}
              className="text-amber-300/70 hover:text-amber-200 leading-none px-1"
              aria-label="Dismiss warning"
            >
              ×
            </button>
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 overflow-y-auto p-4">
          <EditorContent editor={editor} />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border shrink-0">
          <Button variant="ghost" size="sm" onClick={onClose}>Anuluj</Button>
          <Button variant="primary" size="sm" onClick={handleSave}>Zapisz</Button>
        </div>
      </div>
    </div>
  )
}
