import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  FileSpreadsheet,
  Download,
  Printer,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
  Sparkles,
  Info,
  RotateCcw,
  ShieldCheck,
  Check,
  Percent,
  SlidersHorizontal,
} from 'lucide-react';
import { PatelkiLogo } from '../../components/PatelkiLogo';
import {
  exportBudgetReportExcel,
  exportBudgetReportPDF,
  exportBudgetReportCSV,
  BudgetItemExport,
} from '../../utils/exportFinancialReports';

interface BudgetCategoryPlan {
  category: string;
  type: 'income' | 'expense';
  budgetAmount: number;
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export const LaporanAnggaranTahunan: React.FC = () => {
  const {
    transactions,
    duesRecords,
    members,
    settings,
    formatCurrency,
    addActivityLog,
  } = useApp();

  const currentCalendarYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentCalendarYear);
  const [activeTab, setActiveTab] = useState<'overview' | 'expense_breakdown' | 'monthly_trend'>('overview');
  const [tableFilter, setTableFilter] = useState<'all' | 'income' | 'expense' | 'variance'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Active members count
  const activeMembers = useMemo(() => members.filter(m => m.status === 'aktif'), [members]);
  const activeCount = activeMembers.length;

  // Annual Dues Potential: active members * monthlyFee * 12 months
  const estimatedDuesPotential = useMemo(() => {
    return activeCount * settings.monthlyFee * 12;
  }, [activeCount, settings.monthlyFee]);

  // Default Budget Baseline generator for a given year
  const getDefaultBudgetPlan = (year: number): BudgetCategoryPlan[] => {
    return [
      // 1. PENDAPATAN
      {
        category: 'Iuran Wajib Anggota',
        type: 'income',
        budgetAmount: estimatedDuesPotential > 0 ? estimatedDuesPotential : 10800000,
      },
      {
        category: 'Donasi & Sumbangan Sukarela',
        type: 'income',
        budgetAmount: 2500000,
      },
      {
        category: 'Bantuan CSR / Sponsor',
        type: 'income',
        budgetAmount: 3500000,
      },
      {
        category: 'Pemasukan Kegiatan Seminar/Workshop',
        type: 'income',
        budgetAmount: 6000000,
      },
      {
        category: 'Pendapatan Bunga Kas',
        type: 'income',
        budgetAmount: 300000,
      },
      {
        category: 'Lainnya',
        type: 'income',
        budgetAmount: 500000,
      },

      // 2. BELANJA / PENGELUARAN
      {
        category: 'Operasional Organisasi',
        type: 'expense',
        budgetAmount: 3000000,
      },
      {
        category: 'ATK & Kesekretariatan',
        type: 'expense',
        budgetAmount: 2000000,
      },
      {
        category: 'Transport & Akomodasi',
        type: 'expense',
        budgetAmount: 1800000,
      },
      {
        category: 'Konsumsi & Rapat',
        type: 'expense',
        budgetAmount: 2500000,
      },
      {
        category: 'Kegiatan Ilmiah & Seminar',
        type: 'expense',
        budgetAmount: 4500000,
      },
      {
        category: 'Bakti Sosial & Pengabdian',
        type: 'expense',
        budgetAmount: 3500000,
      },
      {
        category: 'Iuran Wajib ke DPW Kalbar',
        type: 'expense',
        budgetAmount: 2000000,
      },
      {
        category: 'Administrasi Bank & Server',
        type: 'expense',
        budgetAmount: 600000,
      },
      {
        category: 'Lainnya',
        type: 'expense',
        budgetAmount: 1000000,
      },
    ];
  };

  // State for Custom Budget Plan
  const [budgetPlan, setBudgetPlan] = useState<BudgetCategoryPlan[]>(() => {
    const saved = localStorage.getItem(`patelki_annual_budget_${selectedYear}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved budget plan:', e);
      }
    }
    return getDefaultBudgetPlan(selectedYear);
  });

  // Reload budget plan when year changes
  useEffect(() => {
    const saved = localStorage.getItem(`patelki_annual_budget_${selectedYear}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBudgetPlan(parsed);
          return;
        }
      } catch (e) {
        console.error('Failed to parse saved budget plan for year', selectedYear, e);
      }
    }
    setBudgetPlan(getDefaultBudgetPlan(selectedYear));
  }, [selectedYear]);

  // Temporary editing state for modal
  const [tempBudgetPlan, setTempBudgetPlan] = useState<BudgetCategoryPlan[]>(budgetPlan);

  const handleOpenEditModal = () => {
    setTempBudgetPlan([...budgetPlan]);
    setIsEditModalOpen(true);
  };

  const handleSaveBudgetPlan = () => {
    setBudgetPlan(tempBudgetPlan);
    localStorage.setItem(`patelki_annual_budget_${selectedYear}`, JSON.stringify(tempBudgetPlan));
    setIsEditModalOpen(false);

    // Activity log entry
    addActivityLog({
      actorName: settings.bendaharaName ? `Bendahara DPC (${settings.bendaharaName})` : 'Bendahara DPC',
      actorRole: 'bendahara',
      category: 'settings',
      action: 'update',
      title: `Pembaruan Pagu Anggaran Tahunan (RAPB ${selectedYear})`,
      description: `Alokasi target pagu pendapatan dan beban belanja tahun ${selectedYear} telah diperbarui oleh Bendahara.`,
      newValue: `Tahun ${selectedYear}: ${tempBudgetPlan.length} pos anggaran dikonfigurasi`,
    });

    setExportSuccessMessage(`✓ Pagu Anggaran Tahunan ${selectedYear} berhasil disimpan.`);
    setTimeout(() => setExportSuccessMessage(null), 3000);
  };

  const handleResetBudgetPlan = () => {
    const defaults = getDefaultBudgetPlan(selectedYear);
    setTempBudgetPlan(defaults);
  };

  // Calculate Actual Income and Expense for Selected Year
  const yearTransactions = useMemo(() => {
    return transactions.filter(t => {
      const txYear = new Date(t.date).getFullYear();
      return txYear === selectedYear;
    });
  }, [transactions, selectedYear]);

  // Actual income tally per category
  const actualIncomeByCategory = useMemo(() => {
    const map = new Map<string, number>();

    yearTransactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        const cat = t.category || 'Lainnya';
        map.set(cat, (map.get(cat) || 0) + Number(t.amount || 0));
      });

    // Also check if dues records has paid dues for that year
    const yearPaidDues = duesRecords.filter(d => d.year === selectedYear && d.status === 'paid');
    const totalDuesPaidAmount = yearPaidDues.length * settings.monthlyFee;

    // If transactions already contain 'Iuran Wajib Anggota', compare and pick highest to ensure accurate dues capture
    const currentTxDues = map.get('Iuran Wajib Anggota') || 0;
    if (totalDuesPaidAmount > currentTxDues) {
      map.set('Iuran Wajib Anggota', totalDuesPaidAmount);
    }

    return map;
  }, [yearTransactions, duesRecords, selectedYear, settings.monthlyFee]);

  // Actual expense tally per category
  const actualExpenseByCategory = useMemo(() => {
    const map = new Map<string, number>();

    yearTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = t.category || 'Lainnya';
        map.set(cat, (map.get(cat) || 0) + Number(t.amount || 0));
      });

    return map;
  }, [yearTransactions]);

  // Combined Detailed Budget Items
  const budgetItems = useMemo(() => {
    return budgetPlan.map(plan => {
      const actual = plan.type === 'income'
        ? (actualIncomeByCategory.get(plan.category) || 0)
        : (actualExpenseByCategory.get(plan.category) || 0);

      const variance = plan.type === 'income'
        ? actual - plan.budgetAmount // positive is surplus/ahead of target
        : plan.budgetAmount - actual; // positive is under-budget/savings

      const percentage = plan.budgetAmount > 0 ? (actual / plan.budgetAmount) * 100 : 0;

      let status = 'Sesuai Target';
      if (plan.type === 'income') {
        if (percentage >= 100) status = 'Tercapai 100%';
        else if (percentage >= 70) status = 'Mendekati Target';
        else status = 'Belum Tercapai';
      } else {
        if (percentage > 100) status = 'Over-Budget (Defisit)';
        else if (percentage >= 85) status = 'Pagu Menipis (>85%)';
        else status = 'Aman Terkendali';
      }

      return {
        ...plan,
        actualAmount: actual,
        varianceAmount: variance,
        percentage,
        status,
      };
    });
  }, [budgetPlan, actualIncomeByCategory, actualExpenseByCategory]);

  // Totals
  const incomeItems = useMemo(() => budgetItems.filter(i => i.type === 'income'), [budgetItems]);
  const expenseItems = useMemo(() => budgetItems.filter(i => i.type === 'expense'), [budgetItems]);

  const totalIncomeBudget = useMemo(() => incomeItems.reduce((s, i) => s + i.budgetAmount, 0), [incomeItems]);
  const totalIncomeActual = useMemo(() => incomeItems.reduce((s, i) => s + i.actualAmount, 0), [incomeItems]);
  const incomeAchievementPct = totalIncomeBudget > 0 ? (totalIncomeActual / totalIncomeBudget) * 100 : 0;

  const totalExpenseBudget = useMemo(() => expenseItems.reduce((s, i) => s + i.budgetAmount, 0), [expenseItems]);
  const totalExpenseActual = useMemo(() => expenseItems.reduce((s, i) => s + i.actualAmount, 0), [expenseItems]);
  const expenseAbsorptionPct = totalExpenseBudget > 0 ? (totalExpenseActual / totalExpenseBudget) * 100 : 0;

  const plannedNetSurplus = totalIncomeBudget - totalExpenseBudget;
  const actualNetSurplus = totalIncomeActual - totalExpenseActual;
  const fiscalVariance = actualNetSurplus - plannedNetSurplus;

  // Chart 1 Data: Overview Comparison (Side by Side)
  const overviewChartData = [
    {
      name: 'Penerimaan Kas (Income)',
      Pagu_Rencana: totalIncomeBudget,
      Realisasi_Aktual: totalIncomeActual,
      Target_Persen: Math.round(incomeAchievementPct),
    },
    {
      name: 'Belanja & Beban (Expense)',
      Pagu_Rencana: totalExpenseBudget,
      Realisasi_Aktual: totalExpenseActual,
      Target_Persen: Math.round(expenseAbsorptionPct),
    },
    {
      name: 'Surplus Bersih (Net Kas)',
      Pagu_Rencana: Math.max(0, plannedNetSurplus),
      Realisasi_Aktual: Math.max(0, actualNetSurplus),
      Target_Persen: plannedNetSurplus > 0 ? Math.round((actualNetSurplus / plannedNetSurplus) * 100) : 100,
    },
  ];

  // Chart 2 Data: Expense Category Breakdown
  const expenseChartData = useMemo(() => {
    return expenseItems.map(item => ({
      name: item.category.length > 18 ? item.category.slice(0, 16) + '...' : item.category,
      fullName: item.category,
      Pagu_Anggaran: item.budgetAmount,
      Realisasi_Belanja: item.actualAmount,
      Sisa_Pagu: Math.max(0, item.budgetAmount - item.actualAmount),
      Serapan_Persen: Math.round(item.percentage),
    }));
  }, [expenseItems]);

  // Chart 3 Data: Monthly Trend for the selected year
  const monthlyTrendData = useMemo(() => {
    const monthlyIncomeBudgetProRata = totalIncomeBudget / 12;
    const monthlyExpenseBudgetProRata = totalExpenseBudget / 12;

    let cumulativeIncomeActual = 0;
    let cumulativeExpenseActual = 0;
    let cumulativeIncomeBudget = 0;
    let cumulativeExpenseBudget = 0;

    return MONTH_SHORT.map((mStr, idx) => {
      const mNum = idx + 1;
      const monthTx = yearTransactions.filter(t => new Date(t.date).getMonth() + 1 === mNum);

      let mIncome = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
      const mExpense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);

      // Add paid dues for this month
      const monthDuesPaid = duesRecords.filter(d => d.year === selectedYear && d.month === mNum && d.status === 'paid');
      const duesAmt = monthDuesPaid.length * settings.monthlyFee;
      if (duesAmt > mIncome) {
        mIncome = duesAmt;
      }

      cumulativeIncomeActual += mIncome;
      cumulativeExpenseActual += mExpense;
      cumulativeIncomeBudget += monthlyIncomeBudgetProRata;
      cumulativeExpenseBudget += monthlyExpenseBudgetProRata;

      return {
        month: mStr,
        mNum,
        Pendapatan_Bulanan: mIncome,
        Belanja_Bulanan: mExpense,
        Kumulatif_Realisasi_Masuk: cumulativeIncomeActual,
        Kumulatif_Realisasi_Keluar: cumulativeExpenseActual,
        Target_Anggaran_Masuk: Math.round(cumulativeIncomeBudget),
        Pagu_Anggaran_Keluar: Math.round(cumulativeExpenseBudget),
      };
    });
  }, [yearTransactions, duesRecords, selectedYear, totalIncomeBudget, totalExpenseBudget, settings.monthlyFee]);

  // Filtered Table Items
  const filteredTableItems = useMemo(() => {
    return budgetItems.filter(item => {
      const matchesSearch =
        searchTerm === '' ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesType = true;
      if (tableFilter === 'income') matchesType = item.type === 'income';
      else if (tableFilter === 'expense') matchesType = item.type === 'expense';
      else if (tableFilter === 'variance') matchesType = item.percentage > 100 || item.percentage < 50;

      return matchesSearch && matchesType;
    });
  }, [budgetItems, searchTerm, tableFilter]);

  // Export Handlers
  const handleExportExcel = () => {
    try {
      setIsExportingExcel(true);
      const exportData: BudgetItemExport[] = budgetItems.map((item, idx) => ({
        no: idx + 1,
        type: item.type,
        category: item.category,
        budgetAmount: item.budgetAmount,
        actualAmount: item.actualAmount,
        varianceAmount: item.varianceAmount,
        percentage: item.percentage,
        status: item.status,
      }));

      exportBudgetReportExcel(
        exportData,
        selectedYear,
        settings,
        totalIncomeBudget,
        totalIncomeActual,
        totalExpenseBudget,
        totalExpenseActual
      );

      setExportSuccessMessage(`✓ Berkas Excel Laporan Anggaran ${selectedYear} berhasil diunduh.`);
      setTimeout(() => setExportSuccessMessage(null), 3500);
    } catch (err) {
      console.error('Error exporting Budget Excel:', err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPDF = () => {
    try {
      setIsExportingPdf(true);
      const exportData: BudgetItemExport[] = budgetItems.map((item, idx) => ({
        no: idx + 1,
        type: item.type,
        category: item.category,
        budgetAmount: item.budgetAmount,
        actualAmount: item.actualAmount,
        varianceAmount: item.varianceAmount,
        percentage: item.percentage,
        status: item.status,
      }));

      exportBudgetReportPDF(
        exportData,
        selectedYear,
        settings,
        totalIncomeBudget,
        totalIncomeActual,
        totalExpenseBudget,
        totalExpenseActual
      );

      setExportSuccessMessage(`✓ Berkas PDF resmi Laporan Anggaran ${selectedYear} berhasil diunduh.`);
      setTimeout(() => setExportSuccessMessage(null), 3500);
    } catch (err) {
      console.error('Error exporting Budget PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportCSV = () => {
    try {
      const exportData: BudgetItemExport[] = budgetItems.map((item, idx) => ({
        no: idx + 1,
        type: item.type,
        category: item.category,
        budgetAmount: item.budgetAmount,
        actualAmount: item.actualAmount,
        varianceAmount: item.varianceAmount,
        percentage: item.percentage,
        status: item.status,
      }));

      exportBudgetReportCSV(exportData, selectedYear);
      setExportSuccessMessage(`✓ Berkas CSV Laporan Anggaran ${selectedYear} berhasil diunduh.`);
      setTimeout(() => setExportSuccessMessage(null), 3500);
    } catch (err) {
      console.error('Error exporting Budget CSV:', err);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {exportSuccessMessage && (
        <div className="no-print p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-bold text-emerald-900 flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-black cursor-pointer text-sm px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-emerald-700 shrink-0" />
              <span>Laporan Anggaran & Realisasi Tahunan</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black">
              RAPB {selectedYear}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Visualisasi komparatif rencana anggaran pendapatan & belanja versus realisasi kas aktual tahun fiskal berjalan.
          </p>
        </div>

        {/* Action Controls & Year Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Fiscal Year Picker */}
          <div className="flex items-center bg-white border border-slate-300 rounded-xl px-3 py-1.5 shadow-xs">
            <Calendar className="w-4 h-4 text-amber-500 mr-2" />
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="text-xs font-bold text-slate-800 bg-transparent outline-hidden cursor-pointer"
            >
              {[2025, 2026, 2027, 2028, 2029, 2030, 2031].map(y => (
                <option key={y} value={y}>
                  Tahun Anggaran {y} {y === currentCalendarYear ? '(Tahun Berjalan)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Edit Budget Limits */}
          <button
            type="button"
            onClick={handleOpenEditModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
            title="Kelola alokasi pagu anggaran tahunan"
          >
            <Edit3 className="w-4 h-4 text-emerald-700" />
            <span>Kelola Pagu</span>
          </button>

          {/* Export Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-60"
            title="Download laporan anggaran ke Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExportingExcel ? 'Mengunduh...' : 'Export Excel'}</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            title="Download laporan anggaran ke CSV (.csv)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          {/* Download PDF */}
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-60"
            title="Download laporan anggaran ke PDF (.pdf)"
          >
            <Download className="w-4 h-4" />
            <span>{isExportingPdf ? 'Menyiapkan...' : 'Download PDF'}</span>
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            title="Cetak langsung dokumen ke printer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen</span>
          </button>
        </div>
      </div>

      {/* 4 Main Fiscal Health KPI Cards */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Target Pendapatan & Realisasi */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Penerimaan / Pendapatan
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 font-mono">
              {formatCurrency(totalIncomeActual)}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Target Pagu: <span className="font-bold text-slate-700 font-mono">{formatCurrency(totalIncomeBudget)}</span>
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Capaian Target:</span>
            <span className={`font-black font-mono ${incomeAchievementPct >= 80 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {incomeAchievementPct.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Card 2: Pagu Belanja & Realisasi Serapan */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Belanja & Pengeluaran
            </span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-800">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 font-mono">
              {formatCurrency(totalExpenseActual)}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pagu Belanja: <span className="font-bold text-slate-700 font-mono">{formatCurrency(totalExpenseBudget)}</span>
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Tingkat Serapan:</span>
            <span className={`font-black font-mono ${expenseAbsorptionPct > 100 ? 'text-rose-700' : expenseAbsorptionPct > 80 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {expenseAbsorptionPct.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Card 3: Surplus / Defisit Bersih Kas */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Surplus / (Defisit) Kas
            </span>
            <div className={`p-2 rounded-xl ${actualNetSurplus >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              {actualNetSurplus >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div>
            <div className={`text-xl font-black font-mono ${actualNetSurplus >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatCurrency(actualNetSurplus)}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Rencana Pagu: <span className="font-bold text-slate-700 font-mono">{formatCurrency(plannedNetSurplus)}</span>
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Deviasi Fiskal:</span>
            <span className={`font-black font-mono ${fiscalVariance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {fiscalVariance >= 0 ? '+' : ''}{formatCurrency(fiscalVariance)}
            </span>
          </div>
        </div>

        {/* Card 4: Sisa Pagu Belanja Tersedia */}
        <div className="bg-linear-to-br from-emerald-900 to-slate-900 text-white p-5 rounded-3xl shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-emerald-300 uppercase tracking-wider">
              Sisa Pagu Belanja Aman
            </span>
            <div className="p-2 rounded-xl bg-emerald-700/50 text-emerald-200">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-white font-mono">
              {formatCurrency(Math.max(0, totalExpenseBudget - totalExpenseActual))}
            </div>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              Dari total pagu Rp {totalExpenseBudget.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="pt-2 border-t border-emerald-800/80 flex items-center justify-between text-xs">
            <span className="text-emerald-200">Status Fiskal:</span>
            <span className="font-black text-amber-300">
              {expenseAbsorptionPct > 100 ? '⚠️ Defisit Pagu' : expenseAbsorptionPct > 85 ? '⚡ Waspada Pagu' : '✓ Sehat & Aman'}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Visualizations Section */}
      <div className="no-print bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        {/* Tab Switcher & Chart Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Visualisasi Analitik RAPB Tahun {selectedYear}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluasi kinerja anggaran melalui grafik perbandingan komparatif dan tren serapan belanja.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Komparasi Utama
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('expense_breakdown')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'expense_breakdown'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pagu vs Realisasi Belanja
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('monthly_trend')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'monthly_trend'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tren Kumulatif Bulanan
            </button>
          </div>
        </div>

        {/* TAB 1: OVERVIEW COMPOSITE BAR CHART */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overviewChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                  <YAxis
                    tickFormatter={val => `Rp ${(val / 1000000).toFixed(1)} jt`}
                    tick={{ fontSize: 10, fill: '#64748B' }}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      formatCurrency(Number(value)),
                      name === 'Pagu_Rencana' ? 'Pagu Rencana RAPB' : 'Realisasi Aktual Riil',
                    ]}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  />
                  <Legend
                    formatter={val => (val === 'Pagu_Rencana' ? 'Pagu Target Rencana' : 'Realisasi Aktual')}
                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  />
                  <Bar dataKey="Pagu_Rencana" fill="#94A3B8" radius={[8, 8, 0, 0]} maxBarSize={55} />
                  <Bar dataKey="Realisasi_Aktual" fill="#00664F" radius={[8, 8, 0, 0]} maxBarSize={55}>
                    {overviewChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? '#00664F' : index === 1 ? '#E11D48' : '#0284C7'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
              <span className="flex items-center gap-1.5 font-bold text-slate-700">
                <Info className="w-4 h-4 text-emerald-600" />
                Keterangan Analisis:
              </span>
              <span>Penerimaan Kas tercapai <strong>{incomeAchievementPct.toFixed(1)}%</strong> dari target pagu.</span>
              <span>Serapan belanja berada pada <strong>{expenseAbsorptionPct.toFixed(1)}%</strong> dari pagu yang ditetapkan.</span>
              <span className="font-bold text-emerald-800">Surplus Berjalan: {formatCurrency(actualNetSurplus)}</span>
            </div>
          </div>
        )}

        {/* TAB 2: EXPENSE BREAKDOWN PER CATEGORY */}
        {activeTab === 'expense_breakdown' && (
          <div className="space-y-4">
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={expenseChartData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis
                    type="number"
                    tickFormatter={val => `Rp ${(val / 1000000).toFixed(1)} jt`}
                    tick={{ fontSize: 10, fill: '#64748B' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10.5, fill: '#334155', fontWeight: 600 }}
                    width={110}
                  />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      formatCurrency(Number(val)),
                      name === 'Pagu_Anggaran' ? 'Pagu Anggaran' : 'Realisasi Belanja',
                    ]}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    formatter={val => (val === 'Pagu_Anggaran' ? 'Pagu Anggaran' : 'Realisasi Belanja')}
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                  <Bar dataKey="Pagu_Anggaran" fill="#CBD5E1" radius={[0, 6, 6, 0]} maxBarSize={20} />
                  <Bar dataKey="Realisasi_Belanja" fill="#F43F5E" radius={[0, 6, 6, 0]} maxBarSize={20}>
                    {expenseChartData.map((entry, index) => (
                      <Cell
                        key={`cell-exp-${index}`}
                        fill={entry.Serapan_Persen > 100 ? '#BE123C' : entry.Serapan_Persen > 80 ? '#D97706' : '#059669'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0" />
                <span className="text-emerald-900 font-semibold">Hijau: Serapan Aman (&lt;80%)</span>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-600 shrink-0" />
                <span className="text-amber-900 font-semibold">Kuning: Pagu Menipis (80% - 100%)</span>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-600 shrink-0" />
                <span className="text-rose-900 font-semibold">Merah: Over-Budget (&gt;100%)</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MONTHLY CUMULATIVE TREND */}
        {activeTab === 'monthly_trend' && (
          <div className="space-y-4">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorIncCum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00664F" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#00664F" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorExpCum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E11D48" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#E11D48" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis
                    tickFormatter={val => `Rp ${(val / 1000000).toFixed(1)} jt`}
                    tick={{ fontSize: 10, fill: '#64748B' }}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      formatCurrency(Number(value)),
                      name === 'Kumulatif_Realisasi_Masuk'
                        ? 'Akumulasi Kas Masuk'
                        : name === 'Kumulatif_Realisasi_Keluar'
                        ? 'Akumulasi Kas Keluar'
                        : name,
                    ]}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="Kumulatif_Realisasi_Masuk"
                    name="Realisasi Pendapatan Akumulatif"
                    stroke="#00664F"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorIncCum)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Kumulatif_Realisasi_Keluar"
                    name="Realisasi Belanja Akumulatif"
                    stroke="#E11D48"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorExpCum)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Grafik menunjukkan laju akumulasi penerimaan kas iuran vs serapan biaya organisasi sepanjang bulan Januari s.d. Desember {selectedYear}.
            </p>
          </div>
        )}
      </div>

      {/* Filter and Table Section */}
      <div className="no-print bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-black text-slate-900">
              Rincian Pos Anggaran & Realisasi RAPB {selectedYear}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold font-mono">
              {filteredTableItems.length} Pos
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 sm:w-60">
              <input
                type="text"
                placeholder="Cari pos kategori anggaran..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:border-emerald-500 transition-all"
              />
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTableFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  tableFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setTableFilter('income')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  tableFilter === 'income' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pendapatan
              </button>
              <button
                type="button"
                onClick={() => setTableFilter('expense')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  tableFilter === 'expense' ? 'bg-white text-rose-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Belanja
              </button>
              <button
                type="button"
                onClick={() => setTableFilter('variance')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  tableFilter === 'variance' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Pos dengan deviasi signifikan / over-budget"
              >
                Deviasi Signifikan
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5 text-center w-12">No</th>
                <th className="p-3.5 w-28">Tipe Pos</th>
                <th className="p-3.5">Pos Kategori Anggaran</th>
                <th className="p-3.5 text-right w-36">Pagu Rencana</th>
                <th className="p-3.5 text-right w-36">Realisasi Aktual</th>
                <th className="p-3.5 text-right w-36">Deviasi (Selisih)</th>
                <th className="p-3.5 text-center w-36">Capaian / Serapan</th>
                <th className="p-3.5 text-center w-32">Status Evaluasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTableItems.map((item, idx) => {
                const isIncome = item.type === 'income';
                return (
                  <tr key={`${item.type}-${item.category}`} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 text-center font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-black rounded-md ${
                          isIncome ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isIncome ? 'PENDAPATAN' : 'BELANJA'}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">
                      {item.category}
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-600 font-semibold">
                      {formatCurrency(item.budgetAmount)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(item.actualAmount)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-semibold">
                      <span className={item.varianceAmount >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                        {item.varianceAmount >= 0 ? '+' : ''}{formatCurrency(item.varianceAmount)}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden shrink-0">
                          <div
                            style={{ width: `${Math.min(100, item.percentage)}%` }}
                            className={`h-full rounded-full transition-all duration-300 ${
                              isIncome
                                ? item.percentage >= 100 ? 'bg-emerald-600' : 'bg-amber-500'
                                : item.percentage > 100 ? 'bg-rose-600' : item.percentage > 80 ? 'bg-amber-500' : 'bg-emerald-600'
                            }`}
                          />
                        </div>
                        <span className="font-mono font-bold text-[11px] text-slate-700 w-10 text-right">
                          {item.percentage.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md ${
                          item.status.includes('Over')
                            ? 'bg-rose-100 text-rose-800'
                            : item.status.includes('Tercapai') || item.status.includes('Aman')
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Table Footer Totals */}
            <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
              <tr>
                <td colSpan={3} className="p-3.5 text-center font-extrabold uppercase">
                  TOTAL RAPB TAHUN {selectedYear}
                </td>
                <td className="p-3.5 text-right font-mono text-slate-700 font-black">
                  {formatCurrency(totalIncomeBudget)} (Inc)<br />
                  <span className="text-rose-700">{formatCurrency(totalExpenseBudget)} (Exp)</span>
                </td>
                <td className="p-3.5 text-right font-mono font-black text-slate-900">
                  {formatCurrency(totalIncomeActual)} (Inc)<br />
                  <span className="text-rose-700">{formatCurrency(totalExpenseActual)} (Exp)</span>
                </td>
                <td className="p-3.5 text-right font-mono font-black text-emerald-800">
                  Surplus Bersih:<br />
                  <span className={actualNetSurplus >= 0 ? 'text-emerald-800' : 'text-rose-700'}>
                    {formatCurrency(actualNetSurplus)}
                  </span>
                </td>
                <td className="p-3.5 text-center font-black">
                  Inc: {incomeAchievementPct.toFixed(0)}%<br />
                  Exp: {expenseAbsorptionPct.toFixed(0)}%
                </td>
                <td className="p-3.5 text-center font-black text-emerald-800">
                  {actualNetSurplus >= 0 ? '✓ Fiskal Sehat' : '⚠️ Defisit Kas'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* EDIT BUDGET MODAL */}
      {isEditModalOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    Kelola Pagu Anggaran RAPB ({selectedYear})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Atur target alokasi penerimaan dan pagu belanja organisasi DPC.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-black cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {/* Scrollable inputs */}
            <div className="overflow-y-auto space-y-4 pr-1 text-xs flex-1 custom-scrollbar">
              {/* Income Pos Inputs */}
              <div className="space-y-3">
                <h4 className="font-black text-emerald-800 uppercase tracking-wider text-xs pb-1 border-b border-emerald-100 flex items-center gap-1.5">
                  <ArrowDownLeft className="w-4 h-4" />
                  Target Pos Pendapatan Kas (Income)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tempBudgetPlan
                    .filter(p => p.type === 'income')
                    .map(plan => (
                      <div key={`edit-${plan.type}-${plan.category}`} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <label className="font-bold text-slate-700 block truncate" title={plan.category}>
                          {plan.category}
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">Rp</span>
                          <input
                            type="number"
                            min="0"
                            step="50000"
                            value={plan.budgetAmount}
                            onChange={e => {
                              const val = Math.max(0, Number(e.target.value));
                              setTempBudgetPlan(prev =>
                                prev.map(p => p.category === plan.category && p.type === plan.type
                                  ? { ...p, budgetAmount: val }
                                  : p
                                )
                              );
                            }}
                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900 text-xs focus:outline-hidden focus:border-emerald-600"
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Expense Pos Inputs */}
              <div className="space-y-3 pt-2">
                <h4 className="font-black text-rose-800 uppercase tracking-wider text-xs pb-1 border-b border-rose-100 flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4" />
                  Pagu Pos Belanja & Pengeluaran (Expense)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tempBudgetPlan
                    .filter(p => p.type === 'expense')
                    .map(plan => (
                      <div key={`edit-${plan.type}-${plan.category}`} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <label className="font-bold text-slate-700 block truncate" title={plan.category}>
                          {plan.category}
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">Rp</span>
                          <input
                            type="number"
                            min="0"
                            step="50000"
                            value={plan.budgetAmount}
                            onChange={e => {
                              const val = Math.max(0, Number(e.target.value));
                              setTempBudgetPlan(prev =>
                                prev.map(p => p.category === plan.category && p.type === plan.type
                                  ? { ...p, budgetAmount: val }
                                  : p
                                )
                              );
                            }}
                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900 text-xs focus:outline-hidden focus:border-rose-600"
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={handleResetBudgetPlan}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset ke Rekomendasi
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveBudgetPlan}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-emerald-700/20"
                >
                  Simpan Pagu Anggaran
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY OFFICIAL BUDGET REPORT DOCUMENT (window.print()) */}
      <div id="report-document" className="hidden p-8 bg-white text-slate-900 font-sans">
        {/* Kop Surat Resmi */}
        <div className="flex items-center gap-4 pb-4 border-b-4 border-double border-slate-900 mb-6">
          <PatelkiLogo className="w-20 h-20 shrink-0" />
          <div className="text-center flex-1">
            <h3 className="text-xs font-black tracking-widest text-slate-800 uppercase">
              PERSATUAN AHLI TEKNOLOGI LABORATORIUM MEDIK INDONESIA (PATELKI)
            </h3>
            <h1 className="text-lg font-black text-slate-950 tracking-tight">
              DEWAN PENGURUS CABANG KABUPATEN KAYONG UTARA
            </h1>
            <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
              Sekretariat: {settings.address || 'Kabupaten Kayong Utara, Kalimantan Barat'} • WA: {settings.contactWa || '-'} • Email: {settings.contactEmail || '-'}
            </p>
          </div>
        </div>

        {/* Title */}
        <div className="my-6 text-center">
          <h2 className="text-base font-black tracking-wider text-slate-900 uppercase">
            LAPORAN ANGGARAN & REALISASI KEUANGAN TAHUNAN (RAPB)
          </h2>
          <p className="text-xs font-bold text-amber-700 mt-0.5 uppercase tracking-wider">
            TAHUN ANGGARAN FISKAL {selectedYear}
          </p>
        </div>

        {/* Summary Info Box */}
        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
          <span><strong>Target Pendapatan:</strong> {formatCurrency(totalIncomeBudget)} (Realisasi: {formatCurrency(totalIncomeActual)} / {incomeAchievementPct.toFixed(1)}%)</span>
          <span><strong>Pagu Belanja:</strong> {formatCurrency(totalExpenseBudget)} (Realisasi: {formatCurrency(totalExpenseActual)} / {expenseAbsorptionPct.toFixed(1)}%)</span>
          <span className="text-emerald-800"><strong>Surplus Kas Bersih:</strong> {formatCurrency(actualNetSurplus)}</span>
        </div>

        {/* Audit Table */}
        <table className="w-full text-left text-xs border border-slate-300 border-collapse mb-6">
          <thead className="bg-slate-100 font-bold text-slate-900 text-[11px]">
            <tr className="border-b border-slate-300">
              <th className="p-2 text-center border-r border-slate-300 w-10">No</th>
              <th className="p-2 border-r border-slate-300 w-24">Tipe Pos</th>
              <th className="p-2 border-r border-slate-300">Pos Kategori Anggaran</th>
              <th className="p-2 text-right border-r border-slate-300 w-32">Pagu Rencana</th>
              <th className="p-2 text-right border-r border-slate-300 w-32">Realisasi Aktual</th>
              <th className="p-2 text-right border-r border-slate-300 w-32">Selisih Deviasi</th>
              <th className="p-2 text-center border-r border-slate-300 w-20">% Capaian</th>
              <th className="p-2 text-center w-28">Status Evaluasi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {budgetItems.map((item, idx) => (
              <tr key={`print-${item.type}-${item.category}`} className="border-b border-slate-200">
                <td className="p-2 text-center border-r border-slate-200">{idx + 1}</td>
                <td className="p-2 uppercase font-bold text-[10px] border-r border-slate-200">
                  {item.type === 'income' ? 'Pendapatan' : 'Belanja'}
                </td>
                <td className="p-2 font-bold border-r border-slate-200">{item.category}</td>
                <td className="p-2 text-right font-mono border-r border-slate-200">{formatCurrency(item.budgetAmount)}</td>
                <td className="p-2 text-right font-mono font-bold border-r border-slate-200">{formatCurrency(item.actualAmount)}</td>
                <td className="p-2 text-right font-mono border-r border-slate-200">
                  {item.varianceAmount >= 0 ? '+' : ''}{formatCurrency(item.varianceAmount)}
                </td>
                <td className="p-2 text-center font-bold border-r border-slate-200">{item.percentage.toFixed(0)}%</td>
                <td className="p-2 text-center text-[10px]">{item.status}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
            <tr>
              <td colSpan={3} className="p-2 text-center">TOTAL RAPB {selectedYear}</td>
              <td className="p-2 text-right font-mono">{formatCurrency(totalIncomeBudget)}</td>
              <td className="p-2 text-right font-mono">{formatCurrency(totalIncomeActual)}</td>
              <td className="p-2 text-right font-mono text-emerald-800">{formatCurrency(actualNetSurplus)}</td>
              <td className="p-2 text-center">{incomeAchievementPct.toFixed(0)}%</td>
              <td className="p-2 text-center text-emerald-800">Fiskal Sehat</td>
            </tr>
          </tfoot>
        </table>

        {/* Signatures */}
        <div className="flex justify-between items-start mt-8 text-xs pt-4">
          <div className="text-center w-64">
            <p>Mengetahui,</p>
            <p className="font-bold">Ketua DPC PATELKI Kayong Utara</p>
            <div className="h-16"></div>
            <p className="font-black underline">{settings.ketuaName || '( ..................................................... )'}</p>
            <p className="text-[10px] text-slate-500 font-mono">NAP: {settings.ketuaNap || '-'}</p>
          </div>

          <div className="text-center w-64">
            <p>Sukadana, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p>Dibuat Oleh,</p>
            <p className="font-bold">Bendahara DPC PATELKI Kayong Utara</p>
            <div className="h-16"></div>
            <p className="font-black underline">{settings.bendaharaName || '( ..................................................... )'}</p>
            <p className="text-[10px] text-slate-500 font-mono">NAP: {settings.bendaharaNap || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaporanAnggaranTahunan;
