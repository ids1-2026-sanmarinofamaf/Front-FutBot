import { useState } from 'react';
import { ClubEditModal } from './ClubEditModal';

export function EditClubNameModal({ name, onSave, onCancel, saving }) {
  const [value, setValue] = useState(name);
  const newName = value.trim();

  const error = newName.length < 3 || newName.length > 30
  ? 'El nombre debe tener entre 3 y 30 caracteres'
  : (!/^[\p{L} ]+$/u.test(newName)
    ? 'El nombre solo puede contener letras y espacios'
    : '');
    
  return (
    <ClubEditModal title="Editar nombre del club" saving={saving} canSave={!error && newName !== name.trim()}
      onSave={() => onSave({ new_name: newName })} onCancel={onCancel}>
      <div>
        <label htmlFor="club-name">Nombre del club</label>
        <input id="club-name" value={value} onChange={(event) => setValue(event.target.value)} disabled={saving}
          className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-900 p-3" />
        {error && <p className="mt-2 text-red-400">{error}</p>}
      </div>
    </ClubEditModal>
  );
}
