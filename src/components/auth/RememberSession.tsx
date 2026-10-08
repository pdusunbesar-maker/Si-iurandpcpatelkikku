import React from 'react';
import { UserRole } from '../../types';

interface RememberSessionProps {
  remember: boolean;
  onRememberChange: (checked: boolean) => void;
  activeRole: UserRole;
  disabled?: boolean;
}

export const RememberSession: React.FC<RememberSessionProps> = ({
  remember,
  onRememberChange,
  activeRole,
  disabled = false,
}) => {
  return (
    <div className="flex items-center justify-between pt-0.5 select-none">
      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={remember}
          disabled={disabled}
          onChange={(e) => onRememberChange(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 text-[#00664F] accent-[#00664F] focus:ring-[#00664F] cursor-pointer"
        />
        <span className="text-xs sm:text-sm font-medium text-slate-700">
          Ingat Sesi Saya
        </span>
      </label>

      <span className="text-xs font-medium text-[#42536B]/80">
        {activeRole === 'bendahara' ? 'Akses Penuh' : 'Khusus Anggota'}
      </span>
    </div>
  );
};

export default RememberSession;
