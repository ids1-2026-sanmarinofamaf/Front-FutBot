import { useState } from "react";

const MAX_BYTES = 1024 * 1024; // 1 MB

export default function JpgInput({ id, onChange, onError}) {
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // `accept` es solo una ayuda del selector; hay que validar igual
        if (file.type !== "image/jpeg") {
            const message ="Solo se permiten archivos JPG"
            setError(message);
            onError?.(message);
            e.target.value = "";
            onChange(null);
            return;
        }
        if (file.size > MAX_BYTES) {
            const message = "La imagen supera 1 MB";
            setError(message);
            onError?.(message);
            e.target.value = "";
            onChange(null);
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setError("");
            onChange(reader.result.split(",")[1]); // sin "data:image/jpeg;base64,"
        }
        reader.onerror = () => {
            const message = "No se pudo leer el archivo"
            setError(message);
            onError?.(message)
        }

        reader.readAsDataURL(file);
        //setError("");
    };

    return (
        <div className="min-w-0">
            <input
                type="file"
                accept="image/jpeg"
                id={id}
                className="w-full border-2 py-2 px-3 rounded-md text-base text-emerald-400"
                onChange={handleChange}
            />
            {/** {error && <p className="text-orange-400 text-xl mt-1">{error}</p>} */}
        </div>
    );
}