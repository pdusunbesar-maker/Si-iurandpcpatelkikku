import React, { useState } from 'react';
import { Member, DuesRecord } from '../types';
import { useApp } from '../context/AppContext';
import {
  X,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  MinusCircle,
  DollarSign,
  ShieldCheck,
  RotateCcw,
  Check,
  MessageSquare,
  Building,
  User,
  CreditCard,
  FileText,
  Send,
  Sparkles,
} from 'lucide-react';
import { WhatsAppModal } from './WhatsAppModal';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

interface ManageArrearsModalProps {
  member: Member;
  isOpen: boolean;
  onClose: () => void;
  defaultYear?: number;
}

export const ManageArrearsModal: React.FC<ManageArrearsModalProps> = ({
  member,
  isOpen,
  onClose,
  defaultYear = 2026,
}) => {
  const {
    duesRecords,
    settings,
    settleMemberArrears,
    waiveMemberArrears,
    bulkUpdateDues,
    formatCurrency,
    generateWhatsAppLink,
  } = useApp();

  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);
  const [selectedMonths, setSelectedMonths] = useState<{ year: number; month: number }[]>([]);
  const [activeTab, setActiveTab] = useState<'settle' | 'waive' | 'manual'>('settle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states for Settle (Pelunasan)
  const [paymentMethod, setPaymentMethod] = useState('Tunai ke Bendahara');
  const [recordCash, setRecordCash] = useState(true);
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Form states for Waive (Pembebasan)
  const [waiveReason, setWaiveReason] = useState('Anggota baru bergabung / penyesuaian periode');

  // Form states for Manual Status
  const [manualStatus, setManualStatus] = useState<'paid' | 'pending' | 'unpaid' | 'inactive'>('paid');
  const [customAmount, setCustomAmount] = useState<number>(settings.monthlyFee);

  // WhatsApp receipt modal
  const [waModalData, setWaModalData] = useState<{
    phone: string;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;

  // Get member dues for all years and current selected year
  const memberAllDues = duesRecords.filter(d => d.memberId === member.id || (member.nap && d.memberId === member.nap));
  const memberYearDues = memberAllDues.filter(d => d.year === selectedYear);

  // Arrears calculations across active years from January 2025 up to running calendar month
  const allUnpaid = memberAllDues.filter(
    d => d.status === 'unpaid' && d.year >= 2025 && (d.year < curYear || (d.year === curYear && d.month <= curMonth))
  );
  const totalArrearsAllYears = allUnpaid.reduce((sum, d) => sum + (d.amount || settings.monthlyFee), 0);

  // Toggle selection of a specific month
  const handleToggleMonth = (year: number, month: number) => {
    setSelectedMonths(prev => {
      const exists = prev.some(m => m.year === year && m.month === month);
      if (exists) {
        return prev.filter(m => !(m.year === year && m.month === month));
      } else {
        return [...prev, { year, month }].sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month));
      }
    });
  };

  // Select all unpaid months in current year
  const handleSelectYearUnpaid = () => {
    const yearUnpaid = memberYearDues
      .filter(d => d.status === 'unpaid')
      .map(d => ({ year: d.year, month: d.month }));
    setSelectedMonths(yearUnpaid);
  };

  // Select all unpaid months across all years
  const handleSelectAllUnpaid = () => {
    const allUnpaidMonths = allUnpaid.map(d => ({ year: d.year, month: d.month }));
    setSelectedMonths(allUnpaidMonths);
  };

  const handleClearSelection = () => {
    setSelectedMonths([]);
  };

  // Calculate total amount for selected months
  const selectedTotalAmount = selectedMonths.reduce((sum, m) => {
    const rec = memberAllDues.find(d => d.year === m.year && d.month === m.month);
    return sum + (rec?.amount || settings.monthlyFee);
  }, 0);

  // Submit Pelunasan (Settle Arrears)
  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMonths.length === 0) return;

    setIsProcessing(true);
    try {
      const res = await settleMemberArrears(member.id, selectedMonths, {
        paymentMethod,
        recordCash,
        paidDate,
        notes,
      });

      const monthPeriodStr = selectedMonths
        .map(m => `${MONTH_SHORT[m.month - 1]} ${m.year}`)
        .join(', ');

      setSuccessMessage(`Berhasil melunaskan ${selectedMonths.length} bulan iuran (${formatCurrency(res.totalAmount)}).`);
      
      // Prepare WhatsApp message
      const waMsg = `*KUITANSI PELUNASAN IURAN DPC PATELKI KAYONG UTARA*\n\n` +
        `Yth. Rekan Sejawat *${member.nama}, ${member.gelar || ''}* (${member.nap})\n\n` +
        `Pembayaran iuran Anda telah BERHASIL DICATAT & DILUNASKAN oleh Bendahara DPC:\n` +
        `• Periode: *${monthPeriodStr}* (${selectedMonths.length} Bulan)\n` +
        `• Total Nominal: *${formatCurrency(res.totalAmount)}*\n` +
        `• Metode: *${paymentMethod}*\n` +
        `• Tanggal: *${paidDate}*\n` +
        `• Status: *LUNAS (Terverifikasi)*\n\n` +
        `Terima kasih atas partisipasi dan kontribusi aktif Anda dalam organisasi Patelki.\n\n` +
        `Salam Hangat,\n*Bendahara DPC Patelki Kayong Utara*\n${settings.bendaharaName}`;

      setWaModalData({
        phone: member.noWa,
        message: waMsg,
      });

      setSelectedMonths([]);
    } catch (err: any) {
      alert(`Gagal melunaskan tunggakan: ${err.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Submit Pembebasan (Waive Arrears)
  const handleWaive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMonths.length === 0) return;

    setIsProcessing(true);
    try {
      await waiveMemberArrears(member.id, selectedMonths, waiveReason);
      setSuccessMessage(`Berhasil membebaskan/menonaktifkan kewajiban ${selectedMonths.length} bulan iuran.`);
      setSelectedMonths([]);
    } catch (err: any) {
      alert(`Gagal membebaskan tunggakan: ${err.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Submit Manual Status Update
  const handleManualStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMonths.length === 0) return;

    setIsProcessing(true);
    try {
      const updates = selectedMonths.map(m => ({
        memberId: member.id,
        year: m.year,
        month: m.month,
        status: manualStatus,
        amount: customAmount,
      }));

      bulkUpdateDues(updates);
      setSuccessMessage(`Status ${selectedMonths.length} bulan iuran berhasil diperbarui ke '${manualStatus.toUpperCase()}'.`);
      setSelectedMonths([]);
    } catch (err: any) {
      alert(`Gagal memperbarui status: ${err.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-3.5 pr-8">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-300 font-bold text-lg overflow-hidden">
              {member.foto ? (
                <img src={member.foto} alt={member.nama} className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  {member.nama}, {member.gelar || ''}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  NAP: {member.nap}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {member.instansi}
                </span>
                <span className="text-slate-400">•</span>
                <span>{member.jabatan || 'Anggota'}</span>
              </div>
            </div>
          </div>

          {/* Arrears Badge Bar */}
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Total Tunggakan:</span>
              <span className="font-mono font-black text-amber-300 text-sm">
                {formatCurrency(totalArrearsAllYears)}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold">
                {allUnpaid.length} Bulan
              </span>
            </div>

            <div className="text-[11px] text-slate-400">
              Tarif Resmi: <strong className="text-slate-200">{formatCurrency(settings.monthlyFee)}/bln</strong>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[72vh] overflow-y-auto custom-scrollbar">
          {/* Success Banner */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Year Tabs & Quick Selection Buttons */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[2025, 2026, 2027, 2028, 2029, 2030, 2031].map(yr => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setSelectedYear(yr)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      selectedYear === yr
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tahun {yr}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={handleSelectYearUnpaid}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg border border-amber-200 text-[11px] cursor-pointer"
                >
                  Pilih Tunggakan {selectedYear}
                </button>
                <button
                  type="button"
                  onClick={handleSelectAllUnpaid}
                  className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-800 font-bold rounded-lg border border-red-200 text-[11px] cursor-pointer"
                >
                  Pilih Semua ({allUnpaid.length})
                </button>
                {selectedMonths.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="px-2 py-1 text-slate-500 hover:text-slate-800 font-semibold text-[11px] cursor-pointer"
                  >
                    Batal Pilih
                  </button>
                )}
              </div>
            </div>

            {/* 12-Month Matrix Grid for Selected Year */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(mNum => {
                const rec = memberYearDues.find(d => d.month === mNum);
                const status = rec?.status || 'unpaid';
                const isSelected = selectedMonths.some(m => m.year === selectedYear && m.month === mNum);

                let badgeClass = 'bg-red-50 border-red-200 text-red-700 hover:border-red-400';
                let statusLabel = 'Belum Bayar';
                let StatusIcon = AlertCircle;

                if (status === 'paid') {
                  badgeClass = 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-400';
                  statusLabel = 'Lunas';
                  StatusIcon = CheckCircle2;
                } else if (status === 'pending') {
                  badgeClass = 'bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-400';
                  statusLabel = 'Verifikasi';
                  StatusIcon = Clock;
                } else if (status === 'inactive') {
                  badgeClass = 'bg-slate-100 border-slate-200 text-slate-500 hover:border-slate-300';
                  statusLabel = 'Nonaktif / Bebas';
                  StatusIcon = MinusCircle;
                }

                return (
                  <button
                    key={mNum}
                    type="button"
                    onClick={() => handleToggleMonth(selectedYear, mNum)}
                    className={`relative p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[64px] ${badgeClass} ${
                      isSelected ? 'ring-2 ring-slate-900 border-slate-900 shadow-md font-bold' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-extrabold text-xs text-slate-900">
                        {MONTH_SHORT[mNum - 1]}
                      </span>
                      <div className={`w-4 h-4 rounded-md flex items-center justify-center border text-[10px] ${
                        isSelected ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mt-1 text-[10px] font-semibold">
                      <StatusIcon className="w-3 h-3 shrink-0" />
                      <span className="truncate">{statusLabel}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Area for Selected Months */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-bold text-slate-700">
                  Bulan Terpilih ({selectedMonths.length} Bulan):
                </span>
                <p className="text-[11px] font-mono font-bold text-slate-900 mt-0.5">
                  {selectedMonths.length === 0
                    ? 'Klik salah satu atau beberapa bulan di atas untuk mengatur statusnya.'
                    : selectedMonths.map(m => `${MONTH_SHORT[m.month - 1]} ${m.year}`).join(', ')}
                </p>
              </div>

              {selectedMonths.length > 0 && (
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Total Nilai Terpilih:
                  </span>
                  <span className="text-sm font-black font-mono text-emerald-700">
                    {formatCurrency(selectedTotalAmount)}
                  </span>
                </div>
              )}
            </div>

            {selectedMonths.length > 0 ? (
              <div className="space-y-4">
                {/* Mode Selector Tabs */}
                <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-2xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveTab('settle')}
                    className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'settle'
                        ? 'bg-white text-slate-900 shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    Lunaskan Sekarang (Tunai)
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('waive')}
                    className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'waive'
                        ? 'bg-white text-slate-900 shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    Bebaskan / Pemutihan
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('manual')}
                    className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'manual'
                        ? 'bg-white text-slate-900 shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    Ubah Status Manual
                  </button>
                </div>

                {/* Tab 1: Pelunasan Langsung (Tunai / Transfer) */}
                {activeTab === 'settle' && (
                  <form onSubmit={handleSettle} className="space-y-3.5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Metode Pelunasan *
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={e => setPaymentMethod(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 outline-hidden"
                        >
                          <option value="Tunai ke Bendahara">💵 Tunai Langsung ke Bendahara</option>
                          <option value="Transfer Bank Kalbar">🏛️ Transfer Bank Kalbar</option>
                          <option value="Transfer BRI">🏛️ Transfer Bank BRI</option>
                          <option value="QRIS DPC Patelki">📱 QRIS DPC Patelki KKU</option>
                          <option value="Potong Honorarium / Kegiatan">✂️ Potong Honor / Kegiatan DPC</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Tanggal Penerimaan Uang *
                        </label>
                        <input
                          type="date"
                          required
                          value={paidDate}
                          onChange={e => setPaidDate(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Catatan / Keterangan Pelunasan
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Contoh: Diterima langsung saat pertemuan rapat bulanan DPC"
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 outline-hidden"
                      />
                    </div>

                    <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-2xl flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 font-bold text-emerald-950 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={recordCash}
                          onChange={e => setRecordCash(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <span>Otomatis catat penerimaan uang di Buku Kas Masuk DPC</span>
                      </label>
                      <span className="font-mono font-black text-emerald-700 shrink-0">
                        +{formatCurrency(selectedTotalAmount)}
                      </span>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {isProcessing ? 'Menyimpan...' : `Simpan Pelunasan (${formatCurrency(selectedTotalAmount)})`}
                      </button>
                    </div>
                  </form>
                )}

                {/* Tab 2: Pembebasan / Pemutihan Tunggakan */}
                {activeTab === 'waive' && (
                  <form onSubmit={handleWaive} className="space-y-3.5 text-xs">
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl text-blue-900 text-[11px] leading-relaxed">
                      💡 <strong>Pembebasan Tunggakan:</strong> Mengubah status bulan terpilih menjadi <strong>"Nonaktif / Dibebaskan"</strong>. Bulan-bulan ini tidak akan lagi dihitung sebagai tunggakan atau beban iuran anggota.
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Alasan Pembebasan Kewajiban Iuran *
                      </label>
                      <select
                        value={waiveReason}
                        onChange={e => setWaiveReason(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 outline-hidden"
                      >
                        <option value="Anggota baru bergabung / penyesuaian periode awal">Anggota baru bergabung / penyesuaian periode awal</option>
                        <option value="Cuti kerja / tugas belajar / izin khusus">Cuti kerja / tugas belajar / izin khusus</option>
                        <option value="Pindahan dari DPC lain (Sudah lunas di DPC asal)">Pindahan dari DPC lain (Sudah lunas di DPC asal)</option>
                        <option value="Kebijakan pemutihan iuran pengurus DPC">Kebijakan pemutihan iuran pengurus DPC</option>
                        <option value="Lainnya">Alasan Lainnya</option>
                      </select>
                    </div>

                    <div className="pt-2 flex items-center justify-end">
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        {isProcessing ? 'Menerapkan...' : `Bebaskan ${selectedMonths.length} Bulan Tunggakan`}
                      </button>
                    </div>
                  </form>
                )}

                {/* Tab 3: Ubah Status Manual */}
                {activeTab === 'manual' && (
                  <form onSubmit={handleManualStatus} className="space-y-3.5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Set Status Menjadi *
                        </label>
                        <select
                          value={manualStatus}
                          onChange={e => setManualStatus(e.target.value as any)}
                          className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 outline-hidden"
                        >
                          <option value="paid">✅ LUNAS (Paid)</option>
                          <option value="unpaid">⚠️ BELUM BAYAR / MENUNGGAK (Unpaid)</option>
                          <option value="pending">⏳ MENUNGGU VERIFIKASI (Pending)</option>
                          <option value="inactive">⚪ NONAKTIF / DIBEBASKAN (Inactive)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Nominal Tarif per Bulan (Rp) *
                        </label>
                        <input
                          type="number"
                          required
                          value={customAmount}
                          onChange={e => setCustomAmount(Number(e.target.value))}
                          className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold font-mono text-slate-800 outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end">
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        {isProcessing ? 'Menyimpan...' : `Perbarui Status ${selectedMonths.length} Bulan`}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-slate-400 text-xs flex flex-col items-center gap-1.5">
                <Calendar className="w-6 h-6 text-slate-300" />
                <span>Silakan centang atau klik bulan di atas yang ingin diatur/dilunaskan oleh Bendahara.</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-4 px-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 text-[11px]">
            Tercatat untuk anggota: <strong>{member.nama}</strong> ({member.nap})
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* WhatsApp Modal Trigger if payment settled */}
      {waModalData && (
        <WhatsAppModal
          isOpen={true}
          onClose={() => setWaModalData(null)}
          recipientName={`${member.nama}, ${member.gelar || ''}`}
          recipientPhone={waModalData.phone}
          defaultMessage={waModalData.message}
          title="Kirim Kuitansi Pelunasan via WhatsApp"
        />
      )}
    </div>
  );
};
