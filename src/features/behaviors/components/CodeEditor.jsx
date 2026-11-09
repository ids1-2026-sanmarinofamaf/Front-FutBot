import Editor from '@monaco-editor/react';

export function CodeEditor({ value, onChange, readOnly = false }) {
  return (
    <Editor
      height="60vh"
      language="python"
      theme="vs-dark"
      value={value}
      onChange={(newValue) => onChange && onChange(newValue ?? '')}
      options={{
        readOnly: readOnly,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
      }}
    />
  );
}
