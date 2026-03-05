import MDEditor, { commands } from '@uiw/react-md-editor';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

const cancelButton = {
  marginRight: "10px",
  cursor: "pointer"
}

// Markdown editor component
const TextEditor = (props: {
  placeholder?: string,
  handleSubmit: (comment: String) => void,
  isReplying?: boolean | false,
  setIsReplying?: Dispatch<SetStateAction<boolean>>
  editorText?: string
}) => {

  const [editorText, setEditorText] = useState("")

  useEffect(() => {
    if (props.editorText) {
      setEditorText(props.editorText);
    }
  }, [props.editorText])

  const handleChange = (value: string) => {
    setEditorText(value)
  }

  return(
    <div
      className="card"
      style={{
        padding: "20px",
        marginBottom: "10px"
      }}
    >
      <MDEditor value={editorText} onChange={(value) => { handleChange(value || "")}}
        data-color-mode="dark"
        hideToolbar={false}
        preview="edit"
        visibleDragbar={false}
        textareaProps={{
          placeholder: props.placeholder
        }}
        enableScroll={props.setIsReplying ? false : true}
        height={props.setIsReplying ? 100 : 200}
        style={{
          marginBottom: "10px",
        }}
        commands={
          [
            commands.bold,
            commands.italic,
            commands.link,
            commands.image,
            commands.group(
              [
                commands.title1,
                commands.title2,
                commands.title3,
                commands.title4,
                commands.title5,
                commands.title6
              ],
              {
                name: "title",
                groupName: "title",
                buttonProps: { "aria-label": "Insert title" }
              }
            ),
            
          ]}
      />
        <div>
          {
            props.isReplying && 
            <span
            style={cancelButton}
              onClick={() => props.setIsReplying ? props.setIsReplying(!props.isReplying) : null}
            >
              Cancel
            </span>
          }
          <button
            type="button"
            className="btn btn-primary align-self-start"
            onClick={() => {
              props.handleSubmit(editorText);
              setEditorText("");
            }}
          >
            Submit
          </button>
        </div>
    </div>
  )
}

export default TextEditor