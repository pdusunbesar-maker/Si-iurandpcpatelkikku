import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Grid3X3,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  ShieldCheck,
} from 'lucide-react';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

interface MatrixSayaProps {
  onNavigate: (page: string) => void;
}

export const MatrixSaya: React.FC<MatrixSayaProps> = ({ onNavigate }) => {
  const { currentMember, duesRecords, settings, formatCurrency } = useApp();
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  if (!currentMember) return null;

  const memberRecords = duesRecords.filter(
    d => d.memberId === currentMember.id && d.year === selectedYear
  );

  const paidCount = memberRecords.filter(d => d.status === 'paid').length;
  const pendingCount = memberRecords.filter(d => d.status === 'pending').length;
  const unpaidCount = memberRecords.filter(d => d.status === 'unpaid').length;
  const totalPaid = paidCount * settings.monthlyFee;
  const totalArrears = unpaidCount * settings.monthlyFee;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Matrix Iuran 12 Bulan Saya
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              Tahun {selectedYear}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Status iuran pribadi Anda untuk periode {selectedYear}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-300 rounded-xl px-3 py-1.5 shadow-xs">
            <Calendar className="w-4 h-4 text-amber-500 mr-2" />
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="text-xs font-bold text-slate-800 bg-transparent outline-hidden cursor-pointer"
            >
              {[2025, 2026, 2027, 2028, 2029, 2030, 2031].map(y => (
                <option key={y} value={y}>
                  Tahun {y}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('bayar-iuran')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs"
          >
            <Send className="w-4 h-4" />
            Bayar Iuran
          </button>
        </div>
      </div>

      {/* Summary KPI for Personal Dues */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-800 uppercase">Sudah Dibayar ({selectedYear})</p>
            <p className="text-2xl font-black text-emerald-700 font-mono mt-1">
              {formatCurrency(totalPaid)}
            </p>
            <p className="text-[11px] text-emerald-600 mt-1">{paidCount} dari 12 Bulan Lunas</p>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>

        <div className="bg-amber-50 p-5 rounded-3xl border border-amber-300 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-900 uppercase">Menunggu Verifikasi</p>
            <p className="text-2xl font-black text-amber-800 font-mono mt-1">
              {formatCurrency(pendingCount * settings.monthlyFee)}
            </p>
            <p className="text-[11px] text-amber-700 mt-1">{pendingCount} Bulan Dalam Antrean</p>
          </div>
          <Clock className="w-8 h-8 text-amber-600" />
        </div>

        <div className="bg-red-50 p-5 rounded-3xl border border-red-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-red-800 uppercase">Tunggakan Belum Bayar</p>
            <p className="text-2xl font-black text-red-700 font-mono mt-1">
              {formatCurrency(totalArrears)}
            </p>
            <p className="text-[11px] text-red-600 mt-1">{unpaidCount} Bulan Belum Dibayar</p>
          </div>
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
      </div>

      {/* 12 Months Visual Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <h3 className="font-extrabold text-sm text-slate-900 mb-4">
          Status Pembayaran Per Bulan ({selectedYear})
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {MONTH_NAMES.map((mName, idx) => {
            const monthNum = idx + 1;
            const rec = memberRecords.find(d => d.month === monthNum);
            const status = rec?.status || 'unpaid';

            return (
              <div
                key={mName}
                className={`p-4 rounded-2xl border-2 flex flex-col justify-between ${
                  status === 'paid'
                    ? 'border-emerald-500 bg-emerald-50/40'
                    : status === 'pending'
                    ? 'border-amber-400 bg-amber-50/40'
                    : 'border-red-200 bg-red-50/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900">{mName}</span>
                    <span className="text-[10px] font-mono text-slate-500">{selectedYear}</span>
                  </div>
                  <p className="text-sm font-black font-mono mt-2 text-slate-800">
                    {formatCurrency(settings.monthlyFee)}
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  {status === 'paid' && (
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                    </span>
                  )}
                  {status === 'pending' && (
                    <span className="font-bold text-amber-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Verifikasi
                    </span>
                  )}
                  {status === 'unpaid' && (
                    <button
                      type="button"
                      onClick={() => onNavigate('bayar-iuran')}
                      className="text-red-700 hover:text-red-900 font-bold underline text-[11px]"
                    >
                      Bayar Sekarang →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MatrixSaya;
