import az from "@/locales/az.json";
import en from "@/locales/en.json";
import { staticAz, staticEn, staticSource } from "@/locales/static";

export const DEFAULT_LOCALE = "az";
export const SUPPORTED_LOCALES = ["az", "en"];
const dictionaries = { az, en };
let activeLocale = DEFAULT_LOCALE;
const staticFallbackTranslations = {
  az: {
    "Bloq": "Bloq",
    // Practice feature — English-source labels (sidebar + dashboard quick link) → Azerbaijani.
    "Practice": "Məşq",
    // Org-invite redeem — English-source labels (sidebar + assignments CTA + heading) → Azerbaijani.
    "Join by code": "Kodla qoşul",
    // Official exams — English-source labels (sidebar + heading) → Azerbaijani.
    "Official exams": "Rəsmi imtahanlar",
  },
  en: {
    "Planlar": "Plans",
    "Naviqasiya": "Navigation",
    "Bloq": "Blog",
    "Yeni imtahan yarat": "Create new exam",
    "İmtahan yarat": "Create exam",
    "Sil": "Delete",
    "Daxil ol": "Sign in",
    "Qeydiyyat": "Sign up",
    // Accessibility labels (Batch 4)
    "Səhifələmə": "Pagination",
    "Yenilə": "Refresh",
    "Sətir əməliyyatları": "Row actions",
    "Ad və ya email üzrə axtar": "Search by name or email",
    "Sual mətni üzrə axtar": "Search question text",
    "Plan kodu üzrə axtar": "Search plan code",
    // Input placeholders (Batch 5 localization)
    "Əməliyyat prefiksi": "Action prefix",
    "İcraçı istifadəçi ID-si": "Actor user ID",
    "Hədəf növü": "Target type",
    "Aylıq plan": "Monthly plan",
    "Şagirdlər üçün əlavə təlimatlar (opsional)": "Optional instructions for learners",
    "Əlavə qeyd (opsional)": "Optional note",
    "Test başlığı (opsional)": "Optional test title",
    "Təşkilatın adı": "Organization name",
    "Mövzunun adı": "Topic name",
    "Ad, soyad, email və ya ID": "Name, surname, email or ID",
    "İstifadəçi adı, email və ya ad": "Username, email or name",
    "İstifadəçi ID-lərini vergül və ya boşluqla ayıraraq daxil edin": "Paste user IDs separated by commas or spaces",
    "Ad və ya email üzrə axtar...": "Search name or email...",
    "Əsas mövzular üzrə axtar...": "Search parent topics...",
    "Plan kodu üzrə axtar...": "Search plan code...",
    "Sual mətni üzrə axtar...": "Search question text...",
    "Fənn üzrə axtar...": "Search subject...",
    "Fənlər üzrə axtar...": "Search subjects...",
    "Mövzular üzrə axtar...": "Search topics...",
    "Hamısı": "All",
    "Kod": "Code",
    "Say": "Count",
    "Sinif": "Grade",
    // Org invite validation (localization follow-up)
    "Nəticələri yükləməzdən əvvəl təşkilat seçin.": "Select an organization before loading results.",
    "Düzgün test UUID-si daxil edin.": "Enter a valid test UUID.",
    "Təşkilat seçin.": "Select an organization.",
    // Payment return page
    "Ödəniş yoxlanılır": "Verifying payment",
    "Ödənişiniz təsdiqlənir. Bu bir neçə saniyə çəkə bilər.":
      "Your payment is being confirmed. This may take a few seconds.",
    "Ödəniş uğurlu oldu": "Payment successful",
    "Abunəliyiniz aktivləşdirildi. İndi bütün funksiyalardan istifadə edə bilərsiniz.":
      "Your subscription is now active. You can use all features.",
    "Ödəniş emal olunur": "Payment processing",
    "Ödənişiniz qəbul edildi və hazırda emal olunur. Abunəliyiniz təsdiqləndikdən sonra aktivləşəcək.":
      "Your payment has been received and is being processed. Your subscription will activate once it is confirmed.",
    "Ödəniş tamamlanmadı": "Payment not completed",
    "Ödəniş tamamlanmadı və ya ləğv edildi. Yenidən cəhd edə bilərsiniz.":
      "The payment was not completed or was canceled. You can try again.",
    "İstinad": "Reference",
    "Abunəliklərə qayıt": "Back to subscriptions",
    "Planları gör": "View plans",
    // One-shot exam "already completed" UX
    "Bu imtahanı artıq tamamlamısınız. Nəticələrinizə baxa bilərsiniz.":
      "You have already completed this exam. You can view your results.",
    "Bu imtahanı artıq tamamlamısınız. Bu, cavablarınızın yalnız oxuna bilən görünüşüdür.":
      "You have already completed this exam. This is a read-only view of your answers.",
    "Bu imtahanın vaxtı bitib. Cavablarınız avtomatik təqdim edildi.":
      "This exam has expired. Your answers were submitted automatically.",
    "Nəticələrə bax": "View results",
    // Practice feature (ad-hoc practice session start)
    "Bir fənn seçin və özünüzü sınamaq üçün məşq testinə başlayın.":
      "Choose a subject and start a practice test to challenge yourself.",
    "Fənn": "Subject",
    "Mövzu (opsional)": "Topic (optional)",
    "Çətinlik": "Difficulty",
    // Difficulty option labels (shared AZ source with the question form) — EN so the EN toggle is consistent.
    "Asan": "Easy",
    "Orta": "Medium",
    "Çətin": "Hard",
    // Keep the English-source sidebar/quick-link label in English on the EN toggle.
    "Practice": "Practice",
    "Join by code": "Join by code",
    "Official exams": "Official exams",
    "Sual sayı": "Question count",
    "Məşqə başla": "Start practice",
    "Başlayır...": "Starting...",
    "Məşq testləri vaxt məhdudiyyəti olmadan, faizlə qiymətləndirilir.":
      "Practice tests are untimed and scored by percentage.",
    "Fənn seçin": "Select a subject",
    "Yüklənir...": "Loading...",
    "Əvvəlcə fənn seçin": "Select a subject first",
    "Bütün mövzular": "All topics",
    "Mövzu yoxdur": "No topics",
    "Zəhmət olmasa bir fənn seçin.": "Please select a subject.",
    "Zəhmət olmasa çətinlik səviyyəsini seçin.": "Please select a difficulty.",
    "Sessiya başladıla bilmədi.": "The session could not be started.",
    "Məşq sessiyası başladıla bilmədi.": "The practice session could not be started.",
    "İpucu: “Bütün mövzular”ı seçin və ya başqa çətinlik səviyyəsi sınayın.":
      "Tip: choose “All topics” or try a different difficulty.",
    "İpucu: başqa fənn və ya çətinlik səviyyəsi sınayın.":
      "Tip: try a different subject or difficulty.",
    // Org-invite redeem (join a course/tutor/school test by code)
    "Kurs, repetitor və ya məktəbdən aldığınız dəvət kodunu daxil edərək testə qoşulun.":
      "Join a test by entering the invite code you received from a course, tutor, or school.",
    "Dəvət kodu": "Invite code",
    "Testə qoşul": "Join test",
    "Qoşulur...": "Joining...",
    "Qoşulduqdan sonra test dərhal başlayır. Vaxt məhdudiyyəti varsa, geri sayım qoşulan andan başlayır.":
      "The test starts immediately after you join. If it is timed, the countdown begins the moment you join.",
    "Bu testi artıq tamamlamısınız. Nəticələrinizə baxa bilərsiniz.":
      "You have already completed this test. You can view your results.",
    "Zəhmət olmasa dəvət kodunu daxil edin.": "Please enter the invite code.",
    "Test sessiyası başladıla bilmədi.": "The test session could not be started.",
    "Dəvət koduna qoşulmaq alınmadı.": "Could not join with the invite code.",
    "Belə bir dəvət kodu tapılmadı. Kodu yoxlayıb yenidən cəhd edin.":
      "No such invite code was found. Check the code and try again.",
    // Official exams (Buraxılış / Qəbul simulations)
    "Rəsmi Buraxılış və Qəbul imtahanlarının simulyasiyasına başlayın.":
      "Start a simulation of the official Buraxılış and Qəbul exams.",
    "sual": "questions",
    "dəq": "min",
    "bal": "points",
    "dəqiqə": "minutes",
    "Mənfi qiymətləndirmə": "Negative marking",
    "Mənfi qiymətləndirmə yoxdur": "No negative marking",
    "Rəsmi imtahan tapılmadı.": "No official exams found.",
    "İmtahana başla": "Start exam",
    "İxtisas qrupu": "Specialization group",
    "Qrup seçin": "Select a group",
    "Fənn bölgüsünü görmək üçün ixtisas qrupu seçin.":
      "Select a specialization group to see the subject breakdown.",
    "Qapalı": "Closed",
    "Açıq": "Open",
    "Maks. bal": "Max. points",
    "İmtahana başlanılsın?": "Start the exam?",
    "Bu, vaxt məhdudiyyətli rəsmi imtahandır. Başladıqdan sonra geri sayım dərhal başlayır.":
      "This is a timed official exam. The countdown begins as soon as you start.",
    "Ləğv et": "Cancel",
    "Bəli, başla": "Yes, start",
    "İmtahan planı yüklənmədi.": "The exam blueprint could not be loaded.",
    "İmtahan sessiyası başladıla bilmədi.": "The exam session could not be started.",
    "Bu imtahanın bütün fənləri üzrə kifayət qədər yeni sual olmaya bilər. Başqa qrup və ya imtahan sınayın.":
      "There may not be enough new questions across all of this exam’s subjects. Try another group or exam.",
    // Error & feedback messages (Batch 1 localization)
    "Audit qeydləri yüklənmədi.": "Audit logs could not be loaded.",
    "Sual yüklənmədi.": "Question could not be loaded.",
    "Fənn yüklənmədi.": "Subject could not be loaded.",
    "Mövzu yüklənmədi.": "Topic could not be loaded.",
    "İstifadəçi yüklənmədi.": "User could not be loaded.",
    "İstifadəçilər yüklənmədi.": "Users could not be loaded.",
    "İstifadəçi əməliyyatı alınmadı.": "User action failed.",
    "Şikayətlər yüklənmədi.": "Reports could not be loaded.",
    "Şikayət əməliyyatı alınmadı.": "Report action failed.",
    "Fənlər yüklənmədi.": "Subjects could not be loaded.",
    "Fənnin statusu yenilənmədi.": "Subject status could not be updated.",
    "Mövzunun statusu yenilənmədi.": "Topic status could not be updated.",
    "Düzgün ad və mənfi olmayan qiymət daxil edin.": "Enter a valid name and non-negative price.",
    "Müddət 1 ilə 3660 gün arasında olmalıdır.": "Period must be between 1 and 3660 days.",
    "Valyuta üç hərfli kod olmalıdır.": "Currency must be a three-letter code.",
    "Kod yalnız hərf, rəqəm və alt xəttdən ibarət ola bilər.": "Code may contain only letters, numbers and underscores.",
    "İstifadəçi axtarışı ən azı 2 simvol tələb edir.": "User search needs at least 2 characters.",
    "Şablon adı tələb olunur.": "Template name is required.",
    "Axtarış ən azı 2 simvol tələb edir.": "Search needs at least 2 characters.",
    "AI tapşırıqları yüklənmədi.": "AI jobs could not be loaded.",
    "AI generasiya tapşırığı başladıla bilmədi.": "AI generation job could not be started.",
    "AI tapşırığının təfərrüatı yüklənmədi.": "AI job detail could not be loaded.",
    "Cavab yadda saxlanılmadı.": "Answer could not be saved.",
    "Təyin edilmiş görünürlük ən azı bir istifadəçi ID-si tələb edir.": "Assigned visibility requires at least one user id.",
    "Təyinatlar yüklənmədi.": "Assignments could not be loaded.",
    "Ən azı bir bölmə tələb olunur.": "At least one section is required.",
    "Cəhdlər yüklənmədi.": "Attempts could not be loaded.",
    "Toplu təsdiq alınmadı.": "Bulk approval failed.",
    "Ödəniş başladıla bilmədi.": "Checkout could not be started.",
    "Uşağın bağlantısı ləğv edilmədi.": "Child could not be unlinked.",
    "Uşaqlar yüklənmədi.": "Children could not be loaded.",
    "Kopyalama alınmadı. Kodu seçib əl ilə kopyalayın.": "Copy failed. Select the code and copy it manually.",
    "İdarə paneli məlumatları yüklənmədi.": "Dashboard data could not be loaded.",
    "Təsvir 2000 simvoldan uzun ola bilməz.": "Description cannot be longer than 2000 characters.",
    "Müddət 600 dəqiqədən çox ola bilməz.": "Duration cannot be more than 600 minutes.",
    "İmtahan əməliyyatı alınmadı.": "Exam action failed.",
    "İmtahan yaradılmadı.": "Exam could not be created.",
    "İmtahan silinmədi. Artıq cəhdləri olan imtahanları arxivləşdirin.": "Exam could not be deleted. Archive exams that already have attempts.",
    "İmtahan yüklənmədi.": "Exam could not be loaded.",
    "İmtahan başladıla bilmədi.": "Exam could not be started.",
    "İmtahan təqdim edilmədi.": "Exam could not be submitted.",
    "İmtahanın önizləməsi yüklənmədi.": "Exam preview could not be loaded.",
    "İmtahan sessiyası yüklənmədi.": "Exam session could not be loaded.",
    "İmtahan sessiyasının ID-si qaytarılmadı.": "Exam session id was not returned.",
    "İmtahanlar yüklənmədi.": "Exams could not be loaded.",
    "Dəvət ləğv edilmədi.": "Invitation could not be cancelled.",
    "Dəvət göndərilmədi.": "Invitation could not be sent.",
    "Dəvət yenilənmədi.": "Invitation could not be updated.",
    "Şagirdin tərəqqisi yüklənmədi.": "Learner progress could not be loaded.",
    "Şagirdlər axtarıla bilmədi.": "Learners could not be searched.",
    "Bağlı uşaqlar yüklənmədi.": "Linked children could not be loaded.",
    "Bildiriş parametri yenilənmədi.": "Notification setting could not be updated.",
    "Təşkilat yaradılmadı.": "Organization could not be created.",
    "Təşkilat üzvləri yüklənmədi.": "Organization members could not be loaded.",
    "Təşkilatın adı 200 simvoldan uzun ola bilməz.": "Organization name cannot be longer than 200 characters.",
    "Təşkilatın adı tələb olunur.": "Organization name is required.",
    "Təşkilatlar yüklənmədi.": "Organizations could not be loaded.",
    "Valideyn girişi ləğv edilmədi.": "Parent access could not be revoked.",
    "Valideyn profili yenilənmədi.": "Parent profile could not be updated.",
    "Keçid balı 0 ilə 100 arasında olmalıdır.": "Pass mark must be between 0 and 100.",
    "Ödəniş əməliyyatları yüklənmədi.": "Payment transactions could not be loaded.",
    "Planın təfərrüatı yüklənmədi.": "Plan details could not be loaded.",
    "Planın statusu dəyişdirilmədi.": "Plan status could not be changed.",
    "Önizləmə yüklənmədi.": "Preview could not be loaded.",
    "Profil məlumatı yüklənmədi.": "Profile information could not be loaded.",
    "Tərəqqi məlumatı yüklənmədi.": "Progress information could not be loaded.",
    "Sual əməliyyatı alınmadı.": "Question action failed.",
    "Sual barədə şikayət göndərilmədi.": "Question report could not be sent.",
    "Suallar yüklənmədi.": "Questions could not be loaded.",
    "Nəticənin təfərrüatı yüklənmədi.": "Result detail could not be loaded.",
    "Nəticə təfərrüatları yüklənmədi.": "Result details could not be loaded.",
    "Nəticələr yüklənmədi.": "Results could not be loaded.",
    "Parametrlər yüklənmədi.": "Settings could not be loaded.",
    "Parametrlər yenilənmədi.": "Settings could not be updated.",
    "Statistika yüklənmədi.": "Statistics could not be loaded.",
    "Şagird profili yenilənmədi.": "Student profile could not be updated.",
    "Fənn yaradılmadı.": "Subject could not be created.",
    "Fənn yenilənmədi.": "Subject could not be updated.",
    "Fənn tələb olunur.": "Subject is required.",
    "Fənlər və siniflər yüklənmədi.": "Subjects and grades could not be loaded.",
    "Abunəlik ləğv edilmədi.": "Subscription could not be canceled.",
    "Abunəlik məlumatı yüklənmədi.": "Subscription information could not be loaded.",
    "Abunəlik planı yadda saxlanılmadı.": "Subscription plan could not be saved.",
    "Abunəlik planları yüklənmədi.": "Subscription plans could not be loaded.",
    "Abunəliklər yüklənmədi.": "Subscriptions could not be loaded.",
    "Şablon yüklənmədi.": "Template could not be loaded.",
    "Şablonlar yüklənmədi.": "Templates could not be loaded.",
    "Test ID-si tələb olunur.": "Test ID is required.",
    "Test dəvəti yaradılmadı.": "Test invitation could not be created.",
    "Test nəticələri yüklənmədi.": "Test results could not be loaded.",
    "Başlıq 200 simvoldan uzun ola bilməz.": "Title cannot be longer than 200 characters.",
    "Mövzu yaradılmadı.": "Topic could not be created.",
    "Mövzu yenilənmədi.": "Topic could not be updated.",
    "Mövzular yüklənmədi.": "Topics could not be loaded.",
    "İstifadəçi yaradılmadı.": "User could not be created.",
    "İstifadəçi yenilənmədi.": "User could not be updated.",
    "İstifadəçilər axtarıla bilmədi.": "Users could not be searched.",
    // Success / notice / confirmation messages (Batch 1 localization)
    "Şagird profili yeniləndi.": "Student profile updated.",
    "Valideyn profili yeniləndi.": "Parent profile updated.",
    "Bu valideynin nəticələrinizə və tərəqqinizə girişini ləğv edək?": "Remove this parent's access to your results and progress?",
    "Valideyn girişi ləğv edildi.": "Parent access revoked.",
    "Bildiriş parametrləri yeniləndi.": "Notification settings updated.",
    "Kopyalandı": "Copied",
    "Linki seçib əl ilə kopyalayın": "Select the link and copy manually",
    "Bu imtahanı həmişəlik silək? Bu, yalnız cəhdləri olmadıqda mümkündür.": "Permanently delete this exam? This only succeeds when it has no attempts.",
    "Təyinat ləğv edildi.": "Assignment revoked.",
    "Bu şagirdi təyinat siyahısından çıxaraq?": "Remove this learner from the assignment list?",
    "Bu abunəliyi ləğv edək? Giriş dərhal bitəcək.": "Cancel this subscription? Access will end immediately.",
    "Abunəlik ləğv edildi.": "Subscription canceled.",
    "Gözləyən bütün sualları təsdiqləyək?": "Approve all pending questions?",
    "Abunəlik planı yeniləndi.": "Subscription plan updated.",
    "Abunəlik planı yaradıldı.": "Subscription plan created.",
    "Abunəlik planı deaktiv edildi.": "Subscription plan deactivated.",
    "Abunəlik planı aktivləşdirildi.": "Subscription plan activated.",
    "Sual barədə şikayət baxış komandasına göndərildi.": "Question report sent to the review team.",
    "Test dəvəti uğurla yaradıldı.": "Test invitation created successfully.",
    "Kod kopyalandı.": "Code copied.",
    "Təşkilat uğurla yaradıldı.": "Organization created successfully.",
    "Dəvət göndərildi.": "Invitation sent.",
    "Uşağın bağlantısı ləğv edildi.": "Child unlinked.",
    "Bu gözləyən dəvəti ləğv edək?": "Cancel this pending invitation?",
    "Dəvət ləğv edildi.": "Invitation cancelled.",
    "İmtahan bərpa edildi.": "Exam restored.",
    "İmtahan arxivləşdirildi.": "Exam archived.",
    "Bu imtahanı bərpa edib şagirdlərə yenidən giriş icazəsi verək?": "Restore this exam and allow learners to access it again?",
    "Bu imtahanı arxivləşdirək? Şagirdlər artıq onu önizləyə və ya başlada bilməyəcək.": "Archive this exam? Learners will no longer be able to preview or start it.",
  },
};

export const setActiveLocale = (locale) => {
  activeLocale = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
};

const readPath = (object, path) =>
  String(path || "").split(".").filter(Boolean).reduce(
    (value, part) => (value && typeof value === "object" ? value[part] : undefined),
    object
  );

const interpolate = (value, params) =>
  typeof value === "string"
    ? value.replace(/{{\s*([\w.-]+)\s*}}/g, (_, name) => String(params?.[name] ?? ""))
    : value;

export const getDictionary = (locale = activeLocale) => dictionaries[locale] || dictionaries[DEFAULT_LOCALE];

export const translate = (key, params, locale = activeLocale) => {
  const value = readPath(getDictionary(locale), key) ?? readPath(getDictionary(DEFAULT_LOCALE), key);
  return typeof value === "string" ? interpolate(value, params) : key;
};

const normalizeMessageKey = (value) => String(value || "").trim()
  .replace(/([a-z])([A-Z])/g, "$1_$2").replace(/[.\s/-]+/g, "_")
  .replace(/[^\w_]/g, "").replace(/_+/g, "_").replace(/^_|_$/g, "").toLowerCase();

const looksLikeTranslationKey = (value) => /^[a-z][\w.-]+$/i.test(String(value || "").trim())
  && (/[._]/.test(value) || /^[A-Z0-9_]+$/.test(value));

/** API message keys are never displayed directly to the user. */
export const translateApiMessage = (value, fallback = "api.unknownKey", locale = activeLocale) => {
  if (typeof value !== "string" || !value.trim()) return translate(fallback, undefined, locale);
  const raw = value.trim();
  const candidates = [raw, `api.${raw}`, `api.codes.${raw}`, `api.codes.${normalizeMessageKey(raw)}`];
  const match = candidates.map((candidate) => readPath(getDictionary(locale), candidate)).find((item) => typeof item === "string");
  if (match) return match;
  return looksLikeTranslationKey(raw) ? translate(fallback, undefined, locale) : raw;
};

const MESSAGE_FIELDS = ["message", "error", "detail", "title"];

/**
 * Only presentation fields are localized; names, enums, roles and other data
 * values are never changed. We localize the known message fields (`message`,
 * `error`, `detail`, `title`, `errors`) wherever they appear in the response
 * tree, but we only recurse structurally into objects — we never translate a
 * bare string that merely happens to sit in some other field. Blindly mapping
 * every nested string through `translateApiMessage` would rewrite enum-like
 * values such as a user's `roles: ["STUDENT"]` into a fallback error string.
 */
export const localizeApiResponse = (value, locale = activeLocale) => {
  if (typeof value === "string") return translateApiMessage(value, "api.unknownKey", locale);
  if (Array.isArray(value)) return value.map((item) => localizeStructure(item, locale));
  return localizeStructure(value, locale);
};

const localizeStructure = (value, locale) => {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => localizeStructure(item, locale));

  const result = { ...value };

  MESSAGE_FIELDS.forEach((field) => {
    if (typeof result[field] === "string") {
      result[field] = translateApiMessage(result[field], "api.unknownKey", locale);
    }
  });

  if (Array.isArray(result.errors)) {
    result.errors = result.errors.map((error) =>
      typeof error === "string"
        ? translateApiMessage(error, "api.validation", locale)
        : localizeStructure(error, locale)
    );
  }

  Object.entries(result).forEach(([field, item]) => {
    if (field !== "errors" && item && typeof item === "object") {
      result[field] = localizeStructure(item, locale);
    }
  });

  return result;
};

const flatten = (object, prefix = "", output = {}) => {
  Object.entries(object || {}).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") flatten(value, path, output);
    else output[path] = value;
  });
  return output;
};

/** Maps legacy static English template labels to their locale equivalent. */
export const getStaticTextTranslations = (locale = activeLocale) => {
  const english = flatten(en.static);
  const translated = flatten(getDictionary(locale).static);
  const legacyTranslations = Object.entries(english).reduce((map, [key, source]) => {
    if (typeof source === "string" && typeof translated[key] === "string") map[source] = translated[key];
    return map;
  }, {});
  const fileTranslations = locale === "en" ? staticEn : staticAz;
  const map = Object.entries(staticSource).reduce((acc, [key, source]) => {
    const translatedFromFile = fileTranslations[key];
    const translatedValue =
      staticFallbackTranslations[locale]?.[source] ||
      (translatedFromFile && translatedFromFile !== source ? translatedFromFile : null) ||
      source;
    if (typeof source === "string" && typeof translatedValue === "string") {
      acc[source] = translatedValue;
    }
    return acc;
  }, legacyTranslations);

  // Fold in any direct fallback entries whose source string is not covered by the
  // extracted `staticSource` pipeline (e.g. strings added straight to
  // `staticFallbackTranslations` without a matching hash entry). Never overrides an
  // already-resolved translation — the pipeline/legacy sources still win.
  Object.entries(staticFallbackTranslations[locale] || {}).forEach(([source, translatedValue]) => {
    if (typeof translatedValue === "string" && !(source in map)) {
      map[source] = translatedValue;
    }
  });

  return map;
};
