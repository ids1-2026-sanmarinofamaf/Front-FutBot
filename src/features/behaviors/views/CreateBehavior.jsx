import { use, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBehavior } from "../api";
import { BehaviorForm } from "../components/BehaviorForm";

export function CreateBehavior() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState(null);

    const handleCreate = async (data) => {
        try{
            setIsSubmitting(true);
            setServerError(null);
            await createBehavior(data);
            navigate('club/behaviors');
        } catch (err) {
            setServerError(err.message || 'No se pudo crear el comportamiento.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h2>Nuevo comportamiento</h2>
            {serverError && <p>{serverError}</p>}
            <BehaviorForm
                onSubmit={handleCreate}
                onCancel={() => navigate('/club/bheaviors')}
                isSubmitting={isSubmitting}
                submitLabel="Crear"
            />
        </div>
    );
}