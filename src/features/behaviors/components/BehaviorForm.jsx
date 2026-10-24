import { useState } from 'react';
import { CodeEditor } from './CodeEditor';

const DEFAULT_CODE = 'def play():\n    return wait()\n';

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
    <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl flex flex-col gap-6">
        <div>
            <label htmlFor="behavior-name" className="block text-sm font-medium text-slate-300 mb-2">
                Nombre
            </label>
            <input
                id="behavior-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-slate-200 focus:outline-none focus:border-blue-500"
            />
        </div>

        <CodeEditor value={code} onChange={setCode} readOnly={isSubmitting} />

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded transition-colors disabled:opacity-50"
            >
                Cancelar
            </button>
            <button
                type="submit"
                disabled={!isFormValid}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:text-slate-400 text-white font-medium rounded shadow-sm transition-colors"
            >
                {isSubmitting ? 'Guardando...' : submitLabel}
            </button>
        </div>
    </form>
    );
}