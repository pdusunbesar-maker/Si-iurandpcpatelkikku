import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentSubmission } from '../../types';
import { ReceiptModal } from '../../components/ReceiptModal';
import {
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  History,
  CreditCard,
  User,
  Grid3X3,
  ChevronRight,
  ShieldCheck,
  Building,
  Phone,
  BookOpen,
  Printer,
} from 'lucide-react';

interface DashboardAnggotaProps {
  onNavigate: (page: string) => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const DashboardAnggota: React.FC<DashboardAnggotaProps> = ({ onNavigate }) => {
  const { currentMember, duesRecords, paymentSubmissions, settings, formatCurrency } = useApp();
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentSubmission | null>(null);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12 based on running calendar

  if (!currentMember) {
    return <div className="p-8 text-center text-slate-500">Anggota tidak ditemukan.</div>;
  }

  // Member dues analysis
  const memberDues2026 = duesRecords.filter(
    d => d.memberId === currentMember.id && d.year === currentYear
  );

  const currentMonthRecord = memberDues2026.find(d => d.month === currentMonth);
  const currentMonthStatus = currentMonthRecord?.status || 'unpaid';

  // Overall arrears (2025 up to Oct 2026)
  const allMemberDues = duesRecords.filter(
    d => d.memberId === currentMember.id && d.year <= currentYear
  );

  const unpaidRecords = allMemberDues.filter(
    d => d.status === 'unpaid' && !(d.year === currentYear && d.month > currentMonth)
  );

  const paidRecords2026 = memberDues2026.filter(d => d.status === 'paid');
  const pendingRecords = allMemberDues.filter(d => d.status === 'pending');

  const totalPaidThisYear = paidRecords2026.reduce((sum, d) => sum + d.amount, 0);
  const totalArrears = unpaidRecords.reduce((sum, d) => sum + d.amount, 0);

  // Recent submissions
  const mySubmissions = paymentSubmissions.filter(s => s.memberId === currentMember.id);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-emerald-700/40">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={
                currentMember.foto ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                  currentMember.nama
                )}`
              }
              alt={currentMember.nama}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-amber-400 shrink-0 shadow-md"
            />
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-700/80 text-amber-300 text-xs font-bold mb-1.5 border border-emerald-600">
                <ShieldCheck className="w-3.5 h-3.5" />
                Anggota Aktif DPC Patelki Kayong Utara
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Halo, {currentMember.nama}, {currentMember.gelar} 👋
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5 font-mono">
                NAP: {currentMember.nap} • {currentMember.instansi}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('bayar-iuran')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <Send className="w-4 h-4" />
            Bayar Iuran Online
          </button>
        </div>
      </div>

      {/* 3 Core KPI Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Bulan Ini Status */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Status Iuran Bulan Ini
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </span>
          </div>

          <div className="my-4">
            {currentMonthStatus === 'paid' ? (
              <div className="flex items-center gap-2.5 text-emerald-700">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                <div>
                  <div className="text-xl font-black">LUNAS ✅</div>
                  <div className="text-xs text-slate-500">Iuran terverifikasi</div>
                </div>
              </div>
            ) : currentMonthStatus === 'pending' ? (
              <div className="flex items-center gap-2.5 text-amber-700">
                <Clock className="w-8 h-8 text-amber-500 animate-spin" />
                <div>
                  <div className="text-xl font-black">PROSES VERIFIKASI</div>
                  <div className="text-xs text-slate-500">Menunggu persetujuan bendahara</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 text-red-600">
                <XCircle className="w-8 h-8 text-red-500" />
                <div>
                  <div className="text-xl font-black">BELUM DIBAYAR</div>
                  <div className="text-xs text-slate-500">Rp30.000 / bulan</div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('bayar-iuran')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
          >
            Lakukan Pembayaran →
          </button>
        </div>

        {/* Tunggakan Saya */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Tunggakan Saya
            </span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>

          <div className="my-4">
            <div className={`text-2xl sm:text-3xl font-black font-mono ${totalArrears > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
              {formatCurrency(totalArrears)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {unpaidRecords.length > 0
                ? `${unpaidRecords.length} bulan belum disetorkan`
                : 'Tidak ada tunggakan. Terima kasih!'}
            </p>
          </div>

          <button
            onClick={() => onNavigate('bayar-iuran')}
            className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1"
          >
            Lunasi Sekarang →
          </button>
        </div>

        {/* Total Dibayar Tahun Ini */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Dibayar Tahun {currentYear}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="my-4">
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-800">
              {formatCurrency(totalPaidThisYear)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {paidRecords2026.length} dari 12 bulan lunas
            </p>
          </div>

          <button
            onClick={() => onNavigate('matrix-saya')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
          >
            Lihat Matrix 12 Bulan Saya →
          </button>
        </div>
      </div>

      {/* Navigation Quick Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate('bayar-iuran')}
          className="p-5 bg-amber-500 text-slate-950 rounded-2xl font-black text-left shadow-md hover:bg-amber-400 transition-all group"
        >
          <Send className="w-6 h-6 mb-2 group-hover:translate-x-1 transition-transform" />
          <div className="text-sm">Bayar Iuran Online</div>
          <div className="text-[11px] font-medium opacity-80 mt-0.5">Pilih bulan & upload bukti</div>
        </button>

        <button
          onClick={() => onNavigate('matrix-saya')}
          className="p-5 bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl text-left shadow-xs transition-all group"
        >
          <Grid3X3 className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
          <div className="text-sm font-extrabold text-slate-900">Matrix 12 Bulan</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Status iuran Jan–Des</div>
        </button>

        <button
          onClick={() => onNavigate('riwayat-saya')}
          className="p-5 bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl text-left shadow-xs transition-all group"
        >
          <History className="w-6 h-6 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
          <div className="text-sm font-extrabold text-slate-900">Riwayat & Kuitansi</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Unduh bukti resmi</div>
        </button>

        <button
          onClick={() => onNavigate('info-rekening')}
          className="p-5 bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl text-left shadow-xs transition-all group"
        >
          <CreditCard className="w-6 h-6 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
          <div className="text-sm font-extrabold text-slate-900">Rekening & QRIS</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Bank Kalbar & BRI DPC</div>
        </button>
      </div>

      {/* Transparansi Kas DPC Callout Banner */}
      <div className="p-5 sm:p-6 bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                Transparansi & Rekapitulasi Kas DPC
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                Terbuka
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Lihat saldo terkini, alokasi anggaran, rincian pengeluaran kegiatan, serta jurnal kas masuk dan keluar DPC Patelki Kayong Utara.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('rekap-kas-anggota')}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
        >
          Buka Rekap Keuangan Kas →
        </button>
      </div>

      {/* Recent Submission Status List */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-black text-slate-900">Pengajuan Pembayaran Terbaru Saya</h2>
            <p className="text-xs text-slate-500 mt-0.5">Status verifikasi oleh Bendahara DPC</p>
          </div>
          <button
            onClick={() => onNavigate('riwayat-saya')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            Lihat Semua Riwayat →
          </button>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {mySubmissions.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Belum ada riwayat pembayaran yang diajukan.
            </div>
          ) : (
            mySubmissions.slice(0, 3).map(sub => (
              <div key={sub.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      Iuran {sub.months.length} Bulan ({sub.bankName})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        sub.status === 'pending'
                          ? 'bg-amber-100 text-amber-900'
                          : sub.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-red-100 text-red-900'
                      }`}
                    >
                      {sub.status === 'pending'
                        ? 'Menunggu Verifikasi'
                        : sub.status === 'approved'
                        ? 'Disetujui'
                        : 'Ditolak'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tanggal: {sub.submittedAt}
                  </p>
                </div>

                <div className="text-right flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatCurrency(sub.totalAmount)}
                  </span>
                  {sub.status === 'approved' && (
                    <button
                      type="button"
                      onClick={() => setSelectedReceipt(sub)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
                      title="Lihat Kuitansi"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Kuitansi
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          submission={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};

export default DashboardAnggota;
