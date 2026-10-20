import { useState } from 'react';
export function BehaviorForm({
    initialName,
    initialCode,
    onSubmit,
    onCancel,
    isSubmitting,
    submitLabel}) {
    const [formData, setFormData] = useState({
        name: initialName || "", code: initialCode || ""
    });
    return
    <div>
        <p>hola</p>
    </div>
}