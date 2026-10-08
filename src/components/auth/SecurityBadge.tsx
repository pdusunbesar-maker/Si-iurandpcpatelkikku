import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const SecurityBadge: React.FC = () => {
  return (
    <div className="pt-4 pb-1 text-center">
      <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#00664F] select-none">
        <ShieldCheck className="w-4 h-4 text-[#00664F] shrink-0" />
        <span>Aman &nbsp;•&nbsp; Terpercaya &nbsp;•&nbsp; Profesional</span>
      </div>
    </div>
  );
};

export default SecurityBadge;
