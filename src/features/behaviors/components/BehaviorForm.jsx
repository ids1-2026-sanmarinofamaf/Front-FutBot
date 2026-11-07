import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CodeEditor } from './CodeEditor';
import { BehaviorApiDocs } from './BehaviorApiDocs';
import { validateBehaviorCode, getBehaviors, createBehaviorPreview } from '../api';

const DEFAULT_CODE = 'def play():\n    return wait()\n';

export function BehaviorForm({
    initialName = '',
    initialCode = DEFAULT_CODE,
    onSubmit,
    onCancel,
    isSubmitting = false,
    submitLabel = 'Save',
}) {
    const navigate = useNavigate();
    const location = useLocation();

    const [name, setName] = useState(initialName);
    const [code, setCode] = useState(initialCode);
    const [isValidating, setIsValidating] = useState(false);
    const [validationStatus, setValidationStatus] = useState(null);
    const [isDocsOpen, setIsDocsOpen] = useState(false);

    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [defaultBehaviors, setDefaultBehaviors] = useState([]);
    const [teammate1, setTeammate1] = useState('');
    const [teammate2, setTeammate2] = useState('');
    const [previewError, setPreviewError] = useState(null);
    const [isStartingPreview, setIsStartingPreview] = useState(false);
    
    const isFormValid = name.trim() !== '' && code.trim() !== '' && !isSubmitting;
    const canValidate = code.trim() !== '' && !isSubmitting && !isValidating;

    const handleCodeChange = (newCode) => {
        setCode(newCode);
        if (validationStatus) {
            setValidationStatus(null);
        }
    };

    const handleValidate = async () => {
        try {
            setIsValidating(true);
            setValidationStatus(null);
            await validateBehaviorCode(code);
            setValidationStatus({
                type: 'success',
                message: 'El código es válido.',
            });
        } catch (err) {
            setValidationStatus({
                type: 'error',
                message: err.message || 'El código no es válido.',
            });
        } finally {
            setIsValidating(false);
        }
    };

    const handleOpenPreview = async () => {
        setIsPreviewOpen(true);
        setTeammate1('');
        setTeammate2('');
        setPreviewError(null);

        try {
            const data = await getBehaviors();
            const list = Array.isArray(data) ? data : data?.behaviors_list || [];
            setDefaultBehaviors(list.filter((b) => b.is_default));
        } catch (err) {
            setPreviewError(err.message || 'Error al cargar los comportamientos por defecto.');
        }
    };

    const handleStartPreview = async () => {
        try {
            setIsStartingPreview(true);
            setPreviewError(null);
            const result = await createBehaviorPreview({
                code,
                behavior_teammate_1: Number(teammate1),
                behavior_teammate_2: Number(teammate2),
            });
            setIsPreviewOpen(false);
            navigate(`/club/behaviors/preview/${result.preview_id}`, {
                state: {
                    returnPath: location?.pathname || '/club/behaviors',
                    draftName: name,
                    draftCode: code,
                },
            });
        } catch (err) {
            setPreviewError(err.message || 'No se pudo iniciar la prueba.');
        } finally {
            setIsStartingPreview(false);
        }
    };

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
        
        <CodeEditor value={code} onChange={handleCodeChange} readOnly={isSubmitting} />
        {validationStatus && (
            <p className={`text-sm font-medium ${validationStatus.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                {validationStatus.message}
            </p>
        )}
        <div className="flex justify-between items-center gap-3 pt-4 border-t border-slate-700">
            <button
                type="button"
                onClick={() => setIsDocsOpen(true)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded transition-colors"
            >
                Manual de comportamientos
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
                    type="button"
                    onClick={handleOpenPreview}
                    disabled={!canValidate}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:text-slate-400 text-white font-medium rounded transition-colors"
                >
                    Probar código
                </button>
                <button
                    type="button"
                    onClick={handleValidate}
                    disabled={!canValidate}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:text-slate-400 text-white font-medium rounded transition-colors"
                >
                    {isValidating ? 'Validando...' : 'Validar código'}
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
        <BehaviorApiDocs isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />

        {isPreviewOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
                <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-slate-100">
                        Configurar prueba de comportamiento
                    </h3>
                    <p className="text-sm text-slate-300">
                        Seleccioná los comportamientos por defecto para tus dos compañeros de equipo:
                    </p>

                    <div>
                        <label htmlFor="teammate-1" className="block text-sm font-medium text-slate-300 mb-1">
                            Compañero 1
                        </label>
                        <select
                            id="teammate-1"
                            value={teammate1}
                            onChange={(e) => setTeammate1(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200"
                        >
                            <option value="">Seleccionar comportamiento...</option>
                            {defaultBehaviors.map((b) => (
                                <option key={b.behavior_id} value={b.behavior_id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="teammate-2" className="block text-sm font-medium text-slate-300 mb-1">
                            Compañero 2
                        </label>
                        <select
                            id="teammate-2"
                            value={teammate2}
                            onChange={(e) => setTeammate2(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200"
                        >
                            <option value="">Seleccionar comportamiento...</option>
                            {defaultBehaviors.map((b) => (
                                <option key={b.behavior_id} value={b.behavior_id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {previewError && (
                        <p className="text-sm text-red-400">{previewError}</p>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsPreviewOpen(false)}
                            disabled={isStartingPreview}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
                        >
                            Cerrar
                        </button>
                        <button
                            type="button"
                            onClick={handleStartPreview}
                            disabled={!teammate1 || !teammate2 || isStartingPreview}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:text-slate-400 text-white font-medium rounded transition-colors"
                        >
                            {isStartingPreview ? 'Iniciando...' : 'Iniciar prueba'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </form>
    );
}