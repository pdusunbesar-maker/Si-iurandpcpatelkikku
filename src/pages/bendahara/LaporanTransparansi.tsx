import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import * as XLSX from 'xlsx';
import { PatelkiLogo } from '../../components/PatelkiLogo';
import {
  FileText,
  Printer,
  FileSpreadsheet,
  Download,
  Calendar,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Heart,
  HeartHandshake,
  CheckCircle2,
} from 'lucide-react';

export const LaporanTransparansi: React.FC = () => {
  const {
    transactions,
    members,
    duesRecords,
    donations,
    socialServices,
    settings,
    formatCurrency,
  } = useApp();

  const [periodType, setPeriodType] = useState<'tahunan' | 'semester' | 'triwulan' | 'bulanan' | 'custom'>('tahunan');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(10);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(3); // Q3
  const [selectedSemester, setSelectedSemester] = useState<number>(2); // S2

  // Filter transactions according to selected period
  const filteredTransactions = transactions.filter(t => {
    const txDate = new Date(t.date);
    const txYear = txDate.getFullYear();
    const txMonth = txDate.getMonth() + 1;

    if (periodType === 'tahunan') return txYear === selectedYear;
    if (periodType === 'bulanan') return txYear === selectedYear && txMonth === selectedMonth;
    if (periodType === 'triwulan') {
      const q = Math.ceil(txMonth / 3);
      return txYear === selectedYear && q === selectedQuarter;
    }
    if (periodType === 'semester') {
      const s = txMonth <= 6 ? 1 : 2;
      return txYear === selectedYear && s === selectedSemester;
    }
    return true;
  });

  const incomeTransactions = filteredTransactions.filter(t => t.type === 'income');
  const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const netSurplus = totalIncome - totalExpense;

  // Initial balance estimation for report
  const initialBalance = 8500000;
  const finalBalance = initialBalance + netSurplus;

  const duesIncomeTotal = incomeTransactions
    .filter(t => t.category.toLowerCase().includes('iuran'))
    .reduce((sum, t) => sum + t.amount, 0);

  const donationIncomeTotal = incomeTransactions
    .filter(t => t.category.toLowerCase().includes('donasi'))
    .reduce((sum, t) => sum + t.amount, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const summaryData = [
      { Keterangan: 'Saldo Awal Periode', Nominal: initialBalance },
      { Keterangan: 'Total Pemasukan Kas', Nominal: totalIncome },
      { Keterangan: '  - Penerimaan Iuran Anggota', Nominal: duesIncomeTotal },
      { Keterangan: '  - Penerimaan Donasi & Sponsor', Nominal: donationIncomeTotal },
      { Keterangan: 'Total Pengeluaran Kas', Nominal: totalExpense },
      { Keterangan: 'Surplus / Defisit Periode', Nominal: netSurplus },
      { Keterangan: 'Saldo Akhir Kas', Nominal: finalBalance },
    ];

    const detailData = filteredTransactions.map((t, idx) => ({
      No: idx + 1,
      Tanggal: t.date,
      Jenis: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      Kategori: t.category,
      Keterangan: t.description,
      'Pihak Terkait': t.sourceOrRecipient,
      'Nominal (Rp)': t.amount,
    }));

    const workbook = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    const wsDetail = XLSX.utils.json_to_sheet(detailData);

    XLSX.utils.book_append_sheet(workbook, wsSummary, 'Ringkasan_Keuangan');
    XLSX.utils.book_append_sheet(workbook, wsDetail, 'Detail_Transaksi');
    XLSX.writeFile(workbook, `Laporan_Keuangan_Transparansi_Patelki_${selectedYear}.xlsx`);
  };

  const getPeriodLabel = () => {
    if (periodType === 'tahunan') return `Tahun Anggaran ${selectedYear}`;
    if (periodType === 'semester') return `Semester ${selectedSemester} Tahun ${selectedYear}`;
    if (periodType === 'triwulan') return `Triwulan (Kuartal) ${selectedQuarter} Tahun ${selectedYear}`;
    if (periodType === 'bulanan') return `Bulan ${selectedMonth} Tahun ${selectedYear}`;
    return 'Semua Periode';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header (Hidden on print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Laporan Keuangan & Transparansi
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
              Resmi DPC
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Laporan pertanggungjawaban kas organisasi profesi, siap dicetak dan diekspor.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            Cetak / Export PDF
          </button>
        </div>
      </div>

      {/* Filter Control Bar (Hidden on print) */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Pilih Periode:</span>
          <select
            value={periodType}
            onChange={e => setPeriodType(e.target.value as any)}
            className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-hidden"
          >
            <option value="tahunan">Tahunan</option>
            <option value="semester">Semesteran</option>
            <option value="triwulan">Triwulan</option>
            <option value="bulanan">Bulanan</option>
          </select>

          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-hidden"
          >
            {[2025, 2026, 2027, 2028, 2029, 2030, 2031].map(y => (
              <option key={y} value={y}>
                Tahun {y}
              </option>
            ))}
          </select>

          {periodType === 'triwulan' && (
            <select
              value={selectedQuarter}
              onChange={e => setSelectedQuarter(Number(e.target.value))}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-hidden"
            >
              <option value={1}>Triwulan I (Jan - Mar)</option>
              <option value={2}>Triwulan II (Apr - Jun)</option>
              <option value={3}>Triwulan III (Jul - Sep)</option>
              <option value={4}>Triwulan IV (Okt - Des)</option>
            </select>
          )}

          {periodType === 'semester' && (
            <select
              value={selectedSemester}
              onChange={e => setSelectedSemester(Number(e.target.value))}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-hidden"
            >
              <option value={1}>Semester 1 (Jan - Jun)</option>
              <option value={2}>Semester 2 (Jul - Des)</option>
            </select>
          )}
        </div>

        <div className="text-xs text-slate-600 font-bold bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
          Format Laporan: Standar Akuntansi Organisasi Profesi PATELKI
        </div>
      </div>

      {/* Official Printable Report Document */}
      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xl relative overflow-hidden" id="report-document">
        {/* Background Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-3">
          <PatelkiLogo size={500} />
        </div>

        {/* Kop Surat Resmi */}
        <div className="border-b-4 border-double border-slate-900 pb-5 flex items-center gap-5 sm:gap-7">
          <PatelkiLogo size={80} />
          <div className="flex-1">
            <h3 className="text-xs sm:text-sm font-bold tracking-widest text-emerald-800 uppercase">
              PERSATUAN AHLI TEKNOLOGI LABORATORIUM MEDIK INDONESIA (PATELKI)
            </h3>
            <h1 className="text-lg sm:text-2xl font-black text-slate-950 tracking-tight">
              DEWAN PENGURUS CABANG KABUPATEN KAYONG UTARA
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-600 mt-1 leading-snug">
              Sekretariat: {settings.address} • Kontak: {settings.contactWa} • Email: {settings.contactEmail}
            </p>
          </div>
        </div>

        {/* Title */}
        <div className="my-8 text-center">
          <h2 className="text-base sm:text-lg font-black tracking-wider text-slate-900 uppercase">
            LAPORAN KEUANGAN & TRANSPARANSI KAS
          </h2>
          <p className="text-xs font-bold text-amber-700 mt-1 font-mono uppercase tracking-widest">
            PERIODE: {getPeriodLabel()}
          </p>
        </div>

        {/* Financial Summary Table */}
        <div className="my-6">
          <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider mb-2 border-b border-slate-300 pb-1">
            I. RINGKASAN EKSEKUTIF KEUANGAN
          </h4>
          <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 font-black text-slate-800 text-[11px]">
                <tr>
                  <th className="p-3">Pos Pembukuan</th>
                  <th className="p-3 text-right">Jumlah (Rp)</th>
                  <th className="p-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="bg-slate-50/50">
                  <td className="p-3 font-bold text-slate-700">A. Saldo Awal Kas</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">{formatCurrency(initialBalance)}</td>
                  <td className="p-3 text-slate-500">Saldo kas awal pembukuan periode</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-emerald-800">B. Total Pemasukan Kas</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-800">{formatCurrency(totalIncome)}</td>
                  <td className="p-3 text-slate-500">Iuran anggota, donasi & penerimaan lain</td>
                </tr>
                <tr>
                  <td className="p-3 pl-6 text-slate-600">1. Penerimaan Iuran Anggota Terverifikasi</td>
                  <td className="p-3 text-right font-mono text-emerald-700">{formatCurrency(duesIncomeTotal)}</td>
                  <td className="p-3 text-slate-400">Tarif {formatCurrency(settings.monthlyFee)}/bln</td>
                </tr>
                <tr>
                  <td className="p-3 pl-6 text-slate-600">2. Penerimaan Donasi & Sponsor Mitra</td>
                  <td className="p-3 text-right font-mono text-emerald-700">{formatCurrency(donationIncomeTotal)}</td>
                  <td className="p-3 text-slate-400">Sumbangan terikat/bebas</td>
                </tr>
                <tr className="bg-red-50/30">
                  <td className="p-3 font-bold text-red-800">C. Total Pengeluaran Kas</td>
                  <td className="p-3 text-right font-mono font-bold text-red-800">{formatCurrency(totalExpense)}</td>
                  <td className="p-3 text-slate-500">Operasional, ATK, konsumsi & baksos</td>
                </tr>
                <tr className="bg-amber-50/50">
                  <td className="p-3 font-bold text-amber-950">D. Surplus / Defisit Bersih</td>
                  <td className="p-3 text-right font-mono font-black text-amber-900">{formatCurrency(netSurplus)}</td>
                  <td className="p-3 text-slate-500">Selisih Kas Masuk - Kas Keluar</td>
                </tr>
                <tr className="bg-slate-900 text-white font-black text-sm">
                  <td className="p-3.5">E. SALDO AKHIR KAS ORGANISASI</td>
                  <td className="p-3.5 text-right font-mono text-amber-300 font-extrabold">{formatCurrency(finalBalance)}</td>
                  <td className="p-3.5 text-slate-300 text-xs font-normal">Tersimpan di rekening resmi DPC</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Transactions Breakdown */}
        <div className="my-8">
          <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider mb-2 border-b border-slate-300 pb-1">
            II. RINCIAN TRANSAKSI KAS PERIODE INI
          </h4>
          <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 font-bold text-slate-700 text-[10px] uppercase">
                <tr>
                  <th className="p-2.5">Tanggal</th>
                  <th className="p-2.5">Kategori</th>
                  <th className="p-2.5">Keterangan</th>
                  <th className="p-2.5 text-right">Masuk (Rp)</th>
                  <th className="p-2.5 text-right">Keluar (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {filteredTransactions.map(t => (
                  <tr key={t.id}>
                    <td className="p-2.5 font-mono text-slate-600">{t.date}</td>
                    <td className="p-2.5 font-semibold text-slate-800">{t.category}</td>
                    <td className="p-2.5 text-slate-700">{t.description}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                      {t.type === 'income' ? formatCurrency(t.amount) : '—'}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-red-600">
                      {t.type === 'expense' ? formatCurrency(t.amount) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signatures Footer */}
        <div className="mt-12 pt-6 border-t-2 border-slate-300 flex items-end justify-between text-xs">
          <div className="text-center">
            <p className="text-slate-500 text-[11px]">Mengetahui & Menyetujui,</p>
            <p className="font-bold text-slate-900 mt-1">Ketua DPC Patelki Kayong Utara</p>
            <div className="h-20 flex items-center justify-center">
              <span className="text-[10px] text-slate-400 italic">[Tanda Tangan Digital]</span>
            </div>
            <p className="font-extrabold text-slate-950 underline">{settings.ketuaName}</p>
            <p className="text-[10px] text-slate-500">NAP: {settings.ketuaNap}</p>
          </div>

          <div className="text-center">
            <p className="text-slate-500 text-[11px]">Sukadana, {new Date().toLocaleDateString('id-ID')}</p>
            <p className="font-bold text-slate-900 mt-1">Bendahara DPC Patelki Kayong Utara</p>
            <div className="h-20 flex items-center justify-center relative">
              <div className="px-3 py-1 border border-emerald-600 rounded-lg text-emerald-800 font-bold text-[10px] uppercase">
                TERVERIFIKASI & SAH
              </div>
            </div>
            <p className="font-extrabold text-slate-950 underline">{settings.bendaharaName}</p>
            <p className="text-[10px] text-slate-500">NAP: {settings.bendaharaNap}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaporanTransparansi;
