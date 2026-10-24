import { useNavigate, useParams } from "react-router-dom"
import { useBehavior } from "../useBehavior.js"
import { useState } from "react";
import { updateBehavior } from "../api";
import { BehaviorForm } from "../components/BehaviorForm.jsx";
export function EditBehavior() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { behavior, isLoading, error } = useBehavior(id);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState(null); 

    const handleUpdate = async (data) => {
        try {
            setIsSubmitting(true);
            setServerError(null);
            await updateBehavior(id, data);
            navigate(`/club/behaviors/${id}`);
        } catch (err) {
            setServerError(err.message || 'No se pudo guardar el comportamiento.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <p>Cargando comportamiento</p>;
    if (error) return <p>{error}</p>;


    return(
        <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-6">Editar comportamiento</h2>
        {serverError && <p className="mb-4 text-red-400">{serverError}</p>}
        <BehaviorForm
            initialName={behavior.name}
            initialCode={behavior.code}
            onSubmit={handleUpdate}
            onCancel={() => navigate(`/club/behaviors/${id}`)}
            isSubmitting={isSubmitting}
            submitLabel="Guardar cambios"
        />
        </div>
    );
}