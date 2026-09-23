# new-notes-mobil

Akıllı Liste uygulamasının React Native CLI karşılığıdır. Expo kullanılmaz.

## React Native CLI kurulumu

Bu proje Expo kullanmaz. Android ve iOS native klasörleri React Native CLI 0.87.1 template'i ile oluşturulmuştur. React Native 0.87.1 ile uyumlu React 19.2.3 kullanılır.

```bash
npm install
npm start
```

### iOS

```bash
npx pod-install
npm run ios
```

### Android

```bash
npm run android
```

Android Studio'da bir emulator veya USB debugging açık bir cihaz çalışır durumda olmalıdır.

### Kontroller

```bash
npm run typecheck
npm run lint
npm run format:check
```

Liste, madde ve kullanıcı verileri `new-notes-main` uygulamasının DB erişimli
route'ları üzerinden PostgreSQL veritabanından alınır. Mobil uygulama doğrudan
PostgreSQL'e bağlanmaz; DB şifresi uygulama paketine gömülmez. Mobil uygulama
yalnızca son başarılı sunucu yanıtını önbellek olarak AsyncStorage'da tutar;
AsyncStorage kaynak veri değildir.

Geliştirme sırasında `new-notes-main` uygulamasını `http://localhost:3000`
adresinde çalıştırın. iOS Simulator varsayılan olarak bu adrese, Android
emulator ise `http://10.0.2.2:3000` adresine bağlanır. Deploy edilmiş bir
backend kullanırken [src/config/api.local.ts](./src/config/api.local.ts)
içindeki `MOBILE_API_URL` değerini `https://...` olarak ayarlayın.
Lokal URL için [src/config/api.local.ts](./src/config/api.local.ts) içindeki
`MOBILE_API_URL` değerini `http://...:3000` olarak ayarlayın. Bu değer DB URL'si
değildir; `new-notes-main` API sunucusunun adresidir.

Mobil uygulama şu endpoint sözleşmesini kullanır:

- `GET/POST /api/users` — giriş/kayıt
- `GET/POST/PUT/DELETE /api/lists` — listeler
- `GET/POST/PUT/DELETE /api/items` — normalize edilmiş liste maddeleri

State yönetimi Redux Toolkit ile yapılır; ekranlar `src/screens/` altında,
root navigation ise `App.tsx` içinde tutulur. API bağlantı hataları mock veriyle
gizlenmez ve Jest senaryolarıyla doğrulanır.

`new-notes-main` API route'ları DB bağlantısı yoksa artık 503 döndürür; hiçbir
endpoint mobil istemciye seed/mock veri dönmez. Production'a çıkmadan önce
backend'de gerçek oturum, parola hash'leme ve kullanıcı/family yetkilendirmesi
eklenmelidir.
