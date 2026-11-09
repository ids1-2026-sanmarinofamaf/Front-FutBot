/** Renderiza el avatar en base64 recibido de la API. */
export function Avatar({ avatar, name, className = "w-12 h-12" }) {
  return (
    <img
      src={avatar ? `data:image/png;base64,${avatar}` : undefined}
      alt={name}
      className={`${className} rounded-full object-cover border border-slate-600`}
    />
  );
}
