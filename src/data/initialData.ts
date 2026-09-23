import { AppList, Category, ExpenseLog, ListItem, ListTemplate, PaymentCard, SavingsAsset, User } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  // SHOPPING CATEGORIES
  { id: 'cat-market', name: 'Süpermarket & Gıda', color: '#10b981', icon: 'ShoppingCart', bgLight: '#ecfdf5', type: 'SHOPPING' },
  { id: 'cat-manav', name: 'Manav & Meyve-Sebze', color: '#84cc16', icon: 'Apple', bgLight: '#f7fee7', type: 'SHOPPING' },
  { id: 'cat-sarkuteri', name: 'Şarküteri & Et-Balık', color: '#ef4444', icon: 'Beef', bgLight: '#fef2f2', type: 'SHOPPING' },
  { id: 'cat-temizlik', name: 'Temizlik & Deterjan', color: '#06b6d4', icon: 'Sparkles', bgLight: '#ecfeff', type: 'SHOPPING' },
  { id: 'cat-kisisel', name: 'Kozmetik & Bakım', color: '#ec4899', icon: 'Heart', bgLight: '#fdf2f8', type: 'SHOPPING' },
  { id: 'cat-teknoloji', name: 'Teknoloji & Elektronik', color: '#6366f1', icon: 'Laptop', bgLight: '#eef2ff', type: 'SHOPPING' },
  { id: 'cat-giyim', name: 'Giyim & Aksesuar', color: '#f59e0b', icon: 'Shirt', bgLight: '#fffbeb', type: 'SHOPPING' },
  { id: 'cat-diger', name: 'Diğer Alışveriş', color: '#8b5cf6', icon: 'Package', bgLight: '#f5f3ff', type: 'SHOPPING' },

  // TODO CATEGORIES
  { id: 'cat-todo-is', name: 'İş & Kariyer', color: '#3b82f6', icon: 'Briefcase', bgLight: '#eff6ff', type: 'TODO' },
  { id: 'cat-todo-saglik', name: 'Kişisel & Sağlık', color: '#10b981', icon: 'Activity', bgLight: '#ecfdf5', type: 'TODO' },
  { id: 'cat-todo-ev', name: 'Ev & Yaşam', color: '#f59e0b', icon: 'Home', bgLight: '#fffbeb', type: 'TODO' },
  { id: 'cat-todo-finans', name: 'Finans & Fatura', color: '#ef4444', icon: 'CreditCard', bgLight: '#fef2f2', type: 'TODO' },
  { id: 'cat-todo-egitim', name: 'Eğitim & Kitap', color: '#8b5cf6', icon: 'GraduationCap', bgLight: '#f5f3ff', type: 'TODO' },
  { id: 'cat-todo-seyahat', name: 'Seyahat & Ulaşım', color: '#06b6d4', icon: 'Plane', bgLight: '#ecfeff', type: 'TODO' },
  { id: 'cat-todo-diger', name: 'Diğer Görevler', color: '#64748b', icon: 'CheckCircle2', bgLight: '#f8fafc', type: 'TODO' },

  // NOTE CATEGORIES
  { id: 'cat-note-fikir', name: 'Fikir & Proje', color: '#8b5cf6', icon: 'Lightbulb', bgLight: '#f5f3ff', type: 'NOTE' },
  { id: 'cat-note-toplanti', name: 'Toplantı & Görüşme', color: '#3b82f6', icon: 'Users', bgLight: '#eff6ff', type: 'NOTE' },
  { id: 'cat-note-gunluk', name: 'Günlük & Düşünce', color: '#ec4899', icon: 'BookOpen', bgLight: '#fdf2f8', type: 'NOTE' },
  { id: 'cat-note-tarif', name: 'Tarif & Mutfak', color: '#10b981', icon: 'Utensils', bgLight: '#ecfdf5', type: 'NOTE' },
  { id: 'cat-note-onemli', name: 'Önemli Bilgi & Şifre', color: '#ef4444', icon: 'Key', bgLight: '#fef2f2', type: 'NOTE' },
  { id: 'cat-note-diger', name: 'Genel Notlar', color: '#64748b', icon: 'StickyNote', bgLight: '#f8fafc', type: 'NOTE' },
];

// Gerçek kullanıcılar kayıt olarak gelecektir - Dummy kullanıcılar temizlendi
export const INITIAL_USERS: User[] = [];

// Gerçek listeler veritabanından/kullanıcıdan gelecektir - Dummy listeler temizlendi
export const INITIAL_LISTS: AppList[] = [];

// Gerçek maddeler veritabanından gelecektir - Dummy maddeler temizlendi
export const INITIAL_ITEMS: ListItem[] = [];

// Gerçek harcamalar veritabanından gelecektir - Dummy harcamalar temizlendi
export const INITIAL_EXPENSES: ExpenseLog[] = [];

// Hazır şablonlar (İsteğe bağlı boş liste oluşturmak için kullanılabilir)
export const INITIAL_TEMPLATES: ListTemplate[] = [];

// Gerçek birikim varlıkları veritabanından gelecektir - Dummy birikimler temizlendi
export const INITIAL_SAVINGS_GOALS: SavingsAsset[] = [];

// Gerçek kartlar ve cüzdanlar veritabanından/kullanıcıdan gelecektir
export const INITIAL_PAYMENT_CARDS: PaymentCard[] = [];

