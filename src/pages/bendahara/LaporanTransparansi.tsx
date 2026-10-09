import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
  Edit3,
  DollarSign,
  Info,
  Check,
  X,
  ShieldCheck,
  PieChart,
  BarChart2,
} from 'lucide-react';

export const LaporanTransparansi: React.FC = () => {
  const {
    transactions,
    members,
    duesRecords,
    donations,
    socialServices,
    settings,
    updateSettings,
    formatCurrency,
  } = useApp();

  const [periodType, setPeriodType] = useState<'tahunan' | 'semester' | 'triwulan' | 'bulanan' | 'semua'>('tahunan');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(10);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(3); // Q3
  const [selectedSemester, setSelectedSemester] = useState<number>(2); // S2

  // Modal for editing initial balance
  const [showEditBalanceModal, setShowEditBalanceModal] = useState(false);
  const [tempInitialBalance, setTempInitialBalance] = useState<number>(settings.initialBalance ?? 0);

  // Initial cash balance state derived from settings (editable)
  const initialBalance = settings.initialBalance ?? 0;

  // Filter transactions according to selected period
  const filteredTransactions = transactions.filter(t => {
    if (!t.date) return false;
    const txDate = new Date(t.date);
    const txYear = txDate.getFullYear();
    const txMonth = txDate.getMonth() + 1;

    if (periodType === 'semua') return true;
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
  const finalBalance = initialBalance + netSurplus;

  // Detailed Income Categorization (100% Synchronized)
  const duesIncomeTotal = incomeTransactions
    .filter(t => t.category.toLowerCase().includes('iuran') || t.relatedPaymentId)
    .reduce((sum, t) => sum + t.amount, 0);

  const donationIncomeTotal = incomeTransactions
    .filter(t => t.category.toLowerCase().includes('donasi') || t.category.toLowerCase().includes('sponsor'))
    .reduce((sum, t) => sum + t.amount, 0);

  const otherIncomeTotal = totalIncome - (duesIncomeTotal + donationIncomeTotal);

  // Detailed Expense Categorization (100% Synchronized)
  const operasionalExpenseTotal = expenseTransactions
    .filter(t => t.category.toLowerCase().includes('operasional') || t.category.toLowerCase().includes('atk'))
    .reduce((sum, t) => sum + t.amount, 0);

  const baksosExpenseTotal = expenseTransactions
    .filter(t => t.category.toLowerCase().includes('bakti') || t.category.toLowerCase().includes('pengabdian'))
    .reduce((sum, t) => sum + t.amount, 0);

  const seminarExpenseTotal = expenseTransactions
    .filter(t => t.category.toLowerCase().includes('ilmiah') || t.category.toLowerCase().includes('seminar') || t.category.toLowerCase().includes('workshop'))
    .reduce((sum, t) => sum + t.amount, 0);

  const dpwExpenseTotal = expenseTransactions
    .filter(t => t.category.toLowerCase().includes('dpw') || t.category.toLowerCase().includes('transport'))
    .reduce((sum, t) => sum + t.amount, 0);

  const otherExpenseTotal = totalExpense - (operasionalExpenseTotal + baksosExpenseTotal + seminarExpenseTotal + dpwExpenseTotal);

  const handleSaveInitialBalance = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ initialBalance: Number(tempInitialBalance) });
    setShowEditBalanceModal(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Header
    doc.setFontSize(10);
    doc.setTextColor(20, 83, 45); // emerald-800
    doc.text('PERSATUAN AHLI TEKNOLOGI LABORATORIUM MEDIK INDONESIA (PATELKI)', 14, 15);
    
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('DEWAN PENGURUS CABANG KABUPATEN KAYONG UTARA', 14, 22);
    
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Sekretariat: ${settings.address} | Kontak: ${settings.contactWa} | Email: ${settings.contactEmail}`, 14, 28);
    
    doc.setLineWidth(0.5);
    doc.line(14, 32, 196, 32);

    // Title
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('LAPORAN KEUANGAN & TRANSPARANSI KAS ORGANISASI', 105, 40, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setTextColor(180, 83, 9); // amber-700
    doc.text(`PERIODE: ${getPeriodLabel().toUpperCase()}`, 105, 46, { align: 'center' });

    // Summary Table
    const summaryRows = [
      ['A. Saldo Awal Kas Periode', formatCurrency(initialBalance), 'Saldo kas awal pembukuan'],
      ['B. Total Pemasukan Kas', formatCurrency(totalIncome), 'Iuran, donasi, & penerimaan'],
      ['   - Penerimaan Iuran Anggota', formatCurrency(duesIncomeTotal), `Tarif ${formatCurrency(settings.monthlyFee)}/bln`],
      ['   - Penerimaan Donasi & Sponsor', formatCurrency(donationIncomeTotal), 'Sumbangan terikat/bebas'],
      ...(otherIncomeTotal > 0 ? [['   - Penerimaan Lain-Lain', formatCurrency(otherIncomeTotal), 'Non-iuran']] : []),
      ['C. Total Pengeluaran Kas', formatCurrency(totalExpense), 'Operasional, ATK, baksos, dll.'],
      ['   - Operasional & Kesekretariatan', formatCurrency(operasionalExpenseTotal), 'Operasional rutin'],
      ['   - Bakti Sosial & Pengabdian', formatCurrency(baksosExpenseTotal), 'Pengabdian masyarakat'],
      ...(seminarExpenseTotal > 0 ? [['   - Kegiatan Ilmiah & Seminar', formatCurrency(seminarExpenseTotal), 'Peningkatan kapasitas']] : []),
      ...(dpwExpenseTotal > 0 ? [['   - Setoran DPW & Transport', formatCurrency(dpwExpenseTotal), 'Kewajiban organisasi']] : []),
      ...(otherExpenseTotal > 0 ? [['   - Pengeluaran Lain-Lain', formatCurrency(otherExpenseTotal), 'Lain-lain']] : []),
      ['D. Surplus / Defisit Bersih', formatCurrency(netSurplus), 'Total Masuk - Total Keluar'],
      ['E. SALDO AKHIR KAS ORGANISASI', formatCurrency(finalBalance), 'Tersimpan di rekening resmi DPC'],
    ];

    (doc as any).autoTable({
      startY: 52,
      head: [['Pos Pembukuan Kas', 'Jumlah (Rp)', 'Keterangan Sumber / Pos']],
      body: summaryRows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 45, halign: 'right' }, 2: { cellWidth: 57 } },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Detailed Transactions Table
    const detailRows = filteredTransactions.map((t, idx) => [
      idx + 1,
      t.date,
      t.category,
      t.description,
      t.type === 'income' ? formatCurrency(t.amount) : '—',
      t.type === 'expense' ? formatCurrency(t.amount) : '—',
    ]);

    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('II. RINCIAN BUKU KAS TRANSAKSI PERIODE INI', 14, finalY);

    (doc as any).autoTable({
      startY: finalY + 4,
      head: [['No', 'Tanggal', 'Kategori', 'Uraian Transaksi', 'Masuk (Rp)', 'Keluar (Rp)']],
      body: detailRows.length > 0 ? detailRows : [[{ content: 'Tidak ada transaksi kas pada periode terpilih ini.', colSpan: 6, styles: { halign: 'center', fontStyle: 'italic' } }]],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5 },
      columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 1: { cellWidth: 22 }, 2: { cellWidth: 32 }, 3: { cellWidth: 64 }, 4: { cellWidth: 34, halign: 'right' }, 5: { cellWidth: 34, halign: 'right' } },
    });

    const signY = (doc as any).lastAutoTable.finalY + 15;
    
    if (signY > 250) {
      doc.addPage();
    }

    const currentSignY = signY > 250 ? 30 : signY;

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Mengetahui & Menyetujui,', 25, currentSignY);
    doc.text(`Sukadana, ${new Date().toLocaleDateString('id-ID')}`, 145, currentSignY);

    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Ketua DPC Patelki Kayong Utara', 25, currentSignY + 5);
    doc.text('Bendahara DPC Patelki Kayong Utara', 135, currentSignY + 5);

    doc.setFontSize(8);
    doc.text(`( ${settings.ketuaName} )`, 28, currentSignY + 25);
    doc.text(`NAP: ${settings.ketuaNap}`, 31, currentSignY + 29);

    doc.text(`( ${settings.bendaharaName} )`, 143, currentSignY + 25);
    doc.text(`NAP: ${settings.bendaharaNap}`, 146, currentSignY + 29);

    doc.save(`Laporan_Keuangan_Transparansi_Patelki_${selectedYear}.pdf`);
  };

  const handleExportExcel = () => {
    const summaryData = [
      { Keterangan: 'A. Saldo Awal Kas Periode', Nominal: initialBalance, Catatan: 'Saldo kas awal pembukuan' },
      { Keterangan: 'B. Total Pemasukan Kas', Nominal: totalIncome, Catatan: 'Iuran, donasi, & penerimaan' },
      { Keterangan: '  - Penerimaan Iuran Anggota Terverifikasi', Nominal: duesIncomeTotal, Catatan: `Tarif ${formatCurrency(settings.monthlyFee)}/bln` },
      { Keterangan: '  - Penerimaan Donasi & Sponsor Mitra', Nominal: donationIncomeTotal, Catatan: 'Sumbangan terikat/bebas' },
      { Keterangan: '  - Penerimaan Lain-Lain', Nominal: otherIncomeTotal > 0 ? otherIncomeTotal : 0, Catatan: 'Non-iuran' },
      { Keterangan: 'C. Total Pengeluaran Kas', Nominal: totalExpense, Catatan: 'Operasional, ATK, baksos, dll.' },
      { Keterangan: '  - Operasional & ATK Kesekretariatan', Nominal: operasionalExpenseTotal, Catatan: 'Operasional rutin' },
      { Keterangan: '  - Kegiatan Bakti Sosial & Pengabdian', Nominal: baksosExpenseTotal, Catatan: 'Pengabdian masyarakat' },
      { Keterangan: '  - Kegiatan Ilmiah & Seminar', Nominal: seminarExpenseTotal, Catatan: 'Peningkatan kapasitas ATLM' },
      { Keterangan: '  - Setoran Ke DPW & Transport Akomodasi', Nominal: dpwExpenseTotal, Catatan: 'Kewajiban organisasi' },
      { Keterangan: '  - Pengeluaran Kas Lainnya', Nominal: otherExpenseTotal > 0 ? otherExpenseTotal : 0, Catatan: 'Lain-lain' },
      { Keterangan: 'D. Surplus / Defisit Bersih Periode', Nominal: netSurplus, Catatan: 'Total Masuk - Total Keluar' },
      { Keterangan: 'E. SALDO AKHIR KAS ORGANISASI', Nominal: finalBalance, Catatan: 'Tersimpan di rekening resmi DPC' },
    ];

    const detailData = filteredTransactions.map((t, idx) => ({
      No: idx + 1,
      Tanggal: t.date,
      Jenis: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      Kategori: t.category,
      Keterangan: t.description,
      'Pihak Terkait': t.sourceOrRecipient,
      'Nominal (Rp)': t.amount,
      Pencatat: t.recordedBy || settings.bendaharaName,
    }));

    const workbook = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    const wsDetail = XLSX.utils.json_to_sheet(detailData);

    XLSX.utils.book_append_sheet(workbook, wsSummary, 'Ringkasan_Keuangan');
    XLSX.utils.book_append_sheet(workbook, wsDetail, 'Detail_Transaksi');
    XLSX.writeFile(workbook, `Laporan_Keuangan_Transparansi_Patelki_${selectedYear}.xlsx`);
  };

  const getPeriodLabel = () => {
    if (periodType === 'semua') return 'Semua Periode Pembukuan (Januari 2025 - Sekarang)';
    if (periodType === 'tahunan') return `Tahun Anggaran ${selectedYear}`;
    if (periodType === 'semester') return `Semester ${selectedSemester} Tahun ${selectedYear}`;
    if (periodType === 'triwulan') return `Triwulan (Kuartal) ${selectedQuarter} Tahun ${selectedYear}`;
    if (periodType === 'bulanan') return `Bulan ${selectedMonth} Tahun ${selectedYear}`;
    return 'Periode Kalender';
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
            Laporan pertanggungjawaban kas organisasi profesi, saldo awal editable, dan terintegrasi otomatis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setTempInitialBalance(initialBalance);
              setShowEditBalanceModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition-colors shadow-xs cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            Edit Saldo Awal Kas
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export PDF Resmi
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak / Export PDF
          </button>
        </div>
      </div>

      {/* Filter & Control Bar (Hidden on print) */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Pilih Periode Laporan:</span>
          <select
            value={periodType}
            onChange={e => setPeriodType(e.target.value as any)}
            className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-hidden cursor-pointer"
          >
            <option value="tahunan">Tahunan</option>
            <option value="semester">Semesteran</option>
            <option value="triwulan">Triwulan</option>
            <option value="bulanan">Bulanan</option>
            <option value="semua">Semua Periode</option>
          </select>

          {periodType !== 'semua' && (
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-hidden cursor-pointer"
            >
              {[2025, 2026, 2027, 2028, 2029, 2030, 2031].map(y => (
                <option key={y} value={y}>
                  Tahun {y}
                </option>
              ))}
            </select>
          )}

          {periodType === 'triwulan' && (
            <select
              value={selectedQuarter}
              onChange={e => setSelectedQuarter(Number(e.target.value))}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-hidden cursor-pointer"
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
              className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-hidden cursor-pointer"
            >
              <option value={1}>Semester 1 (Jan - Jun)</option>
              <option value={2}>Semester 2 (Jul - Des)</option>
            </select>
          )}

          {periodType === 'bulanan' && (
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-hidden cursor-pointer"
            >
              {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (
                <option key={i + 1} value={i + 1}>
                  Bulan {m}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 font-bold bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          Format Akuntansi DPC PATELKI (100% Sinkron)
        </div>
      </div>

      {/* KPI Highlight Banner (Hidden on print) */}
      <div className="no-print grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Saldo Awal Kas</span>
            <button
              type="button"
              onClick={() => {
                setTempInitialBalance(initialBalance);
                setShowEditBalanceModal(true);
              }}
              className="text-indigo-600 hover:underline text-[11px] font-bold"
            >
              Edit
            </button>
          </div>
          <p className="text-lg font-black text-slate-900 font-mono mt-1">
            {formatCurrency(initialBalance)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Edit untuk mengubah saldo acuan</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-emerald-800 font-bold">Total Pemasukan</div>
          <p className="text-lg font-black text-emerald-700 font-mono mt-1">
            {formatCurrency(totalIncome)}
          </p>
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">{incomeTransactions.length} transaksi masuk</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-red-800 font-bold">Total Pengeluaran</div>
          <p className="text-lg font-black text-red-700 font-mono mt-1">
            {formatCurrency(totalExpense)}
          </p>
          <p className="text-[10px] text-red-600 font-medium mt-0.5">{expenseTransactions.length} transaksi keluar</p>
        </div>

        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xs">
          <div className="text-xs text-amber-300 font-bold">Saldo Akhir Kas Real</div>
          <p className="text-lg font-black text-amber-300 font-mono mt-1">
            {formatCurrency(finalBalance)}
          </p>
          <p className="text-[10px] text-slate-300 mt-0.5">Saldo awal + Surplus periode</p>
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
          <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider mb-2 border-b border-slate-300 pb-1 flex items-center justify-between">
            <span>I. RINGKASAN EKSEKUTIF KEUANGAN ORGANISASI</span>
            <span className="no-print text-[10px] text-indigo-600 font-normal">
              (Saldo Awal dapat diubah via tombol Edit Saldo Awal)
            </span>
          </h4>
          <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 font-black text-slate-800 text-[11px]">
                <tr>
                  <th className="p-3">Pos Pembukuan Kas</th>
                  <th className="p-3 text-right">Jumlah (Rp)</th>
                  <th className="p-3">Keterangan Sumber / Pos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {/* Saldo Awal */}
                <tr className="bg-indigo-50/50">
                  <td className="p-3 font-bold text-indigo-950 flex items-center gap-1.5">
                    A. Saldo Awal Kas Periode
                    <span className="no-print text-[10px] text-indigo-600 font-semibold cursor-pointer" onClick={() => setShowEditBalanceModal(true)}>
                      (Edit)
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-indigo-900 text-sm">
                    {formatCurrency(initialBalance)}
                  </td>
                  <td className="p-3 text-slate-500">Saldo kas awal pembukuan periode</td>
                </tr>

                {/* Total Pemasukan */}
                <tr className="bg-emerald-50/40">
                  <td className="p-3 font-extrabold text-emerald-900">B. Total Pemasukan Kas (Real-Time)</td>
                  <td className="p-3 text-right font-mono font-extrabold text-emerald-800 text-sm">
                    {formatCurrency(totalIncome)}
                  </td>
                  <td className="p-3 text-slate-500 font-medium">Iuran anggota, donasi, & penerimaan lain</td>
                </tr>
                <tr>
                  <td className="p-3 pl-7 text-slate-700 font-medium">1. Penerimaan Iuran Wajib Anggota</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-700">{formatCurrency(duesIncomeTotal)}</td>
                  <td className="p-3 text-slate-400">Tarif {formatCurrency(settings.monthlyFee)}/bln per anggota</td>
                </tr>
                <tr>
                  <td className="p-3 pl-7 text-slate-700 font-medium">2. Penerimaan Donasi & Sponsor Mitra</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-700">{formatCurrency(donationIncomeTotal)}</td>
                  <td className="p-3 text-slate-400">Sumbangan terikat/bebas & mitra</td>
                </tr>
                {otherIncomeTotal > 0 && (
                  <tr>
                    <td className="p-3 pl-7 text-slate-700 font-medium">3. Penerimaan Lain-Lain / Non-Iuran</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">{formatCurrency(otherIncomeTotal)}</td>
                    <td className="p-3 text-slate-400">Pendapatan kegiatan / bunga kas</td>
                  </tr>
                )}

                {/* Total Pengeluaran */}
                <tr className="bg-red-50/40">
                  <td className="p-3 font-extrabold text-red-900">C. Total Pengeluaran Kas (Real-Time)</td>
                  <td className="p-3 text-right font-mono font-extrabold text-red-800 text-sm">
                    {formatCurrency(totalExpense)}
                  </td>
                  <td className="p-3 text-slate-500 font-medium">Operasional, ATK, baksos, & kepengurusan</td>
                </tr>
                <tr>
                  <td className="p-3 pl-7 text-slate-700 font-medium">1. Operasional Organisasi & ATK Kesekretariatan</td>
                  <td className="p-3 text-right font-mono font-bold text-red-700">{formatCurrency(operasionalExpenseTotal)}</td>
                  <td className="p-3 text-slate-400">Belanja ATK, cetak, rapat rutin</td>
                </tr>
                <tr>
                  <td className="p-3 pl-7 text-slate-700 font-medium">2. Kegiatan Bakti Sosial & Pengabdian Masyarakat</td>
                  <td className="p-3 text-right font-mono font-bold text-red-700">{formatCurrency(baksosExpenseTotal)}</td>
                  <td className="p-3 text-slate-400">Pengabdian, pemeriksaan lab gratis, santunan</td>
                </tr>
                {seminarExpenseTotal > 0 && (
                  <tr>
                    <td className="p-3 pl-7 text-slate-700 font-medium">3. Kegiatan Ilmiah & Seminar ATLM</td>
                    <td className="p-3 text-right font-mono font-bold text-red-700">{formatCurrency(seminarExpenseTotal)}</td>
                    <td className="p-3 text-slate-400">Peningkatan kapasitas anggota</td>
                  </tr>
                )}
                {dpwExpenseTotal > 0 && (
                  <tr>
                    <td className="p-3 pl-7 text-slate-700 font-medium">4. Setoran Wajib ke DPW Kalbar & Transport Akomodasi</td>
                    <td className="p-3 text-right font-mono font-bold text-red-700">{formatCurrency(dpwExpenseTotal)}</td>
                    <td className="p-3 text-slate-400">Kewajiban organisasi atas</td>
                  </tr>
                )}
                {otherExpenseTotal > 0 && (
                  <tr>
                    <td className="p-3 pl-7 text-slate-700 font-medium">5. Pengeluaran Kas Lain-Lain</td>
                    <td className="p-3 text-right font-mono font-bold text-red-700">{formatCurrency(otherExpenseTotal)}</td>
                    <td className="p-3 text-slate-400">Pengeluaran tidak terduga</td>
                  </tr>
                )}

                {/* Surplus / Defisit */}
                <tr className="bg-amber-50/60">
                  <td className="p-3 font-black text-amber-950">D. Surplus / Defisit Bersih Periode Ini</td>
                  <td className={`p-3 text-right font-mono font-black text-sm ${netSurplus >= 0 ? 'text-emerald-800' : 'text-red-700'}`}>
                    {formatCurrency(netSurplus)}
                  </td>
                  <td className="p-3 text-slate-500 font-medium">Selisih Kas Masuk - Kas Keluar Periode Ini</td>
                </tr>

                {/* Saldo Akhir Kas */}
                <tr className="bg-slate-900 text-white font-black text-sm">
                  <td className="p-4">E. SALDO AKHIR KAS ORGANISASI (REKAPITULASI)</td>
                  <td className="p-4 text-right font-mono text-amber-300 font-extrabold text-base">
                    {formatCurrency(finalBalance)}
                  </td>
                  <td className="p-4 text-slate-300 text-xs font-normal">Tersimpan di rekening resmi DPC PATELKI KKU</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Transactions Breakdown */}
        <div className="my-8">
          <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider mb-2 border-b border-slate-300 pb-1 flex items-center justify-between">
            <span>II. RINCIAN BUKU KAS TRANSAKSI PERIODE INI</span>
            <span className="text-[11px] text-slate-500 font-bold">
              Total {filteredTransactions.length} Transaksi Terpilih
            </span>
          </h4>

          <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="p-2.5 w-8 text-center">No</th>
                  <th className="p-2.5">Tanggal</th>
                  <th className="p-2.5">Kategori</th>
                  <th className="p-2.5">Uraian Transaksi</th>
                  <th className="p-2.5">Pihak Terkait</th>
                  <th className="p-2.5 text-right">Masuk (Rp)</th>
                  <th className="p-2.5 text-right">Keluar (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px]">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-400 italic">
                      Tidak ada transaksi kas pada periode terpilih ini.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="p-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-2.5 font-mono text-slate-700 whitespace-nowrap">{t.date}</td>
                      <td className="p-2.5 font-bold text-slate-900">{t.category}</td>
                      <td className="p-2.5 text-slate-700">{t.description}</td>
                      <td className="p-2.5 text-slate-600 font-medium">{t.sourceOrRecipient}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                        {t.type === 'income' ? formatCurrency(t.amount) : '—'}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-red-600">
                        {t.type === 'expense' ? formatCurrency(t.amount) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300 text-xs">
                <tr>
                  <td colSpan={5} className="p-3 text-right uppercase">Total Pembukuan Kas Periode Ini:</td>
                  <td className="p-3 text-right font-mono text-emerald-800 font-extrabold">{formatCurrency(totalIncome)}</td>
                  <td className="p-3 text-right font-mono text-red-800 font-extrabold">{formatCurrency(totalExpense)}</td>
                </tr>
              </tfoot>
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

      {/* Edit Saldo Awal Modal */}
      {showEditBalanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">Edit Saldo Awal Kas Organisasi</h3>
                  <p className="text-xs text-slate-500">Ubah nominal acuan saldo awal pembukuan DPC</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditBalanceModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInitialBalance} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nominal Saldo Awal Kas (Rp) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">Rp</span>
                  <input
                    type="number"
                    required
                    value={tempInitialBalance}
                    onChange={e => setTempInitialBalance(Number(e.target.value))}
                    placeholder="8500000"
                    className="w-full pl-10 pr-3 py-2.5 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:border-indigo-500 outline-hidden"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                  Saldo awal ini menjadi titik awal rekapitulasi. Saldo akhir akan dihitung otomatis sebagai: <strong className="text-slate-800">Saldo Awal + Surplus/Defisit Periode</strong>.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between font-bold text-slate-600">
                  <span>Pratinjau Saldo Awal:</span>
                  <span className="font-mono text-indigo-700">{formatCurrency(tempInitialBalance)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-600">
                  <span>Surplus/Defisit Periode Ini:</span>
                  <span className="font-mono text-slate-800">{formatCurrency(netSurplus)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Pratinjau Saldo Akhir:</span>
                  <span className="font-mono text-emerald-700">{formatCurrency(tempInitialBalance + netSurplus)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditBalanceModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Simpan Saldo Awal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaporanTransparansi;
