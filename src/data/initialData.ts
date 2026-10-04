import { Member, DuesRecord, PaymentSubmission, CashTransaction, Donation, SocialService, BankAccount, AppSettings, AppNotification } from '../types';

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'mem-1',
    nama: 'Siti Nurhaliza',
    gelar: 'S.Tr.Kes',
    nap: '61.11.001',
    noWa: '6281256789001',
    instansi: 'RSUD Sultan Muhammad Jamaludin I',
    jabatan: 'Bendahara DPC / ATLM Mahir',
    status: 'aktif',
    foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
    tanggalBergabung: '2022-01-15',
    email: 'siti.patelki.kku@gmail.com',
    alamat: 'Jl. Bhayangkara No. 12, Sukadana',
  },
  {
    id: 'mem-2',
    nama: 'Andi Setiawan',
    gelar: 'A.Md.Kes',
    nap: '61.11.002',
    noWa: '6281345678902',
    instansi: 'Puskesmas Teluk Batang',
    jabatan: 'Koordinator Laboratorium',
    status: 'aktif',
    foto: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=256',
    tanggalBergabung: '2022-03-10',
    email: 'andi.setiawan@gmail.com',
    alamat: 'Dusun Sepakat, Teluk Batang',
  },
  {
    id: 'mem-3',
    nama: 'Budi Santoso',
    gelar: 'S.Tr.Kes',
    nap: '61.11.003',
    noWa: '6285245678903',
    instansi: 'Puskesmas Simpang Hilir',
    jabatan: 'Pranata Labkes',
    status: 'aktif',
    foto: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=256',
    tanggalBergabung: '2022-04-01',
    email: 'budi.santoso.lab@gmail.com',
    alamat: 'Rantau Panjang, Simpang Hilir',
  },
  {
    id: 'mem-4',
    nama: 'Citra Dewi Lestari',
    gelar: 'S.Si',
    nap: '61.11.004',
    noWa: '6282156789004',
    instansi: 'Labkesda Kab. Kayong Utara',
    jabatan: 'Kepala Seksi Pemeriksaan',
    status: 'aktif',
    foto: 'https://images.unsplash.com/photo-1594824813627-2c9e782e4e13?auto=format&fit=crop&q=80&w=256',
    tanggalBergabung: '2021-08-20',
    email: 'citra.labkesda@gmail.com',
    alamat: 'Sutera, Sukadana',
  },
  {
    id: 'mem-5',
    nama: 'Dedi Kurniawan',
    gelar: 'A.Md.AK',
    nap: '61.11.005',
    noWa: '6281356789005',
    instansi: 'Puskesmas Seponti',
    jabatan: 'Pranata Labkes Pelaksana',
    status: 'aktif',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
    tanggalBergabung: '2023-01-10',
    email: 'dedi.seponti@gmail.com',
    alamat: 'Seponti Jaya, Seponti',
  },
  {
    id: 'mem-6',
    nama: 'Eka Rahmawati',
    gelar: 'S.Tr.Kes',
    nap: '61.11.006',
    noWa: '6285356789006',
    instansi: 'Puskesmas Sukadana',
    jabatan: 'Ketua Divisi Ilmiah DPC',
    status: 'aktif',
    foto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=256',
    tanggalBergabung: '2021-02-14',
    email: 'eka.rahma.atlm@gmail.com',
    alamat: 'Pangkalan Buton, Sukadana',
  },
  {
    id: 'mem-7',
    nama: 'Fajar Hidayat',
    gelar: 'A.Md.Kes',
    nap: '61.11.007',
    noWa: '6282256789007',
    instansi: 'Puskesmas Pulau Maya',
    jabatan: 'ATLM Puskesmas Perairan',
    status: 'aktif',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
    tanggalBergabung: '2023-05-18',
    email: 'fajar.maya@gmail.com',
    alamat: 'Tanjung Satai, Pulau Maya',
  },
  {
    id: 'mem-8',
    nama: 'Gita Permatasari',
    gelar: 'S.Tr.Kes',
    nap: '61.11.008',
    noWa: '6281298765408',
    instansi: 'RSUD Sultan Muhammad Jamaludin I',
    jabatan: 'Koordinator Bank Darah & QC Lab',
    status: 'aktif',
    foto: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=256',
    tanggalBergabung: '2022-09-01',
    email: 'gita.rsudsmj@gmail.com',
    alamat: 'Jl. Tanjungpura, Sukadana',
  },
  {
    id: 'mem-9',
    nama: 'Hendra Wijaya',
    gelar: 'A.Md.AK',
    nap: '61.11.009',
    noWa: '6281387654309',
    instansi: 'Puskesmas Kepulauan Karimata',
    jabatan: 'ATLM Puskesmas Terpencil',
    status: 'aktif',
    foto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=256',
    tanggalBergabung: '2023-08-01',
    email: 'hendra.karimata@gmail.com',
    alamat: 'Padang, Kepulauan Karimata',
  },
  {
    id: 'mem-10',
    nama: 'Indah Kusuma Wardani',
    gelar: 'A.Md.Kes',
    nap: '61.11.010',
    noWa: '6285712345610',
    instansi: 'Klinik Surya Medika Sukadana',
    jabatan: 'Analis Laboratorium',
    status: 'aktif',
    foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256',
    tanggalBergabung: '2024-02-10',
    email: 'indah.kusuma@gmail.com',
    alamat: 'Sedahan Jaya, Sukadana',
  },
  {
    id: 'mem-11',
    nama: 'Joko Prasetyo',
    gelar: 'S.Tr.Kes',
    nap: '61.11.011',
    noWa: '6281234567811',
    instansi: 'Puskesmas Matan Hilir Selatan (Pindahan)',
    jabatan: 'Analis Medis',
    status: 'nonaktif',
    foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=256',
    tanggalBergabung: '2021-05-01',
    email: 'joko.pras@gmail.com',
    alamat: 'Sukadana',
  },
  {
    id: 'mem-12',
    nama: 'Kurnia Pratama',
    gelar: 'A.Md.AK',
    nap: '61.11.012',
    noWa: '6282345678912',
    instansi: 'RSUD Sultan Muhammad Jamaludin I',
    jabatan: 'Ketua DPC Patelki Kayong Utara',
    status: 'aktif',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
    tanggalBergabung: '2020-01-01',
    email: 'kurnia.pratama.atlm@gmail.com',
    alamat: 'Komplek Dinkes Kayong Utara',
  }
];

export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'bank-1',
    bankName: 'Bank Kalbar',
    accountNumber: '5021-0899-2311',
    accountHolder: 'DPC PATELKI KAYONG UTARA',
    isActive: true,
    isPrimary: true,
    notes: 'Rekening Operasional Utama DPC (Bebas Biaya Transfer Sesama Bank Kalbar)',
  },
  {
    id: 'bank-2',
    bankName: 'Bank Rakyat Indonesia (BRI)',
    accountNumber: '0342-01-002891-53-4',
    accountHolder: 'DPC PATELKI KAB KAYONG UTARA',
    isActive: true,
    isPrimary: false,
    notes: 'Rekening Iuran Anggota & Donasi Nasional',
  },
  {
    id: 'bank-3',
    bankName: 'QRIS DPC PATELKI KKU',
    accountNumber: 'NMID: ID1020304050607',
    accountHolder: 'DPC PATELKI KAB KAYONG UTARA',
    qrisUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021126590014ID.LINKAJA.WWW0118936009110020304050215ID1020304050607520458125802ID5927DPC+PATELKI+KAYONG+UTARA6008SUKADANA6304C74B',
    isActive: true,
    isPrimary: false,
    notes: 'Mendukung Semua E-Wallet (GoPay, OVO, Dana, ShopeePay) & Mobile Banking',
  }
];

export const INITIAL_SETTINGS: AppSettings = {
  organizationName: 'Persatuan Ahli Teknologi Laboratorium Medik Indonesia',
  branchName: 'DPC PATELKI Kabupaten Kayong Utara',
  monthlyFee: 30000,
  startYear: 2025,
  endYear: 2031,
  address: 'Sekretariat DPC Patelki KKU, Jl. Bhayangkara No. 04, Sukadana, Kab. Kayong Utara, Kalimantan Barat 78852',
  contactWa: '6281256789001',
  contactEmail: 'dpcpatelki.kayongutara@gmail.com',
  ketuaName: 'Kurnia Pratama, A.Md.AK',
  ketuaNap: '61.11.012',
  bendaharaName: 'Siti Nurhaliza, S.Tr.Kes',
  bendaharaNap: '61.11.001',
  treasurerUsername: 'bendahara',
  treasurerPassword: 'bendahara123',
  categoriesExpense: [
    'Operasional Organisasi',
    'ATK & Kesekretariatan',
    'Transport & Akomodasi',
    'Konsumsi & Rapat',
    'Kegiatan Ilmiah & Seminar',
    'Bakti Sosial & Pengabdian',
    'Iuran Wajib ke DPW Kalbar',
    'Administrasi Bank & Server',
    'Lainnya'
  ],
  categoriesIncome: [
    'Iuran Wajib Anggota',
    'Donasi & Sumbangan Sukarela',
    'Bantuan CSR / Sponsor',
    'Pemasukan Kegiatan Seminar/Workshop',
    'Pendapatan Bunga Kas',
    'Lainnya'
  ],
  waTemplateApproved: 'Yth. Rekan Sejawat [NAMA] ([NAP]),\n\nPembayaran iuran DPC Patelki Kayong Utara Anda untuk periode [PERIODE] sebesar [NOMINAL] telah BERHASIL DIVERIFIKASI dan DISETUJUI oleh Bendahara DPC.\n\nTerima kasih atas kepatuhan dan kontribusi aktif Anda dalam memajukan profesi ATLM Kayong Utara.\n\nSalam Hangat,\nBendahara DPC Patelki Kayong Utara\n[BENDAHARA]',
  waTemplateReminder: 'Yth. Rekan Sejawat [NAMA] ([NAP]),\n\nBerdasarkan data pembukuan DPC Patelki Kayong Utara per [TANGGAL], tercatat kewajiban iuran Anda yang belum terselesaikan sebesar [NOMINAL] untuk periode [PERIODE].\n\nMohon kesediaannya untuk melakukan pembayaran melalui transfer ke rekening resmi DPC:\n- Bank Kalbar: 5021-0899-2311 (a/n DPC PATELKI KAYONG UTARA)\n- BRI: 0342-01-002891-53-4 (a/n DPC PATELKI KAB KAYONG UTARA)\n\nSetelah transfer, silakan unggah bukti di aplikasi iuran. Terima kasih atas kerja samanya.\n\nSalam Hangat,\nBendahara DPC Patelki Kayong Utara',
  waTemplateRejected: 'Yth. Rekan Sejawat [NAMA] ([NAP]),\n\nPengajuan pembayaran iuran Anda untuk periode [PERIODE] sebesar [NOMINAL] BELUM DAPAT DISETUJUI oleh Bendahara dengan catatan:\n"[ALASAN]"\n\nSilakan periksa kembali bukti transfer Anda atau hubungi Bendahara untuk konfirmasi lebih lanjut. Terima kasih.\n\nSalam Hangat,\nBendahara DPC Patelki Kayong Utara'
};

// Generate realistic dues matrix records for 2025 and 2026
export const generateInitialDues = (): DuesRecord[] => {
  const records: DuesRecord[] = [];
  const members = INITIAL_MEMBERS;
  const years = [2025, 2026, 2027, 2028, 2029, 2030, 2031];

  members.forEach((m) => {
    if (m.status === 'nonaktif') {
      years.forEach((y) => {
        for (let month = 1; month <= 12; month++) {
          records.push({
            memberId: m.id,
            year: y,
            month,
            status: 'inactive',
            amount: 30000,
          });
        }
      });
      return;
    }

    // 2025 records
    for (let month = 1; month <= 12; month++) {
      let status: 'paid' | 'pending' | 'unpaid' = 'paid';
      if (m.id === 'mem-2' && month >= 9) status = 'unpaid'; // Andi unpaid Sep-Dec 2025
      if (m.id === 'mem-3' && month >= 3) status = month <= 6 ? 'paid' : 'unpaid'; // Budi
      if (m.id === 'mem-5' && month >= 11) status = 'unpaid';
      if (m.id === 'mem-7' && month >= 7) status = 'unpaid';
      if (m.id === 'mem-9' && month >= 8) status = 'unpaid';
      if (m.id === 'mem-10' && month >= 1) status = month <= 8 ? 'paid' : 'unpaid';

      records.push({
        memberId: m.id,
        year: 2025,
        month,
        status,
        amount: 30000,
        updatedAt: status === 'paid' ? `2025-${month.toString().padStart(2, '0')}-05` : undefined,
      });
    }

    // 2026 records (Up to Oct 2026 active)
    for (let month = 1; month <= 12; month++) {
      let status: 'paid' | 'pending' | 'unpaid' = 'unpaid';

      if (m.id === 'mem-1') {
        // Bendahara: Paid up to Oct 2026
        status = month <= 10 ? 'paid' : 'unpaid';
      } else if (m.id === 'mem-2') {
        // Andi: Paid Jan-Mar 2026, Pending Apr-May, Unpaid Jun-Oct
        if (month <= 3) status = 'paid';
        else if (month === 4 || month === 5) status = 'pending';
        else status = 'unpaid';
      } else if (m.id === 'mem-3') {
        // Budi: Paid Jan-Feb, Pending Mar, Unpaid Apr-Dec
        if (month <= 2) status = 'paid';
        else if (month === 3) status = 'pending';
        else status = 'unpaid';
      } else if (m.id === 'mem-4') {
        // Citra: 100% lunas Jan-Dec 2026
        status = 'paid';
      } else if (m.id === 'mem-6') {
        // Eka: Paid Jan-Aug 2026
        status = month <= 8 ? 'paid' : 'unpaid';
      } else if (m.id === 'mem-8') {
        // Gita: Paid Jan-Oct 2026
        status = month <= 10 ? 'paid' : 'unpaid';
      } else if (m.id === 'mem-12') {
        // Kurnia (Ketua): Paid Jan-Dec 2026
        status = 'paid';
      } else {
        if (month <= 4) status = 'paid';
        else status = 'unpaid';
      }

      records.push({
        memberId: m.id,
        year: 2026,
        month,
        status,
        amount: 30000,
        updatedAt: status === 'paid' ? `2026-${month.toString().padStart(2, '0')}-04` : undefined,
      });
    }

    // 2027 to 2031 future records
    for (let y = 2027; y <= 2031; y++) {
      for (let month = 1; month <= 12; month++) {
        records.push({
          memberId: m.id,
          year: y,
          month,
          status: 'unpaid',
          amount: 30000,
        });
      }
    }
  });

  return records;
};

export const INITIAL_PAYMENT_SUBMISSIONS: PaymentSubmission[] = [
  {
    id: 'sub-001',
    memberId: 'mem-2',
    memberName: 'Andi Setiawan',
    memberNap: '61.11.002',
    memberWa: '6281345678902',
    memberInstansi: 'Puskesmas Teluk Batang',
    months: [
      { year: 2026, month: 4 },
      { year: 2026, month: 5 },
    ],
    totalAmount: 60000,
    bankAccountId: 'bank-1',
    bankName: 'Bank Kalbar',
    accountNumber: '5021-0899-2311',
    proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800',
    proofName: 'bukti_transfer_andi_apr_mei.jpg',
    status: 'pending',
    submittedAt: '2026-10-02 14:20',
    notes: 'Mohon diverifikasi bu bendahara, untuk iuran April dan Mei 2026.',
  },
  {
    id: 'sub-002',
    memberId: 'mem-3',
    memberName: 'Budi Santoso',
    memberNap: '61.11.003',
    memberWa: '6285245678903',
    memberInstansi: 'Puskesmas Simpang Hilir',
    months: [
      { year: 2026, month: 3 },
    ],
    totalAmount: 30000,
    bankAccountId: 'bank-2',
    bankName: 'BRI',
    accountNumber: '0342-01-002891-53-4',
    proofUrl: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&q=80&w=800',
    proofName: 'struk_bri_budi_maret.jpg',
    status: 'pending',
    submittedAt: '2026-10-03 09:15',
    notes: 'Iuran Maret 2026 via transfer BRImo.',
  },
  {
    id: 'sub-003',
    memberId: 'mem-5',
    memberName: 'Dedi Kurniawan',
    memberNap: '61.11.005',
    memberWa: '6281356789005',
    memberInstansi: 'Puskesmas Seponti',
    months: [
      { year: 2025, month: 11 },
      { year: 2025, month: 12 },
      { year: 2026, month: 1 },
    ],
    totalAmount: 90000,
    bankAccountId: 'bank-3',
    bankName: 'QRIS Patelki',
    accountNumber: 'ID1020304050607',
    proofUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=800',
    proofName: 'qris_gopay_dedi.jpg',
    status: 'pending',
    submittedAt: '2026-10-03 16:45',
    notes: 'Pelunasan tunggakan Nov-Des 2025 + Januari 2026 via QRIS.',
  },
  {
    id: 'sub-004',
    memberId: 'mem-4',
    memberName: 'Citra Dewi Lestari',
    memberNap: '61.11.004',
    memberWa: '6282156789004',
    memberInstansi: 'Labkesda Kab. Kayong Utara',
    months: [
      { year: 2026, month: 1 },
      { year: 2026, month: 2 },
      { year: 2026, month: 3 },
      { year: 2026, month: 4 },
      { year: 2026, month: 5 },
      { year: 2026, month: 6 },
      { year: 2026, month: 7 },
      { year: 2026, month: 8 },
      { year: 2026, month: 9 },
      { year: 2026, month: 10 },
      { year: 2026, month: 11 },
      { year: 2026, month: 12 },
    ],
    totalAmount: 360000,
    bankAccountId: 'bank-1',
    bankName: 'Bank Kalbar',
    accountNumber: '5021-0899-2311',
    proofUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&q=80&w=800',
    proofName: 'transfer_1th_citra.pdf',
    status: 'approved',
    submittedAt: '2026-01-15 10:00',
    verifiedAt: '2026-01-15 11:30',
    verifiedBy: 'Siti Nurhaliza, S.Tr.Kes',
    notes: 'Lunas 1 tahun penuh 2026.',
  }
];

export const INITIAL_TRANSACTIONS: CashTransaction[] = [
  {
    id: 'trx-001',
    date: '2026-09-01',
    type: 'income',
    category: 'Iuran Wajib Anggota',
    sourceOrRecipient: 'Iuran Kolektif Anggota DPC',
    amount: 1800000,
    description: 'Penerimaan iuran bulanan terverifikasi September 2026',
    createdAt: '2026-09-01 10:00',
  },
  {
    id: 'trx-002',
    date: '2026-09-05',
    type: 'expense',
    category: 'ATK & Kesekretariatan',
    sourceOrRecipient: 'Toko Buku Sukadana Jaya',
    amount: 320000,
    description: 'Pembelian kertas F4, tinta printer Epson, dan map arsip anggota DPC',
    createdAt: '2026-09-05 14:00',
  },
  {
    id: 'trx-003',
    date: '2026-09-12',
    type: 'income',
    category: 'Donasi & Sumbangan Sukarela',
    sourceOrRecipient: 'Hamba Allah (Senior ATLM KKU)',
    amount: 1500000,
    description: 'Donasi kas operasional pengembangan DPC Patelki Kayong Utara',
    createdAt: '2026-09-12 11:20',
  },
  {
    id: 'trx-004',
    date: '2026-09-20',
    type: 'expense',
    category: 'Bakti Sosial & Pengabdian',
    sourceOrRecipient: 'Panitia Baksos Skrining Kesehatan Kayong Utara',
    amount: 2500000,
    description: 'Pengadaan reagen rapid tes gula darah, kolesterol, dan asam urat baksos warga pedalaman',
    createdAt: '2026-09-20 16:30',
  },
  {
    id: 'trx-005',
    date: '2026-09-28',
    type: 'expense',
    category: 'Konsumsi & Rapat',
    sourceOrRecipient: 'RM Bahari Sukadana',
    amount: 450000,
    description: 'Konsumsi Rapat Pleno Koordinasi Pengurus DPC Patelki KKU',
    createdAt: '2026-09-28 19:30',
  },
  {
    id: 'trx-006',
    date: '2026-10-01',
    type: 'income',
    category: 'Iuran Wajib Anggota',
    sourceOrRecipient: 'Penerimaan Iuran Awal Bulan Oktober',
    amount: 2460000,
    description: 'Iuran terverifikasi periode Oktober 2026 (82 Anggota)',
    createdAt: '2026-10-01 08:30',
  },
  {
    id: 'trx-007',
    date: '2026-10-02',
    type: 'income',
    category: 'Donasi & Sumbangan Sukarela',
    sourceOrRecipient: 'PT Medika Prima Borneo',
    amount: 2000000,
    description: 'Sponsorship kegiatan edukasi kesehatan laboratorium',
    createdAt: '2026-10-02 13:00',
  },
  {
    id: 'trx-008',
    date: '2026-10-03',
    type: 'expense',
    category: 'Operasional Organisasi',
    sourceOrRecipient: 'Langganan Domain & Cloud Storage DPC',
    amount: 250000,
    description: 'Perpanjangan storage arsip digital dan sistem database DPC',
    createdAt: '2026-10-03 10:15',
  }
];

export const INITIAL_DONATIONS: Donation[] = [
  {
    id: 'don-1',
    date: '2026-09-12',
    donorName: 'Hamba Allah (Senior ATLM KKU)',
    donorContact: '081255443322',
    amount: 1500000,
    type: 'uang',
    purpose: 'Kas Operasional DPC & Baksos',
    description: 'Sumbangan sukarela untuk mendukung kelancaran kegiatan DPC Patelki Kayong Utara',
    createdAt: '2026-09-12',
  },
  {
    id: 'don-2',
    date: '2026-10-02',
    donorName: 'PT Medika Prima Borneo',
    donorContact: '0561-789012',
    amount: 2000000,
    type: 'uang',
    purpose: 'Bakti Sosial Skrining Penyakit Tidak Menular (PTM)',
    description: 'Bantuan kemitraan corporate untuk baksos laboratorium gratis masyarakat',
    createdAt: '2026-10-02',
  },
  {
    id: 'don-3',
    date: '2026-08-15',
    donorName: 'Alumni ATLM Kalbar Wilayah Kayong',
    donorContact: '081398761234',
    amount: 1000000,
    type: 'uang',
    purpose: 'Santunan Korban Banjir Sukadana',
    description: 'Penggalangan dana internal untuk tenaga kesehatan dan warga terdampak banjir',
    createdAt: '2026-08-15',
  }
];

export const INITIAL_SOCIAL_SERVICES: SocialService[] = [
  {
    id: 'sos-1',
    title: 'Bakti Sosial & Pemeriksaan Laboratorium Gratis Pedalaman Sukadana',
    date: '2026-09-20',
    location: 'Balai Desa Harapan Mulia, Kec. Sukadana',
    fundSource: 'Kas DPC Patelki & Donasi Mitra Medika',
    totalBudget: 4500000,
    totalSpent: 4250000,
    beneficiaries: '185 Warga Lansia dan Prasejahtera',
    description: 'Pemeriksaan gratis Hemoglobin, Glukosa Darah Sewaktu, Asam Urat, Kolesterol Total, dan Konsultasi Hasil Lab oleh ATLM DPC Patelki Kayong Utara.',
    documentationUrls: [
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&q=80&w=600',
    ],
    expenses: [
      { id: 'exp-1', item: 'Strip Tes GDS, Asam Urat, Kolesterol (10 Box)', amount: 2500000, notes: 'Pengadaan reagen instan' },
      { id: 'exp-2', item: 'Lancet, Alkohol Swab, Handscoon, Masker', amount: 450000, notes: 'BHP Medis' },
      { id: 'exp-3', item: 'Transport Tim ATLM ke Lokasi Pedalaman (3 Mobil/Speedboat)', amount: 750000, notes: 'BBM & Sewa angkutan' },
      { id: 'exp-4', item: 'Snack & Konsumsi Warga dan Relawan ATLM', amount: 550000, notes: 'Konsumsi kegiatan' },
    ],
    createdAt: '2026-09-20',
  },
  {
    id: 'sos-2',
    title: 'Tanggap Darurat & Penyerahan Bantuan Korban Banjir Teluk Batang',
    date: '2026-08-18',
    location: 'Posko Pengungsian Teluk Batang',
    fundSource: 'Donasi Anggota DPC Patelki Kayong Utara',
    totalBudget: 2200000,
    totalSpent: 2200000,
    beneficiaries: '60 Kepala Keluarga Terdampak Banjir',
    description: 'Penyaluran paket hygiene kit, kaporit disinfeksi sumur, obat-obatan dasar, dan sembako bagi warga terdampak luapan air.',
    documentationUrls: [
      'https://images.unsplash.com/photo-1547496502-affa22d38842?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&q=80&w=600',
    ],
    expenses: [
      { id: 'exp-201', item: 'Paket Sembako & Makanan Instan', amount: 1200000 },
      { id: 'exp-202', item: 'Hygiene Kit, Sabun Antiseptik & Kaporit Air Bersih', amount: 700000 },
      { id: 'exp-203', item: 'Transportasi Logistik Posko', amount: 300000 },
    ],
    createdAt: '2026-08-18',
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    recipientId: 'bendahara',
    title: '3 Pembayaran Menunggu Verifikasi',
    message: 'Terdapat 3 pengajuan pembayaran iuran baru dari Andi Setiawan, Budi Santoso, dan Dedi Kurniawan.',
    type: 'warning',
    date: '2026-10-03 16:45',
    isRead: false,
    link: 'verifikasi',
  },
  {
    id: 'notif-2',
    recipientId: 'mem-2',
    title: 'Pembayaran Sedang Diverifikasi',
    message: 'Pengajuan pembayaran iuran periode April–Mei 2026 Anda sebesar Rp60.000 telah diterima dan sedang diperiksa oleh Bendahara.',
    type: 'info',
    date: '2026-10-02 14:20',
    isRead: false,
  },
  {
    id: 'notif-3',
    recipientId: 'mem-4',
    title: 'Pembayaran Iuran Disetujui',
    message: 'Pembayaran iuran 1 tahun penuh 2026 sebesar Rp360.000 telah disetujui. Terima kasih!',
    type: 'success',
    date: '2026-01-15 11:30',
    isRead: true,
  }
];
