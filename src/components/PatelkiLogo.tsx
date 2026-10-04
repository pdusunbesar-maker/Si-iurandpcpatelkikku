import React from 'react';

interface PatelkiLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

export const PatelkiLogo: React.FC<PatelkiLogoProps> = ({
  className = 'w-10 h-10',
  size,
  showText = false,
}) => {
  const customStyle = size ? { width: size, height: size } : {};

  return (
    <div className={`inline-flex items-center gap-3 shrink-0 ${className}`} style={size ? customStyle : undefined}>
      {/* Gambar logo resmi PATELKI sesuai yang diberikan, tanpa diubah */}
      <img
        src="/logo.png"
        alt="Logo Resmi PATELKI"
        className="w-full h-full object-contain shrink-0 select-none"
        loading="eager"
      />

      {showText && (
        <div className="flex flex-col text-left leading-tight select-none">
          <span className="font-extrabold tracking-wide text-slate-900 text-base uppercase">
            DPC PATELKI
          </span>
          <span className="text-xs font-semibold text-amber-500 tracking-wider uppercase">
            Kab. Kayong Utara
          </span>
        </div>
      )}
    </div>
  );
};

export default PatelkiLogo;
