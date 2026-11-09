import { useState } from 'react';
import { Avatar } from '../../../shared/components/Avatar';
import JpgInput from '../../auth/components/JpgToB64';
import { ClubEditModal } from './ClubEditModal';

export function EditClubAvatarModal({ club, onSave, onCancel, saving }) {
  const [newAvatar, setNewAvatar] = useState(null);
  const [error, setError] = useState('');

  return (
    <ClubEditModal 
      title="Editar avatar del club" 
      saving={saving} 
      canSave={Boolean(newAvatar)}
      onSave={() => onSave({ new_avatar: newAvatar })} onCancel={onCancel}
    >
      
    {/* Vista previa */}
    <Avatar avatar={newAvatar || club.club_avatar} name={club.club_name} className="w-28 h-28" />

    <div className="[&_input]:text-[1.75rem] [&_input]:leading-[2.125rem]">

      <label htmlFor="club-avatar">
        Nueva imagen JPG/JPEG (hasta 1 MB)
      </label>

      <JpgInput 
        id="club-avatar" 
        disabled={saving} 
        onError={setError}
        onChange={(value) => { setNewAvatar(value); if (value) setError(''); }} 
      />

      {error && <p className="mt-2 text-[1.5rem] leading-[1.875rem] text-red-400">{error}</p>}
      
    </div>

    </ClubEditModal>
  );
}
