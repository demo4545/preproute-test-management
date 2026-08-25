import { useCallback, useMemo, useRef } from 'react'
import ReactQuill from 'react-quill-new'
import type ReactQuillType from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { IconTrash } from '../icons/Icons'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onClear?: () => void
}

const TOOLBAR = [
  ['italic', 'bold', 'underline', 'strike'],
  ['link', { color: [] }],
  [{ align: '' }, { align: 'center' }, { align: 'right' }],
  [{ list: 'bullet' }],
  ['image'],
]

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Type here',
  onClear,
}: RichTextEditorProps) {
  const quillRef = useRef<ReactQuillType | null>(null)

  const insertImage = useCallback((src: string) => {
    const quill = quillRef.current?.getEditor()
    if (!quill || !src) return
    const range = quill.getSelection(true)
    const index = range?.index ?? quill.getLength()
    quill.insertEmbed(index, 'image', src)
    quill.setSelection(index + 1)
  }, [])

  const imageHandler = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') insertImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }, [insertImage])

  const modules = useMemo(
    () => ({
      toolbar: {
        container: TOOLBAR,
        handlers: { image: imageHandler },
      },
    }),
    [imageHandler]
  )

  return (
    <div className="rich-text-editor">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
      />
      {onClear ? (
        <button
          type="button"
          className="rich-text-editor-clear"
          onClick={onClear}
          aria-label="Clear content"
        >
          <IconTrash />
        </button>
      ) : null}
    </div>
  )
}
