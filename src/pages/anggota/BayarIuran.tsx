import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import confetti from 'canvas-confetti';
import {
  Send,
  CreditCard,
  Upload,
  CheckCircle2,
  Copy,
  Check,
  Calendar,
  AlertCircle,
  Eye,
  Info,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { ImagePreviewModal } from '../../components/ImagePreviewModal';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

interface BayarIuranProps {
  onNavigate: (page: string) => void;
}

export const BayarIuran: React.FC<BayarIuranProps> = ({ onNavigate }) => {
  const {
    currentMember,
    duesRecords,
    bankAccounts,
    settings,
    submitPayment,
    formatCurrency,
  } = useApp();

  const currentYear = 2026;
  const currentMonth = 10;

  // Selected bank
  const [selectedBankId, setSelectedBankId] = useState<string>(
    bankAccounts.find(b => b.isPrimary)?.id || bankAccounts[0]?.id || ''
  );

  // Selected year for month picker
  const [targetYear, setTargetYear] = useState<number>(2026);

  // Selected months map: key = `${year}-${month}`
  const [selectedMonthsMap, setSelectedMonthsMap] = useState<{ [key: string]: boolean }>({});

  // Proof upload state
  const [proofUrl, setProofUrl] = useState<string>('');
  const [proofName, setProofName] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [copiedBankId, setCopiedBankId] = useState<string | null>(null);

  // Success screen state
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!currentMember) {
    return <div className="p-8 text-center text-slate-500">Anggota tidak ditemukan.</div>;
  }

  // Get dues for the target member
  const memberDues = duesRecords.filter(d => d.memberId === currentMember.id);

  // Toggle month selection
  const handleToggleMonth = (year: number, month: number) => {
    const key = `${year}-${month}`;
    setSelectedMonthsMap(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Quick Select All Arrears
  const handleSelectAllArrears = () => {
    const newMap: { [key: string]: boolean } = {};
    memberDues.forEach(d => {
      if (d.status === 'unpaid' && !(d.year > currentYear) && !(d.year === currentYear && d.month > currentMonth)) {
        newMap[`${d.year}-${d.month}`] = true;
      }
    });
    setSelectedMonthsMap(newMap);
  };

  // Convert selected map to array
  const selectedMonthsList = Object.entries(selectedMonthsMap)
    .filter(([_, isSelected]) => isSelected)
    .map(([key]) => {
      const [y, m] = key.split('-').map(Number);
      return { year: y, month: m };
    })
    .sort((a, b) => a.year - b.year || a.month - b.month);

  const totalAmount = selectedMonthsList.length * settings.monthlyFee;

  // Handle local image file upload preview
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProofName(file.name);
    const reader = new FileReader();
    reader.onload = evt => {
      if (evt.target?.result) {
        setProofUrl(evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCopyAccount = (bankId: string, accNum: string) => {
    navigator.clipboard.writeText(accNum.replace(/[^0-9]/g, ''));
    setCopiedBankId(bankId);
    setTimeout(() => setCopiedBankId(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMonthsList.length === 0) {
      alert('Silakan pilih minimal 1 bulan iuran yang akan dibayar!');
      return;
    }
    if (!proofUrl) {
      alert('Silakan unggah foto / tangkapan layar bukti transfer Anda!');
      return;
    }

    const subId = submitPayment({
      memberId: currentMember.id,
      months: selectedMonthsList,
      bankAccountId: selectedBankId,
      proofUrl,
      proofName,
      notes,
    });

    setSubmittedId(subId);

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (_) {}
  };

  const selectedBank = bankAccounts.find(b => b.id === selectedBankId);

  // If already submitted, show success card
  if (submittedId) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xl text-center animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Pembayaran Berhasil Dikirim!</h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          Bukti transfer iuran sebesar <strong className="text-emerald-700 font-mono">{formatCurrency(totalAmount)}</strong> ({selectedMonthsList.length} Bulan) telah tersimpan dengan status <strong className="text-amber-600">MENUNGGU VERIFIKASI</strong>.
        </p>

        <div className="my-6 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 text-left space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-600" /> Informasi Alur Selanjutnya:
          </p>
          <p className="text-slate-600">
            1. Bendahara DPC Patelki Kayong Utara akan memverifikasi mutasi rekening.
          </p>
          <p className="text-slate-600">
            2. Setelah disetujui, matrix iuran Anda otomatis berubah menjadi hijau (LUNAS) dan Anda dapat mengunduh kuitansi resmi.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('riwayat-saya')}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
          >
            Lihat Riwayat & Kuitansi
          </button>
          <button
            type="button"
            onClick={() => {
              setSubmittedId(null);
              setSelectedMonthsMap({});
              setProofUrl('');
            }}
            className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
          >
            Bayar Bulan Lainnya
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Pembayaran Iuran Online
          </h1>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
            Tarif: {formatCurrency(settings.monthlyFee)}/bln
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Pilih bulan iuran yang ingin dibayar, lakukan transfer ke rekening DPC, dan unggah bukti transfer.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Pilih Bulan Iuran */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs">
                1
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  Pilih Bulan yang Akan Dibayar
                </h2>
                <p className="text-xs text-slate-500">
                  Anda dapat memilih satu bulan, beberapa bulan sekaligus, atau melunasi seluruh tunggakan.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={targetYear}
                onChange={e => setTargetYear(Number(e.target.value))}
                className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 outline-hidden"
              >
                {[2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>
                    Tahun {y}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleSelectAllArrears}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 transition-colors"
              >
                Pilih Semua Tunggakan
              </button>
            </div>
          </div>

          {/* Month Tiles Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {MONTH_NAMES.map((name, idx) => {
              const monthNum = idx + 1;
              const key = `${targetYear}-${monthNum}`;
              const record = memberDues.find(
                d => d.year === targetYear && d.month === monthNum
              );

              const isPaid = record?.status === 'paid';
              const isPending = record?.status === 'pending';
              const isSelected = !!selectedMonthsMap[key];

              return (
                <div
                  key={name}
                  onClick={() => {
                    if (isPaid) return;
                    handleToggleMonth(targetYear, monthNum);
                  }}
                  className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between select-none ${
                    isPaid
                      ? 'bg-emerald-50/60 border-emerald-200 opacity-60 cursor-not-allowed'
                      : isPending
                      ? 'bg-amber-50 border-amber-300 cursor-not-allowed'
                      : isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md font-bold scale-[1.02] cursor-pointer'
                      : 'bg-white border-slate-200 hover:border-amber-400 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs">{name}</span>
                    <span className="text-[10px] opacity-75">{targetYear}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] font-mono">
                      {formatCurrency(settings.monthlyFee)}
                    </span>
                    {isPaid && (
                      <span className="text-[10px] font-bold text-emerald-700">Lunas ✅</span>
                    )}
                    {isPending && (
                      <span className="text-[10px] font-bold text-amber-700">Verifikasi ⏳</span>
                    )}
                    {!isPaid && !isPending && (
                      <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center">
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Summary Pill */}
          <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Rincian Pembayaran ({selectedMonthsList.length} Bulan Terpilih):
              </p>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">
                {selectedMonthsList.length > 0
                  ? selectedMonthsList.map(m => `${MONTH_NAMES[m.month - 1]} ${m.year}`).join(', ')
                  : 'Belum ada bulan yang dipilih'}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-500 font-bold block">TOTAL TAGIHAN:</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-slate-950">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Step 2: Rekening Tujuan Transfer */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs">
              2
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                Pilih Rekening Tujuan Transfer
              </h2>
              <p className="text-xs text-slate-500">
                Transfer nominal tepat sesuai total tagihan ke salah satu rekening resmi DPC berikut.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bankAccounts.filter(b => b.isActive).map(bank => (
              <div
                key={bank.id}
                onClick={() => setSelectedBankId(bank.id)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  selectedBankId === bank.id
                    ? 'border-emerald-600 bg-emerald-50/30 shadow-md ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900">{bank.bankName}</span>
                    {selectedBankId === bank.id && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    )}
                  </div>
                  <p className="font-mono text-sm font-black text-emerald-800 mt-2">
                    {bank.accountNumber}
                  </p>
                  <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                    a/n {bank.accountHolder}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    handleCopyAccount(bank.id, bank.accountNumber);
                  }}
                  className="mt-3 w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-xl flex items-center justify-center gap-1 transition-colors"
                >
                  {copiedBankId === bank.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Tersalin
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Salin No. Rekening
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Step 3: Unggah Bukti Transfer */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs">
              3
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                Unggah Bukti Transfer & Konfirmasi
              </h2>
              <p className="text-xs text-slate-500">
                Pastikan nama pengirim, nominal, dan tanggal terlihat jelas pada bukti transfer.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Upload Zone */}
            <div className="space-y-3">
              <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-3xl p-6 text-center bg-slate-50 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Pilih Foto Bukti Transfer / Struk</p>
                <p className="text-[11px] text-slate-500 mt-1">Mendukung file JPG, PNG, atau PDF</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="mt-3 text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan untuk Bendahara (Opsional):
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Contoh: Transfer via BRImo atas nama sendiri..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 outline-hidden bg-slate-50"
                />
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="p-4 bg-slate-50 rounded-3xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Pratinjau Bukti Transfer:
              </span>

              {proofUrl ? (
                <div className="space-y-2">
                  <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 h-52 flex items-center justify-center">
                    <img
                      src={proofUrl}
                      alt="Bukti Transfer"
                      className="max-h-full max-w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setPreviewImage(proofUrl)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold gap-1 transition-opacity cursor-pointer"
                    >
                      <Eye className="w-4 h-4" /> Klik untuk Perbesar
                    </button>
                  </div>
                  <p className="text-[11px] font-mono text-slate-500 truncate">
                    {proofName || 'struk_transfer.jpg'}
                  </p>
                </div>
              ) : (
                <div className="h-52 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 text-xs">
                  <Upload className="w-6 h-6 mb-1 opacity-50" />
                  Belum ada bukti yang dipilih
                </div>
              )}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-500">
                Total yang akan dikirim: <strong className="text-slate-900">{formatCurrency(totalAmount)}</strong>
              </p>
            </div>

            <button
              type="submit"
              disabled={selectedMonthsList.length === 0 || !proofUrl}
              className="inline-flex items-center gap-2 px-7 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Send className="w-4 h-4" />
              Kirim Pembayaran Sekarang
            </button>
          </div>
        </div>
      </form>

      {/* Image Zoom Preview */}
      {previewImage && (
        <ImagePreviewModal
          imageUrl={previewImage}
          title="Pratinjau Bukti Transfer Anda"
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
};

export default BayarIuran;
