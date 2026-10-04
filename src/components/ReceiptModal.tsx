import React, { useState } from 'react';
import { PaymentSubmission } from '../types';
import { useApp } from '../context/AppContext';
import { PatelkiLogo } from './PatelkiLogo';
import { Printer, Download, X, CheckCircle, ShieldCheck } from 'lucide-react';

interface ReceiptModalProps {
  submission: PaymentSubmission | null;
  onClose: () => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ submission, onClose }) => {
  const { settings, formatCurrency } = useApp();
  const [isPrinting, setIsPrinting] = useState(false);

  if (!submission) return null;

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 150);
  };

  const periodText = submission.months
    .map(m => `${MONTH_NAMES[m.month - 1]} ${m.year}`)
    .join(', ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">Kuitansi Resmi Pembayaran Iuran PATELKI</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Cetak / Simpan PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Content Printable */}
        <div className="p-8 sm:p-10 relative bg-white" id="printable-receipt">
          {/* Watermark Logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <PatelkiLogo size={350} />
          </div>

          {/* Header Kop Organisasi */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-center gap-4 sm:gap-6">
            <PatelkiLogo size={72} />
            <div className="flex-1">
              <h2 className="text-xs sm:text-sm font-bold tracking-widest text-emerald-800 uppercase">
                PERSATUAN AHLI TEKNOLOGI LABORATORIUM MEDIK INDONESIA
              </h2>
              <h1 className="text-base sm:text-xl font-extrabold text-slate-950 tracking-tight">
                DEWAN PENGURUS CABANG KABUPATEN KAYONG UTARA
              </h1>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">
                Sekretariat: {settings.address} • Email: {settings.contactEmail}
              </p>
            </div>
          </div>

          {/* Title & Receipt Number */}
          <div className="my-6 text-center">
            <h3 className="text-lg font-black tracking-wider text-slate-900 uppercase underline decoration-amber-500 decoration-2 underline-offset-4">
              BUKTI KUITANSI PEMBAYARAN IURAN
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              NOMOR: KUI/PTLK-KKU/{submission.id.replace('sub-', '')}/{new Date().getFullYear()}
            </p>
          </div>

          {/* Receipt Details Table */}
          <div className="space-y-3.5 text-xs sm:text-sm text-slate-800 my-6 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500 font-semibold">Telah Diterima Dari</span>
              <span className="col-span-2 font-extrabold text-slate-900">
                : {submission.memberName}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500 font-semibold">Nomor Anggota (NAP)</span>
              <span className="col-span-2 font-mono font-bold text-emerald-800">
                : {submission.memberNap || '-'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500 font-semibold">Unit Kerja / Instansi</span>
              <span className="col-span-2 font-medium">
                : {submission.memberInstansi || '-'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500 font-semibold">Untuk Pembayaran</span>
              <span className="col-span-2 font-bold text-slate-900">
                : Iuran Wajib Anggota ({submission.months.length} Bulan)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500 font-semibold">Rincian Periode</span>
              <span className="col-span-2 font-medium text-slate-800">
                : {periodText}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500 font-semibold">Metode / Bank Tujuan</span>
              <span className="col-span-2 font-medium">
                : {submission.bankName} ({submission.accountNumber})
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500 font-semibold">Status Verifikasi</span>
              <span className="col-span-2 font-bold flex items-center gap-1.5">
                : <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  LUNAS & TERVERIFIKASI
                </span>
              </span>
            </div>
          </div>

          {/* Nominal Box */}
          <div className="my-6 p-4 bg-amber-50 rounded-2xl border-2 border-amber-400 flex items-center justify-between">
            <span className="text-xs font-black uppercase text-amber-900 tracking-wider">
              Jumlah Terbilang:
            </span>
            <span className="text-lg sm:text-2xl font-black text-slate-950 font-mono">
              {formatCurrency(submission.totalAmount)}
            </span>
          </div>

          {/* Footer Signatures */}
          <div className="mt-8 pt-4 flex items-end justify-between text-xs sm:text-sm">
            <div className="text-center">
              <p className="text-slate-500 text-[11px]">Sukadana, {submission.verifiedAt?.split(' ')[0] || new Date().toLocaleDateString('id-ID')}</p>
              <p className="font-bold text-slate-800 mt-1">Penyetor / Anggota,</p>
              <div className="h-16 flex items-center justify-center">
                <span className="text-[10px] text-slate-600 italic">[Tanda Tangan Digital]</span>
              </div>
              <p className="font-bold text-slate-900 underline">{submission.memberName}</p>
              <p className="text-[10px] text-slate-500">NAP: {submission.memberNap}</p>
            </div>

            <div className="text-center">
              <p className="text-slate-500 text-[11px]">DPC Patelki Kayong Utara</p>
              <p className="font-bold text-slate-800 mt-1">Bendahara DPC,</p>
              <div className="h-16 flex items-center justify-center relative">
                <div className="px-3 py-1 border-2 border-emerald-600 rounded-lg text-emerald-700 font-black text-[10px] uppercase tracking-wider rotate-[-6deg] opacity-85">
                  DPC PATELKI KKU<br />LUNAS TERVERIFIKASI
                </div>
              </div>
              <p className="font-bold text-slate-900 underline">{submission.verifiedBy || settings.bendaharaName}</p>
              <p className="text-[10px] text-slate-500">NAP: {settings.bendaharaNap}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
