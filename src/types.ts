export type ListType = 'SHOPPING' | 'TODO' | 'NOTE';
/** A list can also be a Room (Oda): a shareable container of products to buy for it. */
export type AnyListType = ListType | 'ROOM';

export type Role = 'OWNER' | 'EDITOR';

export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatar: string; // Emoji character, e.g. '🦊'
  color: string;
  password?: string;
  createdAt?: string;
  phone?: string;
  provider?: 'username';
  familyId?: string;
  familyName?: string;
  familyCode?: string;
  familyRole?: 'HEAD' | 'MEMBER';
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  bgLight: string;
  type: ListType;
}

export interface ListItem {
  id: string;
  listId: string;
  title: string;
  isCompleted: boolean;
  price: number; // for shopping
  quantity: number; // for shopping
  unit: string; // adet, kg, paket, lt, etc.
  categoryId: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH'; // for to-do
  dueDate?: string; // for to-do
  content?: string; // for notes
  isPinned?: boolean; // for notes
  assignedTo?: string; // user id
  completedBy?: string; // user id
  completedAt?: string;
  // Products in a Room (type ROOM on the parent list) reuse `price`/`quantity` as the
  // estimated unit price and target quantity, and add:
  purchasedQuantity?: number; // how many of `quantity` have actually been bought
  photos?: string[]; // product photo URLs
  links?: string[]; // shopping links
  createdAt: string;
}

export interface ListMember {
  userId: string;
  role: Role;
  joinedAt: string;
}

export interface AppList {
  id: string;
  title: string;
  description?: string;
  type: AnyListType;
  /** Room cover photo URL (ROOM lists only). */
  coverPhoto?: string;
  ownerId: string;
  familyId?: string; // Aile kimliği
  members: ListMember[];
  inviteCode: string;
  color: string;
  icon: string;
  isShared?: boolean; // true = Ortak / Aile Listesi, false = Kişisel / Özel Liste
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SavingsAssetType =
  | 'BANK_DEPOSIT'
  | 'GOLD'
  | 'CURRENCY'
  | 'INVESTMENT_FUND'
  | 'PENSION_BES'
  | 'CASH_VAULT'
  | 'CRYPTO'
  | 'OTHER';

export interface SavingsContribution {
  id: string;
  amount: number;
  unitQuantity?: number;
  date: string;
  note?: string;
  type: 'DEPOSIT' | 'WITHDRAW';
  cardId?: string;
  cardName?: string;
}

export type SavingsTransaction = SavingsContribution;

export interface SavingsAsset {
  id: string;
  userId?: string;
  familyId?: string; // Aile kimliği
  isShared?: boolean; // true = Ortak / Aile Birikimi, false = Kişisel / Özel Birikim
  sharedWith?: string[]; // IDs or names of shared members
  title: string;
  category: string; // e.g. "Banka Vadeli", "Altın & Ziynet", "Döviz (USD/EUR)", "BES / Emeklilik", "Yatırım Fonu", "Nakit Kasa"
  assetType?: SavingsAssetType;
  currentAmount: number; // Güncel yapılmış toplam birikim tutarı (₺)
  initialAmount?: number; // Başlangıç yatırımı
  targetAmount?: number; // Opsiyonel referans
  currency?: string; // 'TRY' | 'USD' | 'EUR' | 'GOLD_GRAM' | 'GOLD_QUARTER' | 'GOLD_HALF' | 'GOLD_FULL' | 'GOLD_REPUBLIC' | 'GOLD_ONS' | 'GBP'
  unitQuantity?: number; // Örn: 5 adet (çeyrek), 24 gram, 1200 EUR
  unitPrice?: number; // Birim piyasa/alış fiyatı (₺)
  institution?: string; // Örn: Garanti BBVA, Yapı Kredi, Fiziki Kasa
  icon: string;
  color: string;
  createdAt: string;
  updatedAt?: string;
  contributions: SavingsContribution[];
  notes?: string;
  linkedCardId?: string; // Birikim yapılan / bağlı olan kaynak kart
  linkedCardName?: string; // Kart adı
  excludeFromReports?: boolean; // Raporlardan hariç tutulma durumu
}

// Backward compatibility alias
export type SavingsGoal = SavingsAsset;

export type PaymentCardType =
  | 'FOOD_CARD' // Yemek Kartı (Sodexo, Multinet, Ticket Edenred, Metropol, Setcard vb.)
  | 'CREDIT_CARD' // Kredi Kartı (Bonus, Maximum, World, Axess vb.)
  | 'DEBIT_CARD' // Banka Kartı / Vadesiz Hesap (Ziraat, Garanti, İş, Enpara vb.)
  | 'CASH_WALLET' // Nakit Para / Cüzdan
  | 'PREPAID_CARD'; // Ön Ödemeli Kart (Papara, Paycell vb.)

export interface CardTransaction {
  id: string;
  cardId: string;
  amount: number;
  type: 'SPEND' | 'TOP_UP'; // Harcama veya Bakiye Yükleme
  title: string;
  date: string;
  categoryName?: string;
  relatedExpenseId?: string;
  note?: string;
}

export interface PaymentCard {
  id: string;
  userId: string;
  familyId?: string;
  isShared?: boolean;
  name: string; // e.g. "Sodexo / Pluxee", "Garanti Bonus", "Nakit Cüzdan"
  type: PaymentCardType;
  provider?: string; // "Sodexo" | "Multinet" | "Ticket" | "Metropol" | "Setcard" | "Garanti" | "Yapı Kredi" | "İş Bankası" | "Ziraat" | "Nakit" | "Diğer"
  last4?: string;
  color: string;
  icon?: string;
  balance: number; // Güncel bakiye (Özellikle Yemek Kartları ve Nakit için kendi içinde bağımsız yönetilir)
  initialBalance?: number;
  monthlyAllowance?: number; // Yemek kartı için aylık yükleme tutarı (örn. 4.500 ₺)
  creditLimit?: number; // Kredi kartı için limit
  currentDebt?: number; // Kredi kartı harcama / borç
  cutoffDay?: number; // Kredi kartı hesap kesim günü (1-31)
  dueDay?: number; // Kredi kartı son ödeme günü (1-31)
  currency?: string; // Para Birimi: 'TRY' | 'EUR' | 'USD' | 'GBP'
  isInvestmentAccount?: boolean; // Doğrudan Yatırım / Birikim Hesabı (Döviz, Mevduat, Vadeli vb.)
  investmentType?: string; // Örn: "Döviz Hesabı (EUR)", "Döviz Hesabı (USD)", "Banka Vadeli", "Mevduat Hesabı", "Yatırım & Fon"
  activeBillingCycle?: string; // Seçili ekstre dönemi ('CURRENT' | 'PREV_1' | 'PREV_2' | 'NEXT_1')
  excludeFromReports?: boolean; // Raporlardan hariç tutulma durumu
  transactions?: CardTransaction[];
  createdAt: string;
  updatedAt?: string;
}

export interface ExpenseLog {
  id: string;
  userId: string;
  familyId?: string; // Aile kimliği
  isShared?: boolean; // true = Ortak / Aile Harcaması, false = Kişisel / Özel Harcama
  sharedWith?: string[];
  listId?: string;
  listTitle?: string;
  amount: number;
  currency?: string; // Para Birimi: 'TRY' | 'EUR' | 'USD' | 'GBP'
  categoryId?: string;
  categoryName: string;
  date: string; // ISO string e.g. "2026-08-30"
  itemCount?: number;
  itemsSummary?: string[];
  type?: 'SHOPPING_CHECKOUT' | 'DIRECT_EXPENSE' | 'BILL' | 'OTHER';
  paymentMethod?: string; // 'Kredi Kartı' | 'Nakit' | 'Banka Kartı / Havale' | 'Yemek Kartı (Sodexo)' | 'Yemek Kartı (Multinet)' | 'Otomatik Ödeme'
  cardId?: string; // Harcamanın yapıldığı kart / cüzdan ID'si
  cardName?: string; // Örn. "Sodexo Pluxee", "Garanti Bonus", "Nakit Cüzdan"
  cardType?: PaymentCardType;
  note?: string;
  receiptNumber?: string;
}

export interface TemplateItem {
  id: string;
  title: string;
  price?: number;
  quantity?: number;
  unit?: string;
  categoryId?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  content?: string;
}

export interface ListTemplate {
  id: string;
  title: string;
  description?: string;
  type: ListType;
  icon: string;
  color: string;
  bgLight?: string;
  items: TemplateItem[];
  isCustom?: boolean;
  createdAt: string;
}

export type TabType = 'lists' | 'finance' | 'shared' | 'analytics' | 'settings';
