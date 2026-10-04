import { Member, DuesRecord, PaymentSubmission, CashTransaction, Donation, SocialService, BankAccount, AppSettings, AppNotification } from '../types';

/**
 * Data Anggota PATELKI (Kosong secara default / Siap diisi data riil)
 */
export const INITIAL_MEMBERS: Member[] = [];

/**
 * Rekening Bank Resmi DPC PATELKI Kayong Utara
 */
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

/**
 * Pengaturan Parameter & Pejabat Resmi DPC PATELKI Kayong Utara
 */
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

/**
 * Generator Catatan Iuran Default (Kosong jika tidak ada anggota)
 */
export const generateInitialDues = (): DuesRecord[] => {
  return [];
};

export const INITIAL_PAYMENT_SUBMISSIONS: PaymentSubmission[] = [];

export const INITIAL_TRANSACTIONS: CashTransaction[] = [];

export const INITIAL_DONATIONS: Donation[] = [];

export const INITIAL_SOCIAL_SERVICES: SocialService[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];
