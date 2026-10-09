import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Member, DuesRecord, AppSettings } from '../types';

export interface MonthlyBreakdownItem {
  monthNum: number;
  name: string;
  paidCount: number;
  unpaidCount: number;
  pendingCount: number;
  potential: number;
  collected: number;
  pending: number;
  arrears: number;
  compliance: number;
}

export interface MemberArrearsItem {
  member: Member;
  memberRecordsMap: Map<string, DuesRecord>;
  unpaidRecords: { year: number; month: number; amount: number }[];
  paidCount: number;
  totalArrears: number;
  latestPaidMonth?: string;
  statusSummary: string;
}

export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function useDuesData(selectedYear: number = 2026) {
  const { members, duesRecords, settings, formatCurrency, updateDuesStatus, runAutoSync } = useApp();

  const activeMembers = useMemo(() => members.filter(m => m.status === 'aktif'), [members]);
  const activeCount = activeMembers.length;

  // Unified record lookup helper supporting both member.id and member.nap
  const getMemberRecords = useMemo(() => {
    return (member: Member, year: number) => {
      return duesRecords.filter(
        d => (d.memberId === member.id || (member.nap && d.memberId === member.nap)) && d.year === year
      );
    };
  }, [duesRecords]);

  // Unified status checker for specific member, year, month
  const getDuesRecordForMonth = useMemo(() => {
    return (member: Member, year: number, month: number): DuesRecord | undefined => {
      return duesRecords.find(
        d => (d.memberId === member.id || (member.nap && d.memberId === member.nap)) && d.year === year && d.month === month
      );
    };
  }, [duesRecords]);

  // Monthly breakdown for Rekapitulasi & Dashboard charts
  const monthlyBreakdown: MonthlyBreakdownItem[] = useMemo(() => {
    return MONTH_NAMES.map((name, index) => {
      const monthNum = index + 1;
      const records = duesRecords.filter(d => {
        if (d.year !== selectedYear || d.month !== monthNum) return false;
        return activeMembers.some(
          am => am.id === d.memberId || am.nap === d.memberId
        );
      });

      const paidRecords = records.filter(d => d.status === 'paid');
      const unpaidRecords = records.filter(d => d.status === 'unpaid');
      const pendingRecords = records.filter(d => d.status === 'pending');

      const potential = activeCount * settings.monthlyFee;
      const collected = paidRecords.length * settings.monthlyFee;
      const pending = pendingRecords.length * settings.monthlyFee;
      const arrears = unpaidRecords.length * settings.monthlyFee;
      const compliance = activeCount > 0 ? Math.round((paidRecords.length / activeCount) * 100) : 0;

      return {
        monthNum,
        name,
        paidCount: paidRecords.length,
        unpaidCount: unpaidRecords.length,
        pendingCount: pendingRecords.length,
        potential,
        collected,
        pending,
        arrears,
        compliance,
      };
    });
  }, [duesRecords, activeMembers, selectedYear, activeCount, settings.monthlyFee]);

  const yearTotalPotential = useMemo(() => monthlyBreakdown.reduce((sum, m) => sum + m.potential, 0), [monthlyBreakdown]);
  const yearTotalCollected = useMemo(() => monthlyBreakdown.reduce((sum, m) => sum + m.collected, 0), [monthlyBreakdown]);
  const yearTotalPending = useMemo(() => monthlyBreakdown.reduce((sum, m) => sum + m.pending, 0), [monthlyBreakdown]);
  const yearTotalArrears = useMemo(() => monthlyBreakdown.reduce((sum, m) => sum + m.arrears, 0), [monthlyBreakdown]);
  const yearAverageCompliance = useMemo(() => {
    return monthlyBreakdown.reduce((sum, m) => sum + m.compliance, 0) / (monthlyBreakdown.length || 1);
  }, [monthlyBreakdown]);

  // Unified Arrears List for DaftarTunggakan & Matrix
  const getArrearsList = useMemo(() => {
    return (periodFilter: string = 'all'): MemberArrearsItem[] => {
      const now = new Date();
      const currentCalendarYear = now.getFullYear();
      const currentCalendarMonth = now.getMonth() + 1;

      return activeMembers.map(member => {
        const memberRecordsMap = new Map<string, DuesRecord>();
        duesRecords.forEach(d => {
          if (d.memberId === member.id || (member.nap && d.memberId === member.nap)) {
            memberRecordsMap.set(`${d.year}-${d.month}`, d);
          }
        });

        const unpaidRecords: { year: number; month: number; amount: number }[] = [];
        let paidCount = 0;
        let totalArrears = 0;

        const startYr = periodFilter !== 'all' ? Number(periodFilter) : 2025;
        const endYr = periodFilter !== 'all' ? Number(periodFilter) : currentCalendarYear;

        for (let yr = startYr; yr <= endYr; yr++) {
          const maxMonth = (yr === currentCalendarYear) ? currentCalendarMonth : (yr > currentCalendarYear ? 0 : 12);
          for (let mo = 1; mo <= maxMonth; mo++) {
            const key = `${yr}-${mo}`;
            const rec = memberRecordsMap.get(key);
            const status = rec?.status || 'unpaid';
            const amount = rec?.amount || settings.monthlyFee;

            if (status === 'paid') {
              paidCount++;
            } else if (status === 'unpaid' || status === 'pending') {
              unpaidRecords.push({ year: yr, month: mo, amount });
              totalArrears += amount;
            }
          }
        }

        return {
          member,
          memberRecordsMap,
          unpaidRecords,
          paidCount,
          totalArrears,
          statusSummary: unpaidRecords.length === 0 ? 'Lancar' : `${unpaidRecords.length} Bulan Tunggakan`,
        };
      }).filter(item => item.unpaidRecords.length > 0);
    };
  }, [activeMembers, duesRecords, settings.monthlyFee]);

  return {
    members,
    activeMembers,
    activeCount,
    duesRecords,
    settings,
    selectedYear,
    monthlyBreakdown,
    yearTotalPotential,
    yearTotalCollected,
    yearTotalPending,
    yearTotalArrears,
    yearAverageCompliance,
    getMemberRecords,
    getDuesRecordForMonth,
    getArrearsList,
    formatCurrency,
    updateDuesStatus,
    runAutoSync,
  };
}
