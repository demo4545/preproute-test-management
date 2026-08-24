import { useMemo } from 'react'
import ReactQuill from 'react-quill-new'
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
  const modules = useMemo(
    () => ({
      toolbar: TOOLBAR,
    }),
    []
  )

  return (
    <div className="rich-text-editor">
      <ReactQuill
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
