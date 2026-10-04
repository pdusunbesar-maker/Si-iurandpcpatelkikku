import React, { useState } from 'react';
import { PaymentSubmission } from '../types';
import { useApp } from '../context/AppContext';
import { PatelkiLogo } from './PatelkiLogo';
import { Printer, X, CheckCircle, ShieldCheck, Share2, Copy, Check } from 'lucide-react';

interface ReceiptModalProps {
  submission: PaymentSubmission | null;
  onClose: () => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function angkaKeTerbilang(nominal: number): string {
  const bilangan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  
  if (nominal < 12) {
    return bilangan[nominal];
  } else if (nominal < 20) {
    return angkaKeTerbilang(nominal - 10) + ' Belas';
  } else if (nominal < 100) {
    return angkaKeTerbilang(Math.floor(nominal / 10)) + ' Puluh ' + bilangan[nominal % 10];
  } else if (nominal < 200) {
    return 'Seratus ' + angkaKeTerbilang(nominal - 100);
  } else if (nominal < 1000) {
    return angkaKeTerbilang(Math.floor(nominal / 100)) + ' Ratus ' + angkaKeTerbilang(nominal % 100);
  } else if (nominal < 2000) {
    return 'Seribu ' + angkaKeTerbilang(nominal - 1000);
  } else if (nominal < 1000000) {
    return angkaKeTerbilang(Math.floor(nominal / 1000)) + ' Ribu ' + angkaKeTerbilang(nominal % 1000);
  } else if (nominal < 1000000000) {
    return angkaKeTerbilang(Math.floor(nominal / 1000000)) + ' Juta ' + angkaKeTerbilang(nominal % 1000000);
  }
  return nominal.toLocaleString('id-ID');
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ submission, onClose }) => {
  const { settings, formatCurrency, generateWhatsAppLink } = useApp();
  const [copied, setCopied] = useState(false);

  if (!submission) return null;

  const handlePrint = () => {
    window.print();
  };

  const periodText = submission.months
    .map(m => `${MONTH_NAMES[m.month - 1]} ${m.year}`)
    .join(', ');

  const receiptNo = `KUI/PTLK-KKU/${submission.id.replace('sub-', '')}/${new Date().getFullYear()}`;
  const terbilangText = `${angkaKeTerbilang(submission.totalAmount).trim()} Rupiah`;

  const shareText = `*KUITANSI RESMI PEMBAYARAN IURAN PATELKI*\n` +
    `No: ${receiptNo}\n` +
    `Nama: ${submission.memberName}\n` +
    `NAP: ${submission.memberNap || '-'}\n` +
    `Unit Kerja: ${submission.memberInstansi || '-'}\n` +
    `Periode: ${periodText} (${submission.months.length} Bulan)\n` +
    `Nominal: ${formatCurrency(submission.totalAmount)}\n` +
    `Terbilang: ${terbilangText}\n` +
    `Status: LUNAS & TERVERIFIKASI\n` +
    `DPC PATELKI KABUPATEN KAYONG UTARA`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWa = () => {
    const waUrl = generateWhatsAppLink(submission.memberWa || settings.contactWa, shareText);
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-4 sm:my-8 max-h-[92vh] flex flex-col">
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print flex items-center justify-between px-5 sm:px-6 py-3.5 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <div>
              <span className="font-extrabold text-xs sm:text-sm block">Pratinjau Kuitansi Resmi</span>
              <span className="text-[10px] text-slate-400">DPC PATELKI Kayong Utara</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              title="Salin Data Kuitansi"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Tersalin' : 'Salin'}
            </button>
            <button
              type="button"
              onClick={handleShareWa}
              title="Bagikan ke WhatsApp"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              WhatsApp
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-colors cursor-pointer shadow-sm active:scale-95"
            >
              <Printer className="w-4 h-4" />
              Cetak / PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable container for preview */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-8 bg-slate-100/60">
          {/* Printable Container */}
          <div
            id="printable-receipt"
            className="p-6 sm:p-10 relative bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto"
          >
            {/* Watermark Logo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
              <PatelkiLogo size={320} />
            </div>

            {/* Header Kop Organisasi */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-center gap-3 sm:gap-5">
              <PatelkiLogo size={68} />
              <div className="flex-1">
                <h2 className="text-[10px] sm:text-xs font-black tracking-widest text-emerald-800 uppercase leading-snug">
                  PERSATUAN AHLI TEKNOLOGI LABORATORIUM MEDIK INDONESIA
                </h2>
                <h1 className="text-sm sm:text-lg font-black text-slate-950 tracking-tight leading-tight mt-0.5">
                  DEWAN PENGURUS CABANG KABUPATEN KAYONG UTARA
                </h1>
                <p className="text-[10px] text-slate-600 mt-1 leading-tight">
                  Sekretariat: {settings.address}
                </p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Email: {settings.contactEmail} • WA: {settings.contactWa}
                </p>
              </div>
            </div>

            {/* Title & Receipt Number */}
            <div className="my-5 text-center">
              <h3 className="text-base sm:text-lg font-black tracking-wider text-slate-900 uppercase underline decoration-amber-500 decoration-2 underline-offset-4">
                BUKTI KUITANSI PEMBAYARAN IURAN
              </h3>
              <p className="text-[11px] text-slate-600 mt-1 font-mono font-bold">
                NOMOR: {receiptNo}
              </p>
            </div>

            {/* Receipt Details Table */}
            <div className="space-y-2.5 text-xs sm:text-sm text-slate-800 my-5 bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 font-semibold">Telah Diterima Dari</span>
                <span className="col-span-2 font-black text-slate-950">
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
                <span className="col-span-2 font-medium text-slate-800">
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
                <span className="text-slate-500 font-semibold">Rekening Penerima</span>
                <span className="col-span-2 font-medium text-slate-800">
                  : {submission.bankName} ({submission.accountNumber})
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 font-semibold">Status Verifikasi</span>
                <span className="col-span-2 font-bold flex items-center gap-1.5">
                  : <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    LUNAS & TERVERIFIKASI
                  </span>
                </span>
              </div>
            </div>

            {/* Nominal Box with Terbilang */}
            <div className="my-5 p-4 bg-amber-50/90 rounded-2xl border-2 border-amber-400">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-amber-900 tracking-wider">
                  Jumlah Pembayaran:
                </span>
                <span className="text-lg sm:text-2xl font-black text-slate-950 font-mono">
                  {formatCurrency(submission.totalAmount)}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-amber-300/80 text-[11px] text-amber-950">
                <span className="font-semibold text-slate-600">Terbilang: </span>
                <span className="italic font-bold">"{terbilangText}"</span>
              </div>
            </div>

            {/* Footer Signatures */}
            <div className="mt-7 pt-3 flex items-end justify-between text-xs sm:text-sm">
              <div className="text-center w-40">
                <p className="text-slate-500 text-[10px]">
                  Sukadana, {submission.verifiedAt?.split(' ')[0] || new Date().toLocaleDateString('id-ID')}
                </p>
                <p className="font-bold text-slate-800 mt-1">Penyetor / Anggota,</p>
                <div className="h-16 flex items-center justify-center">
                  <span className="text-[10px] text-slate-500 italic">[Tanda Tangan Digital]</span>
                </div>
                <p className="font-bold text-slate-900 underline">{submission.memberName}</p>
                <p className="text-[10px] text-slate-500">NAP: {submission.memberNap || '-'}</p>
              </div>

              <div className="text-center w-48">
                <p className="text-slate-500 text-[10px]">DPC PATELKI Kayong Utara</p>
                <p className="font-bold text-slate-800 mt-1">Bendahara DPC,</p>
                <div className="h-16 flex items-center justify-center relative">
                  <div className="px-3 py-1.5 border-2 border-emerald-600 rounded-xl text-emerald-800 font-black text-[10px] uppercase tracking-wider rotate-[-5deg] bg-emerald-50/60 shadow-xs">
                    DPC PATELKI KKU<br />LUNAS TERVERIFIKASI
                  </div>
                </div>
                <p className="font-bold text-slate-900 underline">{submission.verifiedBy || settings.bendaharaName}</p>
                <p className="text-[10px] text-slate-500">NAP: {settings.bendaharaNap}</p>
              </div>
            </div>

            {/* Verification Note */}
            <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400">
              Kuitansi ini diterbitkan secara sah oleh Sistem Informasi Iuran Online DPC PATELKI Kabupaten Kayong Utara.
            </div>
          </div>
        </div>

        {/* Bottom Action Footer for Mobile */}
        <div className="no-print p-3 sm:hidden bg-white border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleShareWa}
            className="flex-1 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" /> WA
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Cetak / PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
