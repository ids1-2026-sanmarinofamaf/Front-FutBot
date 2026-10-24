import { useState } from 'react';
import { CodeEditor } from './CodeEditor';

const DEFAULT_CODE = 'def play():\n     return wait()\n';

export function BehaviorForm({
    initialName = '',
    initialCode = DEFAULT_CODE,
    onSubmit,
    onCancel,
    isSubmitting = false,
    submitLabel = 'Save',
}) {
    const [name, setName] = useState(initialName);
    const [code, setCode] = useState(initialCode);

    const isFormValid = name.trim() !== '' && code.trim() !== '' && !isSubmitting;
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ name: name.trim(), code: code});
    };
    
    return (
    <form onSubmit={handleSubmit}>
        <label htmlFor="behavior-name">Nombre</label>
        <input
            id="behavior-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
        />

        <CodeEditor value={code} onChange={setCode} readOnly= {isSubmitting}/>

        <button type="button" onClick={onCancel} disabled={isSubmitting}>
        Cancelar   
        </button>
        <button type="submit" disabled={!isFormValid}>
            {isSubmitting ? 'Guardando...' : submitLabel}    
        </button>
    </form>
    );
}