import React from 'react';
import { Shield, User, AlertCircle } from 'lucide-react';
import { UserRole } from '../../types';
import { PasswordInput } from './PasswordInput';
import { RememberSession } from './RememberSession';
import { LoginButton } from './LoginButton';
import { SecurityBadge } from './SecurityBadge';

interface LoginFormProps {
  activeRole: UserRole;
  identifier: string;
  onIdentifierChange: (val: string) => void;
  password: string;
  onPasswordChange: (val: string) => void;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  rememberSession: boolean;
  onRememberSessionChange: (val: boolean) => void;
  loading: boolean;
  errorMessage: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onHelpClick: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  activeRole,
  identifier,
  onIdentifierChange,
  password,
  onPasswordChange,
  showPassword,
  onToggleShowPassword,
  rememberSession,
  onRememberSessionChange,
  loading,
  errorMessage,
  onSubmit,
  onHelpClick,
}) => {
  const identifierLabel =
    activeRole === 'bendahara'
      ? 'Username / NAP Bendahara'
      : 'Username / NAP Anggota';

  const identifierPlaceholder =
    activeRole === 'bendahara'
      ? 'Username bendahara (default: bendahara)'
      : 'Masukkan NAP (misal: 61.11.002), Nama, atau No WA';

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 bg-red-50 border border-red-200 rounded-[14px] flex items-start gap-3 text-xs text-red-700 animate-in fade-in duration-200"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block">Gagal Masuk</span>
            <span className="text-[11px] text-red-600 mt-0.5 block leading-relaxed">
              {errorMessage}
            </span>
          </div>
        </div>
      )}

      {/* Identifier Input */}
      <div className="space-y-1.5">
        <label
          htmlFor="identifier-input"
          className="block text-xs sm:text-sm font-bold text-slate-800 select-none"
        >
          {identifierLabel} <span className="text-red-500">*</span>
        </label>

        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {activeRole === 'bendahara' ? (
              <Shield className="w-5 h-5 text-amber-500" />
            ) : (
              <User className="w-5 h-5 text-[#00664F]" />
            )}
          </div>

          <input
            id="identifier-input"
            type="text"
            required
            disabled={loading}
            value={identifier}
            onChange={(e) => onIdentifierChange(e.target.value)}
            placeholder={identifierPlaceholder}
            autoComplete="username"
            className="w-full h-[52px] pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 bg-[#F9FBFD] border border-[#CBD8E5] rounded-[12px] transition-all duration-200 outline-none focus:border-[#00664F] focus:ring-3 focus:ring-[#00664F]/15 disabled:bg-slate-100 disabled:cursor-not-allowed font-medium"
          />
        </div>
      </div>

      {/* Password Input */}
      <PasswordInput
        value={password}
        onChange={onPasswordChange}
        showPassword={showPassword}
        onToggleShowPassword={onToggleShowPassword}
        onHelpClick={onHelpClick}
        disabled={loading}
      />

      {/* Remember Session */}
      <RememberSession
        remember={rememberSession}
        onRememberChange={onRememberSessionChange}
        activeRole={activeRole}
        disabled={loading}
      />

      {/* Submit Button */}
      <div className="pt-2">
        <LoginButton activeRole={activeRole} loading={loading} />
      </div>

      {/* Security Message */}
      <SecurityBadge />
    </form>
  );
};

export default LoginForm;
