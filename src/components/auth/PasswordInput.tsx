import React from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  onHelpClick?: () => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  id = 'password-input',
  value,
  onChange,
  showPassword,
  onToggleShowPassword,
  onHelpClick,
  disabled = false,
  required = true,
  placeholder = 'Masukkan kata sandi...',
}) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-xs sm:text-sm font-bold text-slate-800 select-none"
        >
          Kata Sandi / PIN <span className="text-red-500">*</span>
        </label>
        {onHelpClick && (
          <button
            type="button"
            onClick={onHelpClick}
            className="text-xs font-bold text-[#FF9F00] hover:text-[#ED8C00] transition-colors cursor-pointer select-none"
          >
            Bantuan Login?
          </button>
        )}
      </div>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <Lock className="w-5 h-5 text-slate-400" />
        </div>

        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          autoComplete="current-password"
          className="w-full h-[52px] pl-12 pr-12 text-sm text-slate-900 placeholder:text-slate-400 bg-[#F9FBFD] border border-[#CBD8E5] rounded-[12px] transition-all duration-200 outline-none focus:border-[#00664F] focus:ring-3 focus:ring-[#00664F]/15 disabled:bg-slate-100 disabled:cursor-not-allowed font-medium"
        />

        <button
          type="button"
          tabIndex={0}
          aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          onClick={onToggleShowPassword}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00664F]/30"
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default PasswordInput;
