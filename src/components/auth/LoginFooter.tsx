import React from 'react';
import { Shield } from 'lucide-react';

export const LoginFooter: React.FC = () => {
  return (
    <footer className="w-full bg-[#004D3C] text-white/75 text-xs py-3.5 px-4 sm:px-8 border-t border-emerald-800/40 select-none relative z-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left">
        <div className="flex items-center gap-2 font-medium">
          <div className="w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center shrink-0">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span>SI-IURAN PATELKI &nbsp;•&nbsp; DPC KABUPATEN KAYONG UTARA</span>
        </div>

        <div className="text-[11px] sm:text-xs opacity-80">
          Sistem Informasi Iuran, Verifikasi &amp; Keuangan Organisasi Profesi ATLM
        </div>
      </div>
    </footer>
  );
};

export default LoginFooter;
