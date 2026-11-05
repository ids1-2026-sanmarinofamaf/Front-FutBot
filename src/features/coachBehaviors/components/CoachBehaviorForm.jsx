import { useState } from 'react';
import { CodeEditor } from '../../behaviors/components/CodeEditor';
import { CoachApiDocs } from './CoachApiDocs';

const DEFAULT_CODE = 'def coach():\n    return []\n';

/**
 * Formulario controlado para crear un comportamiento de Director Técnico (DT).
 * Incluye campo de nombre, editor de código Python y acceso al manual de la API de DT.
 *
 * @param {Object} props
 * @param {string} [props.initialName=''] - Valor inicial para el nombre del DT.
 * @param {string} [props.initialCode=DEFAULT_CODE] - Código Python inicial en el editor.
 * @param {(data: { name: string, code: string }) => void} props.onSubmit - Callback al enviar el formulario.
 * @param {() => void} props.onCancel - Callback al cancelar la edición/creación.
 * @param {boolean} [props.isSubmitting=false] - Deshabilita controles mientras se guarda en el servidor.
 * @param {string} [props.submitLabel='Crear'] - Texto del botón de confirmación.
 */
export function CoachBehaviorForm({
  initialName = '',
  initialCode = DEFAULT_CODE,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Crear',
}) {
  const [name, setName] = useState(initialName);
  const [code, setCode] = useState(initialCode);
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  const isFormValid = name.trim() !== '' && code.trim() !== '' && !isSubmitting;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name: name.trim(), code });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl flex flex-col gap-6"
    >
      <div>
        <label
          htmlFor="coach-behavior-name"
          className="block text-sm font-medium text-slate-300 mb-2"
        >
          Nombre
        </label>
        <input
          id="coach-behavior-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
          className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-slate-200 focus:outline-none focus:border-blue-500"
        />
      </div>

      <CodeEditor value={code} onChange={setCode} readOnly={isSubmitting} />

      <div className="flex justify-between items-center gap-3 pt-4 border-t border-slate-700">
        <button
          type="button"
          onClick={() => setIsDocsOpen(true)}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded transition-colors"
        >
          Manual de comportamientos de DT
        </button>
        <div className="flex gap-3">
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
      </div>

      <CoachApiDocs isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
    </form>
  );
}

