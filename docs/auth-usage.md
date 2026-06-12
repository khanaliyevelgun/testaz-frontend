# Auth Kullanım Rehberi

Bu proje JWT auth akışına hazırlandı. Refresh token backend tarafından HttpOnly cookie olarak tutulur; frontend sadece kısa ömürlü access token'ı memory state içinde saklar.

## Ortam Değişkeni

Backend API adresini `.env.local` içinde tanımla:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Boş bırakılırsa API istekleri aynı origin'e gider. Örneğin frontend ve backend aynı domain altında reverse proxy ile çalışıyorsa boş bırakılabilir.

## Login Nasıl Çalışır?

Login formu [src/components/SignInInner.jsx](../src/components/SignInInner.jsx) içinden `useAuth().login()` çağırır.

Backend login cevabı şu formatta olmalıdır:

```json
{
  "user": {
    "id": "usr_123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "createdAt": "2026-06-11T12:00:00.000Z"
  },
  "accessToken": "jwt-access-token"
}
```

Refresh token response body içinde dönmemelidir. Backend aynı response içinde refresh token'ı `Set-Cookie` ile HttpOnly cookie olarak set etmelidir.

## Register Nasıl Çalışır?

Register formu [src/components/SignUpInner.jsx](../src/components/SignUpInner.jsx) içinden `useAuth().register()` çağırır.

Frontend basit şifre kontrolü yapar, ama asıl validasyon backend'de olmalıdır.

## Login Gerektiren Sayfa Nasıl Belirlenir?

Bir sayfanın tamamını korumak için component'i `ProtectedRoute` ile sar:

```jsx
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
```

Kullanıcı giriş yapmamışsa `/sign-in?next=/mevcut-sayfa` adresine yönlendirilir. Login başarılı olunca `next` adresine geri döner.

## Sadece Login Olmamış Kullanıcıların Göreceği Sayfalar

Login, register ve forgot-password sayfaları `PublicOnlyRoute` ile sarılıdır:

```jsx
import PublicOnlyRoute from "@/components/auth/PublicOnlyRoute";

<PublicOnlyRoute>
  <SignInInner />
</PublicOnlyRoute>
```

Kullanıcı zaten login olmuşsa `/` adresine veya `next` parametresine yönlendirilir.

## API İsteği Nasıl Atılır?

Protected endpoint'lere istek atarken [src/lib/api.js](../src/lib/api.js) içindeki `apiFetch` kullan:

```js
import { apiFetch } from "@/lib/api";

const courses = await apiFetch("/courses");
```

`apiFetch` otomatik olarak:

- `credentials: "include"` ekler.
- Access token varsa `Authorization: Bearer <accessToken>` header'ını ekler.
- Protected request `401` dönerse `/auth/refresh` çağırır.
- Refresh başarılı olursa access token'ı memory state'e yazar ve eski request'i bir kez tekrarlar.
- Aynı anda birden fazla request `401` alırsa tek refresh request gönderir, diğerleri sonucu bekler.
- Refresh başarısız olursa auth state'i temizler ve kullanıcıyı `/sign-in` sayfasına gönderir.

## Kullanıcı Bilgisini Alma

App ilk açıldığında `AuthProvider` otomatik olarak:

1. `POST /auth/refresh`
2. Başarılıysa `GET /auth/profile`

çağırır.

Component içinde user bilgisi için:

```js
import { useAuth } from "@/hooks/useAuth";

const { user, isAuthenticated, isInitialized } = useAuth();
```

`isInitialized` false iken auth startup kontrolü devam ediyor demektir.

## Logout Nasıl Kullanılır?

```jsx
import { useAuth } from "@/hooks/useAuth";

function LogoutButton() {
  const { logout } = useAuth();

  return <button onClick={logout}>Logout</button>;
}
```

Logout `POST /auth/logout` çağırır ve request başarısız olsa bile client tarafındaki access token ve user state temizlenir.

## Backend Cookie Beklentisi

Refresh token cookie backend tarafından şu özelliklerle set edilmelidir:

```http
Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict; Path=/auth/refresh; Max-Age=2592000
```

Development ortamında HTTPS yoksa `Secure` davranışı backend ortamına göre ayarlanmalıdır. Production'da `Secure` açık olmalıdır.

## Swagger UI

Swagger UI sayfası:

```text
http://localhost:3000/swagger-ui.html
```

OpenAPI dosyası route üzerinden servis edilir:

```text
http://localhost:3000/api/openapi
```

Kaynak contract dosyası root dizindeki [openapi.yaml](../openapi.yaml) dosyasıdır.
