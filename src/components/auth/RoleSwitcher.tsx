import React from 'react';
import { Shield, Users } from 'lucide-react';
import { UserRole } from '../../types';

interface RoleSwitcherProps {
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  disabled?: boolean;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  activeRole,
  onRoleChange,
  disabled = false,
}) => {
  return (
    <div
      role="tablist"
      aria-label="Pilih Peran Masuk"
      className="p-1.5 bg-[#E8EEF4] rounded-[18px] grid grid-cols-2 gap-2 select-none"
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeRole === 'bendahara'}
        disabled={disabled}
        onClick={() => onRoleChange('bendahara')}
        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-[14px] text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
          activeRole === 'bendahara'
            ? 'bg-[#FF9F00] text-slate-900 shadow-md shadow-amber-500/20 translate-y-0'
            : 'text-[#42536B] hover:text-slate-900 hover:bg-white/40'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Shield className="w-4 h-4 shrink-0 text-slate-900" />
        <span>Login Bendahara</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={activeRole === 'anggota'}
        disabled={disabled}
        onClick={() => onRoleChange('anggota')}
        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-[14px] text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
          activeRole === 'anggota'
            ? 'bg-[#FF9F00] text-slate-900 shadow-md shadow-amber-500/20 translate-y-0'
            : 'text-[#42536B] hover:text-slate-900 hover:bg-white/40'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Users className="w-4 h-4 shrink-0 text-slate-900" />
        <span>Login Anggota</span>
      </button>
    </div>
  );
};

export default RoleSwitcher;
