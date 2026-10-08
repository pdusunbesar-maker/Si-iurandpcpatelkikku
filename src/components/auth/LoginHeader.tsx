import React from 'react';
import { ShieldCheck, FileCheck, Users } from 'lucide-react';
import { PatelkiLogo } from '../PatelkiLogo';
import buildingPhoto from '../../assets/images/patelki_building_1791478382751.jpg';

export const LoginHeader: React.FC = () => {
  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-hidden z-10">
      {/* Background Building Photo - Very subtle, dark emerald overlay for 100% readability */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
        <img
          src={buildingPhoto}
          alt="Gedung Sekretariat PATELKI"
          className="absolute -bottom-10 -left-10 w-full sm:w-[95%] max-h-[520px] object-cover object-bottom opacity-20 mix-blend-luminosity filter blur-[0.3px]"
        />
        {/* Soft gradient mask ensuring text is crisp and readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#003B2E] via-[#004D3C]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#004D3C]/40 via-transparent to-[#003B2E]/90" />
      </div>

      {/* Decorative Diagonal Curves / Shapes */}
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-[#FF9F00]/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-20 w-72 h-72 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />

      {/* Content Top: Logo & Title Section */}
      <div className="relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left mt-2 sm:mt-6">
        {/* Patelki Logo in Rounded White Box with Soft Shadow */}
        <div className="inline-flex p-4 sm:p-5 bg-white rounded-3xl shadow-xl shadow-black/25 mb-5 transform transition-transform hover:scale-105 duration-300">
          <PatelkiLogo size={68} className="w-16 h-16 sm:w-20 sm:h-20" />
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
          SI-IURAN <span className="text-[#FF9F00]">PATELKI</span>
        </h1>

        {/* Organization Name */}
        <h2 className="text-sm sm:text-base lg:text-lg font-bold text-white tracking-wider mt-1.5 uppercase">
          DPC KABUPATEN KAYONG UTARA
        </h2>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-white/90 mt-2 max-w-md leading-relaxed font-normal">
          Sistem Informasi Iuran, Verifikasi &amp; Keuangan Organisasi Profesi ATLM
        </p>
      </div>

      {/* Content Bottom: 3 Feature Highlights */}
      <div className="relative z-10 mt-10 lg:mt-16 pt-6 border-t border-white/15">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {/* Highlight 1: Transparan */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white mb-2.5 shadow-sm">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <h3 className="text-sm font-bold text-white">Transparan</h3>
            <p className="text-xs text-white/80 mt-0.5 leading-snug">
              Pengelolaan iuran lebih transparan
            </p>
          </div>

          {/* Highlight 2: Akurat */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white mb-2.5 shadow-sm">
              <FileCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <h3 className="text-sm font-bold text-white">Akurat</h3>
            <p className="text-xs text-white/80 mt-0.5 leading-snug">
              Data terverifikasi dengan baik
            </p>
          </div>

          {/* Highlight 3: Profesional */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white mb-2.5 shadow-sm">
              <Users className="w-6 h-6 text-emerald-300" />
            </div>
            <h3 className="text-sm font-bold text-white">Profesional</h3>
            <p className="text-xs text-white/80 mt-0.5 leading-snug">
              Mendukung organisasi yang lebih maju
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginHeader;
