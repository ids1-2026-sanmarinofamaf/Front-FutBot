const URL_AVATARS = "/assets/defaultAvatars/";
const AVATAR_STYLENAME = "";
const AVATARS_COUNT = 6;

/**
 * Obtiene el avatar para un usuario cargando el recibido o, si es default, se elige uno para el mismo
 * @param avatar: string en base64 del avatar o string "default"
 * @param name: nombre del usuario
 * @param clubId: ID del club 
 * @returns avatar del usuario
 */
export function Avatar({ avatar, name, clubId }) {
  const isDefault = !avatar || avatar === "default";
  const index = (clubId % AVATARS_COUNT) + 1; // 1..200

  const src = isDefault
    ? `${URL_AVATARS}${AVATAR_STYLENAME}${index}.png`//DEFAULT_AVATARS[clubId % DEFAULT_AVATARS.length]
    : `data:image/png;base64,${avatar}`;

  return (
    <img
      src={src}
      alt={name}
      className="w-12 h-12 rounded-full object-cover border border-slate-600"
    />
  );
}