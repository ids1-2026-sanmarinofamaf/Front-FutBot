import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayOption } from '../components/PlayOption';
// Se asume la existencia del recurso estático en la capa compartida
import defaultAvatar from '../../../shared/assets/default-avatar.png';

export function MainMenu() {
  const [isPlayOptionOpen, setIsPlayOptionOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full flex flex-col gap-6">
        <h1 className="text-4xl font-extrabold text-slate-100 text-center mb-8">
          FUTBOT
        </h1>

        <button 
          onClick={() => navigate('/club')}
          className="w-full flex items-center gap-4 p-4 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-500 rounded-xl transition-all shadow-md group text-left"
        >
          <div className="w-16 h-16 bg-slate-900 rounded border border-slate-600 overflow-hidden flex-shrink-0">
            <img 
              src={defaultAvatar} 
              alt="Avatar del Club" 
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
          </div>
          <span className="text-xl font-bold text-slate-200">
            Mi Club
          </span>
        </button>

        <button 
          onClick={() => setIsPlayOptionOpen(true)}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold rounded-xl transition-colors shadow-lg"
        >
          JUGAR
        </button>
      </div>

      {isPlayOptionOpen && (
        <PlayOption onClose={() => setIsPlayOptionOpen(false)} />
      )}
    </div>
  );
}