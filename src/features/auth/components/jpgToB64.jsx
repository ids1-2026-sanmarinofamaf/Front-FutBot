import { useState } from "react";

const MAX_BYTES = 1024 * 1024; // 1 MB

export default function JpgInput({ id, onChange }) {
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // `accept` es solo una ayuda del selector; hay que validar igual
        if (file.type !== "image/jpeg") {
            setError("Solo se permiten archivos JPG");
            e.target.value = "";
            onChange(null);
            return;
        }
        if (file.size > MAX_BYTES) {
            setError("La imagen supera 1 MB");
            e.target.value = "";
            onChange(null);
            return;
        }

        const reader = new FileReader();
        reader.onload = () => onChange(reader.result.split(",")[1]); // sin "data:image/jpeg;base64,"
        reader.onerror = () => setError("No se pudo leer el archivo");
        reader.readAsDataURL(file);
        setError("");
    };

    return (
        <div className="min-w-0">
            <input
                type="file"
                accept="image/jpeg"
                id={id}
                className="w-full border-2 py-2 px-3 rounded-md text-base text-slate-200"
                onChange={handleChange}
            />
            {error && <p className="text-orange-400 text-xl mt-1">{error}</p>}
        </div>
    );
}