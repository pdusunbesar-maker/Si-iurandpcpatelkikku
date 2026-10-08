import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { UserRole } from '../../types';

interface LoginButtonProps {
  activeRole: UserRole;
  loading: boolean;
  disabled?: boolean;
}

export const LoginButton: React.FC<LoginButtonProps> = ({
  activeRole,
  loading,
  disabled = false,
}) => {
  const buttonText =
    activeRole === 'bendahara'
      ? 'Masuk sebagai Bendahara'
      : 'Masuk sebagai Anggota';

  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="w-full h-[54px] px-6 rounded-[14px] bg-[#FF9F00] hover:bg-[#ED8C00] text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-[#FF9F00]/25 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none select-none"
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
          <span>Memproses...</span>
        </>
      ) : (
        <>
          <span>{buttonText}</span>
          <ArrowRight className="w-5 h-5 text-slate-950 transition-transform duration-200 group-hover:translate-x-0.5" />
        </>
      )}
    </button>
  );
};

export default LoginButton;
