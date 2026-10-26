import { useState, useEffect } from "react";
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
export function Avatar({ avatar, name, clubId = 0 }) {
  const [failed, setFailed] = useState(false);

  // Si cambia el avatar, se reintenta
  useEffect(() => setFailed(false), [avatar]);

  const isDefault = !avatar || avatar === "default";
  const index = (clubId % AVATARS_COUNT) + 1;
  const defaultSrc = `${URL_AVATARS}${AVATAR_STYLENAME}${index}.png`;

  const src = isDefault || failed
    ? defaultSrc
    : `data:image/png;base64,${avatar}`;

  return (
    <img
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      className="w-12 h-12 rounded-full object-cover border border-slate-600"
    />
  );
}