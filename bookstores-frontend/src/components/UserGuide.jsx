import { useState, useEffect, useRef } from "react";
import {
    BookOpen, Search, MapPin, Star, MessageCircle, BarChart2,
    Bot, Moon, ChevronRight, ChevronDown, ChevronUp, X, ArrowLeft,
    Info, HelpCircle, UserCheck, Map, Heart, ShieldCheck, Play, Lock, FileText
} from "lucide-react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const sections = [
    {
        id: "start",
        icon: <UserCheck size={20} />,
        color: "#6366f1",
        bg: "#eef2ff",
        title: "Початок роботи",
        subtitle: "Реєстрація та вхід",
        images: ["start1", "start2"],
        content: [
            {
                heading: "Реєстрація",
                text: "При першому запуску створіть обліковий запис. Введіть логін і пароль — пароль має містити щонайменше одну велику літеру (A–Z), одну малу (a–z) та 8+ символів.",
            },
            {
                heading: "Вхід",
                text: "Якщо вже зареєстровані — натисніть «Вже є акаунт? Увійти», введіть логін і пароль та натисніть «Увійти».",
            },
        ],
    },
    {
        id: "search",
        icon: <Search size={20} />,
        color: "#0ea5e9",
        bg: "#e0f2fe",
        title: "Пошук книгарень",
        subtitle: "Фільтри та результати",
        images: ["search1", "search2"],
        content: [
            {
                heading: "Пошук за назвою та адресою",
                text: "Введіть повну або часткову назву книгарні (напр. «Yakaboo») або вулицю (напр. «Хрещатик»). Поля можна використовувати одночасно.",
            },
            {
                heading: "Фільтр за часом роботи",
                text: "Оберіть день тижня (Пн–Нд) і вкажіть бажаний часовий проміжок. Щоб скинути — натисніть × поруч із полями часу.",
            },
            {
                heading: "Фільтр за відділами",
                text: "Позначте потрібні відділи: Бізнес, Дитяча література, Іноземні мови, Поезія, Художня література тощо.",
            },
            {
                heading: "Лише улюблені",
                text: "Встановіть позначку «Лише улюблені», щоб бачити тільки ті книгарні, які ви позначили серцем.",
            },
        ],
    },
    {
        id: "bookstore",
        icon: <MapPin size={20} />,
        color: "#10b981",
        bg: "#d1fae5",
        title: "Картка книгарні",
        subtitle: "Деталі, карта, відгуки",
        images: ["details1", "details2", "details3", "details4"],
        content: [
            {
                heading: "Інформація",
                text: "Натисніть на книгарню у списку, щоб побачити адресу, години роботи, координати та доступні відділи.",
            },
            {
                heading: "Улюблені",
                text: "Натисніть кнопку ♡ «До улюблених» на сторінці книгарні, щоб зберегти її у свій список.",
            },
            {
                heading: "Карта та маршрут",
                text: "Прокрутіть сторінку донизу — там є інтерактивна карта. Натисніть «Побудувати маршрут», щоб прокласти шлях від вашого місцезнаходження.",
            },
            {
                heading: "Коментарі",
                text: "Читайте відгуки інших користувачів або залишайте власні. Введіть текст і натисніть «Надіслати коментар».",
            },
        ],
    },
    {
        id: "rating",
        icon: <Star size={20} />,
        color: "#f59e0b",
        bg: "#fef3c7",
        title: "Рейтинг та оцінки",
        subtitle: "Як оцінити книгарню",
        images: ["rating"],
        content: [
            {
                heading: "Загальний рейтинг",
                text: "На сторінці кожної книгарні відображається середній рейтинг (1–5 зірок) та кількість оцінок від усіх користувачів.",
            },
            {
                heading: "Ваша оцінка",
                text: "Натисніть на потрібну зірку у рядку «Ваша оцінка», щоб поставити або змінити власну оцінку.",
            },
        ],
    },
    {
        id: "charts",
        icon: <BarChart2 size={20} />,
        color: "#8b5cf6",
        bg: "#ede9fe",
        title: "Діаграми",
        subtitle: "Статистика книгарень",
        images: ["charts1", "charts2", "charts3"],
        content: [
            {
                heading: "Як відкрити",
                text: "На головному екрані або на сторінці результатів пошуку натисніть кнопку «Діаграми».",
            },
            {
                heading: "Найближчі книгарні",
                text: "Стовпчикова діаграма із книгарнями, відсортованими за відстанню від вас. Потребує дозволу на геолокацію.",
            },
            {
                heading: "Найвищий рейтинг",
                text: "Стовпчикова діаграма із книгарнями, відсортованими за середнім рейтингом у порядку спадання.",
            },
        ],
    },
    {
        id: "ai",
        icon: <Bot size={20} />,
        color: "#ec4899",
        bg: "#fce7f3",
        title: "AI-асистент",
        subtitle: "Розумний підбір на базі Gemini",
        images: ["ai1", "ai2"],
        content: [
            {
                heading: "Як запустити",
                text: "Натисніть кнопку «AI» у правому верхньому куті панелі пошуку.",
            },
            {
                heading: "Як користуватися",
                text: "Асистент запитає, які жанри вас цікавлять і в який час плануєте завітати. Відповідайте у текстовому полі внизу. Потім оберіть сортування — за відстанню або за рейтингом.",
            },
            {
                heading: "Приклад",
                text: "«Цікавлять книги пригодницького жанру. Час — п'ятниця, 16:00»",
            },
        ],
    },
];

const faqs = [
    {
        q: "Не можу зареєструватися — помилка",
        a: "Переконайтесь, що пароль містить велику літеру (A–Z), малу (a–z) і має не менше 8 символів. Також перевірте, чи такий логін не зайнятий.",
    },
    {
        q: "Список книгарень порожній",
        a: "Спробуйте скинути фільтри: натисніть × поруч із фільтром часу та зніміть усі чекбокси відділів. Потім натисніть «Оновити» у шапці.",
    },
    {
        q: "Маршрут не будується",
        a: "Для побудови маршруту потрібна геолокація. Перевірте, чи вона увімкнена на пристрої і чи надано дозвіл застосунку.",
    },
];

const eulaContent = [
    {
        title: "1. Визначення",
        points: [
            "«Застосунок» — мобільний програмний продукт «Книгарні Києва» для платформ Android та iOS.",
            "«Розробник» — фізична або юридична особа, що є власником та розповсюджувачем Застосунку.",
            "«Користувач» — будь-яка фізична особа, яка встановила або використовує Застосунок.",
            "«Контент» — будь-яка інформація, дані, текст, зображення, відгуки, оцінки та інші матеріали."
        ]
    },
    {
        title: "2. Надання ліцензії",
        text: "Розробник надає Користувачу обмежену, невиключну, непередавану, відкличну ліцензію на встановлення та використання Застосунку виключно для особистих некомерційних цілей на пристроях, що належать або контролюються Користувачем."
    },
    {
        title: "3. Обмеження використання",
        points: [
            "Копіювати, модифікувати, розповсюджувати, продавати або передавати ліцензію на Застосунок третім особам;",
            "Декомпілювати, здійснювати зворотну розробку або дизасемблювати Застосунок;",
            "Використовувати Застосунок для будь-яких незаконних цілей або порушення прав третіх осіб;",
            "Публікувати неправдиві, образливі або незаконні відгуки та коментарі;",
            "Використовувати автоматизовані засоби (боти, скрипти) для взаємодії з Застосунком."
        ]
    },
    {
        title: "4. Облікові записи користувачів",
        points: [
            "Надавати достовірну інформацію під час реєстрації;",
            "Зберігати конфіденційність облікових даних (логін та пароль);",
            "Нести відповідальність за всі дії, що здійснюються під його обліковим записом."
        ]
    },
    {
        title: "5. Контент користувача",
        text: "Публікуючи відгуки, Користувач надає Розробнику безоплатне право на відображення такого контенту в межах Застосунку. Розробник залишає за собою право видаляти будь-який контент."
    },
    {
        title: "6. Інтелектуальна власність",
        text: "Застосунок та всі його складові (дизайн, код, логотипи) є власністю Розробника та захищені законодавством України."
    },
    {
        title: "7. Послуги третіх сторін",
        points: [
            "Google Maps / OpenStreetMap — для відображення карт;",
            "Google Gemini AI — для роботи AI-асистента;",
            "Firebase / хмарні сервіси — для зберігання даних."
        ]
    },
    {
        title: "9. Відмова від гарантій",
        text: "Застосунок надається «як є». Розробник не гарантує безперебійної роботи або точності даних про години роботи книгарень."
    }
];

const privacyContent = {
    ua: [
        {
            title: "1. Яку інформацію ми збираємо",
            points: [
                "Ім'я користувача (логін) — при реєстрації облікового запису.",
                "Пароль — зберігається у зашифрованому вигляді (хеш).",
                "Відгуки та коментарі — текст, що ви публікуєте в Застосунку.",
                "Оцінки книгарень.",
                "Дані про перегляди (статистика) та технічна інформація пристрою.",
                "Геолокація (тільки за згодою) для маршрутів."
            ]
        },
        {
            title: "2. Як ми використовуємо дані",
            text: "Дані використовуються для ідентифікації користувача, відображення контенту, аналізу використання, забезпечення безпеки та технічної підтримки."
        },
        {
            title: "3. Передача даних третім особам",
            text: "Ми не продаємо дані. Передача можлива лише постачальникам хмарних послуг, сервісу Gemini AI (лише текст запиту) та правоохоронним органам за законом."
        },
        {
            title: "4. Права користувача",
            points: [
                "Доступ до своїх даних та їх виправлення.",
                "Видалення облікового запису та даних.",
                "Відкликання згоди на обробку.",
                "Подання скарги до органів захисту даних."
            ]
        },
        {
            title: "5. Безпека та зберігання",
            text: "Ми використовуємо хешування паролів та HTTPS. Дані зберігаються протягом дії акаунта і видаляються протягом 30 днів після його закриття."
        }
    ],
    en: [
        {
            title: "1. Information We Collect",
            points: [
                "Username (login) — upon account registration.",
                "Password — stored in encrypted form (hash).",
                "Reviews and comments — text you post in the Application.",
                "Bookstore ratings.",
                "Usage statistics and device technical information.",
                "Location data (only with consent) for routing."
            ]
        },
        {
            title: "2. How We Use Data",
            text: "Data is used for user identification, content display, usage analysis, security, and technical support."
        },
        {
            title: "3. Data Sharing",
            text: "We do not sell data. Sharing is limited to cloud providers, Gemini AI (query text only), and law enforcement as required by law."
        },
        {
            title: "4. Your Rights",
            points: [
                "Access and correction of personal data.",
                "Deletion of account and associated data.",
                "Withdrawal of consent.",
                "Lodging complaints with data authorities."
            ]
        },
        {
            title: "5. Security & Retention",
            text: "We use password hashing and HTTPS. Data is stored for the duration of the account and deleted within 30 days after account closure."
        }
    ]
};

const termsContent = {
    ua: [
        {
            title: "1. Опис послуг",
            text: "«Книгарні Києва» — каталог книгарень з функціями пошуку, фільтрації, маршрутів, AI-підбору та статистики."
        },
        {
            title: "2. Реєстрація та акаунт",
            points: [
                "Один користувач — один безкоштовний акаунт.",
                "Ви відповідальні за конфіденційність пароля.",
                "Адміністрація може блокувати акаунт за порушення правил."
            ]
        },
        {
            title: "3. Правила поведінки",
            text: "Заборонено публікувати образливий контент, неправдиву інформацію, спам або матеріали, що порушують закони України."
        },
        {
            title: "4. Точність інформації",
            text: "Дані про години роботи та адреси можуть змінюватися. Ми не несемо відповідальності за неточності."
        },
        {
            title: "5. Зміни до Умов",
            text: "Ми залишаємо за собою право оновлювати ці Умови. Продовження використання застосунку означає згоду з ними."
        }
    ],
    en: [
        {
            title: "1. Description of Services",
            text: "Kyiv Bookstores is a catalog providing search, filters, routes, AI assistance, and statistics."
        },
        {
            title: "2. Registration and Account",
            points: [
                "One user — one free account.",
                "You are responsible for your password confidentiality.",
                "Accounts may be blocked for rule violations."
            ]
        },
        {
            title: "3. Conduct Rules",
            text: "It is forbidden to post offensive content, false information, spam, or materials violating Ukrainian law."
        },
        {
            title: "4. Accuracy of Information",
            text: "Hours and addresses may change. We are not responsible for inaccuracies provided in the app."
        },
        {
            title: "5. Changes to Terms",
            text: "We reserve the right to modify these Terms. Continued usage implies acceptance of the new version."
        }
    ]
};

// ─── SUB-PAGES ────────────────────────────────────────────────────────────────

function TermsPage({ onBack }) {
    const [lang, setLang] = useState('ua');
    const content = termsContent[lang];

    return (
        <div className="min-h-screen bg-white pb-10">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <p className="font-bold text-gray-900">{lang === 'ua' ? 'Умови надання послуг' : 'Terms of Service'}</p>
                </div>
                <button
                    onClick={() => setLang(lang === 'ua' ? 'en' : 'ua')}
                    className="text-xs font-bold bg-blue-50 px-3 py-1.5 rounded-lg text-blue-600"
                >
                    {lang === 'ua' ? 'EN' : 'UA'}
                </button>
            </div>
            <div className="p-5 text-sm text-gray-700 leading-relaxed">
                <div className="mb-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-1 text-blue-900 font-bold">
                        <FileText size={16} />
                        <span>{lang === 'ua' ? 'Правила використання' : 'Usage Rules'}</span>
                    </div>
                    <p className="text-[11px] text-blue-700 opacity-80 tracking-widest uppercase">
                        {lang === 'ua' ? 'Чинні з 1 травня 2025' : 'Effective May 1, 2025'}
                    </p>
                </div>

                {content.map((section, idx) => (
                    <div key={idx} className="mb-6">
                        <h3 className="font-bold text-gray-900 mb-2">{section.title}</h3>
                        {section.text && <p className="mb-2">{section.text}</p>}
                        {section.points && (
                            <ul className="list-disc pl-5 space-y-1">
                                {section.points.map((p, i) => <li key={i}>{p}</li>)}
                            </ul>
                        )}
                    </div>
                ))}

                <div className="mt-10 pt-6 border-t border-gray-100">
                    <p className="font-bold">{lang === 'ua' ? 'Підтримка:' : 'Support:'}</p>
                    <p className="text-blue-600">support@kyiv-bookstores-app.com</p>
                </div>
            </div>
        </div>
    );
}

function PrivacyPage({ onBack }) {
    const [lang, setLang] = useState('ua');
    const content = privacyContent[lang];

    return (
        <div className="min-h-screen bg-white pb-10">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <p className="font-bold text-gray-900">{lang === 'ua' ? 'Політика конфіденційності' : 'Privacy Policy'}</p>
                </div>
                <button
                    onClick={() => setLang(lang === 'ua' ? 'en' : 'ua')}
                    className="text-xs font-bold bg-gray-100 px-3 py-1.5 rounded-lg text-gray-600 uppercase tracking-wider"
                >
                    {lang === 'ua' ? 'EN' : 'UA'}
                </button>
            </div>
            <div className="p-5 text-sm text-gray-700 leading-relaxed">
                <div className="mb-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <div className="flex items-center gap-2 mb-1 text-indigo-900 font-bold">
                        <Lock size={16} />
                        <span>{lang === 'ua' ? 'Захист ваших даних' : 'User Data Protection'}</span>
                    </div>
                    <p className="text-[11px] text-indigo-700 opacity-80 uppercase tracking-widest">
                        {lang === 'ua' ? 'Дата набрання чинності: 1 травня 2025' : 'Effective date: May 1, 2025'}
                    </p>
                </div>

                {content.map((section, idx) => (
                    <div key={idx} className="mb-6">
                        <h3 className="font-bold text-gray-900 mb-2">{section.title}</h3>
                        {section.text && <p className="mb-2">{section.text}</p>}
                        {section.points && (
                            <ul className="list-disc pl-5 space-y-1">
                                {section.points.map((p, i) => <li key={i}>{p}</li>)}
                            </ul>
                        )}
                    </div>
                ))}

                <div className="mt-10 pt-6 border-t border-gray-100">
                    <p className="font-bold">{lang === 'ua' ? 'Контакти з питань приватності:' : 'Privacy inquiries:'}</p>
                    <p className="text-indigo-600">support@kyiv-bookstores-app.com</p>
                </div>
            </div>
        </div>
    );
}

function EULAPage({ onBack }) {
    return (
        <div className="min-h-screen bg-white pb-10">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
                <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <p className="font-bold text-gray-900">Ліцензійна угода (EULA)</p>
            </div>
            <div className="p-5 text-sm text-gray-700 leading-relaxed">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
                    <p className="font-semibold text-amber-900 mb-1">Будь ласка, уважно прочитайте цю Угоду!</p>
                    <p className="text-amber-800 text-xs">Встановлюючи або використовуючи Застосунок, ви погоджуєтесь з її умовами.</p>
                </div>

                {eulaContent.map((section, idx) => (
                    <div key={idx} className="mb-6">
                        <h3 className="font-bold text-gray-900 mb-2">{section.title}</h3>
                        {section.text && <p className="mb-2">{section.text}</p>}
                        {section.points && (
                            <ul className="list-disc pl-5 space-y-1">
                                {section.points.map((p, i) => <li key={i}>{p}</li>)}
                            </ul>
                        )}
                    </div>
                ))}

                <div className="mt-10 pt-6 border-t border-gray-100">
                    <p className="font-bold">Контактна інформація:</p>
                    <p className="text-indigo-600">support@kyiv-bookstores-app.com</p>
                </div>
            </div>
        </div>
    );
}

function SectionPage({ section, onBack }) {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* ШАПКА */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
                <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: section.bg, color: section.color }}>
                    {section.icon}
                </div>
                <div>
                    <p className="font-semibold text-gray-900 text-sm leading-tight">{section.title}</p>
                    <p className="text-xs text-gray-500">{section.subtitle}</p>
                </div>
            </div>

            {/* КОНТЕНТ (ТЕКСТ) */}
            <div className="px-4 pt-6 space-y-4">
                {section.content.map((item, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: section.color }}>
                                {i + 1}
                            </div>
                            <h3 className="font-semibold text-gray-800 text-sm">{item.heading}</h3>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed pl-7">{item.text}</p>
                    </div>
                ))}
            </div>

            {/* ГАЛЕРЕЯ СКРІНШОТІВ — без заголовка */}
            {section.images && section.images.length > 0 && (
                <div className="px-4 mt-8">
                    <div className={`grid gap-4 ${section.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {section.images.map((imgName, idx) => (
                            <div key={idx} className="bg-gray-200 rounded-2xl overflow-hidden shadow-sm border-2 border-white aspect-[9/16]">
                                <img
                                    src={`/images/${imgName}.jpg`}
                                    alt={`Step ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/400x700?text=Image+Not+Found'; }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function FAQPage({ onBack }) {
    const [open, setOpen] = useState(null);
    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
                <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600">
                    <HelpCircle size={20} />
                </div>
                <div>
                    <p className="font-semibold text-gray-900 text-sm">Часті питання</p>
                    <p className="text-xs text-gray-500">FAQ</p>
                </div>
            </div>
            <div className="px-4 pt-6 space-y-3">
                {faqs.map((faq, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <button className="w-full flex items-center justify-between p-4 text-left" onClick={() => setOpen(open === i ? null : i)}>
                            <span className="font-medium text-gray-800 text-sm pr-3">{faq.q}</span>
                            {open === i ? <ChevronUp size={18} className="text-indigo-500 flex-shrink-0" /> : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />}
                        </button>
                        {open === i && (
                            <div className="px-4 pb-4 text-gray-600 text-sm border-t border-gray-50 pt-3">
                                {faq.a}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── NAV TABS ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
    { id: "gallery", label: "Галерея" },
    { id: "video", label: "Відео-огляд" },
    { id: "instructions", label: "Інструкції" },
    { id: "support", label: "Підтримка та право" },
];

// ─── MAIN GUIDE PAGE ─────────────────────────────────────────────────────────

export default function GuidePage({ onBack }) {
    const [activePage, setActivePage] = useState(null);
    const [activeTab, setActiveTab] = useState("gallery");

    // Refs for each anchor section
    const sectionRefs = {
        gallery: useRef(null),
        video: useRef(null),
        instructions: useRef(null),
        support: useRef(null),
    };

    // Scroll to section on tab click
    const handleTabClick = (id) => {
        setActiveTab(id);
        sectionRefs[id]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    // Update active tab on scroll via IntersectionObserver
    useEffect(() => {
        const observers = [];
        Object.entries(sectionRefs).forEach(([id, ref]) => {
            if (!ref.current) return;
            const obs = new IntersectionObserver(
                ([entry]) => { if (entry.isIntersecting) setActiveTab(id); },
                { threshold: 0.35 }
            );
            obs.observe(ref.current);
            observers.push(obs);
        });
        return () => observers.forEach((o) => o.disconnect());
    }, [activePage]); // re-run only when returning to main page

    const activeSection = sections.find((s) => s.id === activePage);

    if (activePage === "faq") return <FAQPage onBack={() => setActivePage(null)} />;
    if (activePage === "eula") return <EULAPage onBack={() => setActivePage(null)} />;
    if (activePage === "privacy") return <PrivacyPage onBack={() => setActivePage(null)} />;
    if (activePage === "terms") return <TermsPage onBack={() => setActivePage(null)} />;
    if (activeSection) return <SectionPage section={activeSection} onBack={() => setActivePage(null)} />;

    return (
        <div className="min-h-screen bg-gray-50 pb-10">

            {/* ── TOP BAR ── */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
                {/* Title row */}
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">📚</span>
                        <span className="font-semibold text-gray-900 text-sm">Посібник користувача</span>
                    </div>
                    {onBack && (
                        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
                            <X size={18} className="text-gray-500" />
                        </button>
                    )}
                </div>

                {/* Navigation tabs */}
                <div
                    className="flex gap-1 overflow-x-auto px-3 pb-2"
                    style={{ scrollbarWidth: "none" }}
                >
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleTabClick(item.id)}
                            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeTab === item.id
                                    ? "bg-indigo-100 text-indigo-700"
                                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── HERO ── */}
            <div className="mx-4 mt-5 rounded-3xl bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 text-white shadow-lg overflow-hidden relative">
                <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
                <div className="absolute -bottom-8 -left-4 w-20 h-20 bg-white/10 rounded-full" />
                <div className="text-4xl mb-3">📚</div>
                <h1 className="text-2xl font-bold mb-1">Книгарні Києва</h1>
                <p className="text-indigo-100 text-sm leading-relaxed">
                    Застосунок для пошуку книгарень у місті Київ з інтерактивними картами та AI-підбором.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                    {["Пошук", "Карта", "Рейтинги", "AI"].map((tag) => (
                        <span key={tag} className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-medium">{tag}</span>
                    ))}
                </div>
            </div>

            {/* ── SECTION: GALLERY ── */}
            <div ref={sectionRefs.gallery} id="gallery">
                <h2 className="px-5 mt-6 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Галерея застосунку</h2>
                <div className="flex overflow-x-auto gap-4 px-4 pb-4 snap-x" style={{ scrollbarWidth: "none" }}>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex-shrink-0 w-48 aspect-[9/16] bg-gray-200 rounded-2xl shadow-sm snap-center border-2 border-white overflow-hidden">
                            <img
                                src={`/images/photo${i}.jpg`}
                                alt={`Screen ${i}`}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = "https://via.placeholder.com/400x700?text=Image+Missing"; }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* ── SECTION: VIDEO ── */}
            <div ref={sectionRefs.video} id="video">
                <div className="mx-4 mt-4 bg-white rounded-3xl p-5 shadow-sm border border-indigo-50">
                    <div className="flex items-center gap-2 mb-4">
                        <Play size={16} className="text-indigo-500" />
                        <h2 className="font-semibold text-gray-800 text-sm">Відео-огляд</h2>
                    </div>
                    <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-inner">
                        <video
                            controls
                            className="w-full h-full object-cover"
                            poster="/images/photo1.jpg"
                        >
                            <source src="/images/video.mp4" type="video/mp4" />
                            Ваш браузер не підтримує відео.
                        </video>
                    </div>
                </div>
            </div>

            {/* ── QUICK STATS ── */}
            <div className="mx-4 mt-6 grid grid-cols-3 gap-3">
                {[
                    { icon: <MapPin size={16} />, label: "100+", sub: "книгарень" },
                    { icon: <Heart size={16} />, label: "Улюблені", sub: "списки" },
                    { icon: <Bot size={16} />, label: "Gemini", sub: "AI-асистент" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-50">
                        <div className="text-indigo-500 flex justify-center mb-1">{stat.icon}</div>
                        <p className="text-xs font-bold text-gray-800">{stat.label}</p>
                        <p className="text-[10px] text-gray-400">{stat.sub}</p>
                    </div>
                ))}
            </div>

            {/* ── ПРО ЗАСТОСУНОК ── */}
            <div className="px-4 mt-8">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Про застосунок</h2>
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 p-4 border-b border-gray-50">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600 flex-shrink-0">
                            <Info size={20} />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 text-sm">Книгарні Києва</p>
                            <p className="text-xs text-gray-500">Інформація про застосунок</p>
                        </div>
                    </div>

                    {[
                        { label: "Версія", value: "1.0.2", badge: { text: "Актуальна", color: "bg-indigo-50 text-indigo-600" } },
                        { label: "Платформи", value: "Android · iOS" },
                        { label: "Місто", value: "Київ, Україна 🇺🇦" },
                        { label: "AI-модель", value: "Google Gemini", badge: { text: "Активна", color: "bg-green-50 text-green-600" } },
                        { label: "Підтримка", value: "support@kyiv-bookstores-app.com", valueColor: "text-indigo-500" },
                    ].map((row, i, arr) => (
                        <div key={i} className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? "border-b border-gray-50" : ""}`}>
                            <p className="text-xs text-gray-400">{row.label}</p>
                            <div className="flex items-center gap-2">
                                <p className={`text-xs font-semibold ${row.valueColor || "text-gray-800"}`}>{row.value}</p>
                                {row.badge && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${row.badge.color}`}>
                                        {row.badge.text}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── SECTION: INSTRUCTIONS ── */}
            <div ref={sectionRefs.instructions} id="instructions" className="px-4 mt-8">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Інструкції</h2>
                <div className="space-y-3">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActivePage(section.id)}
                            className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 text-left active:scale-95 transition-transform"
                        >
                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: section.bg, color: section.color }}>
                                {section.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 text-sm">{section.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{section.subtitle}</p>
                            </div>
                            <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
                        </button>
                    ))}
                </div>
            </div>

            {/* ── SECTION: SUPPORT & LEGAL ── */}
            <div ref={sectionRefs.support} id="support" className="px-4 mt-8 space-y-3">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Підтримка та право</h2>

                {/* FAQ */}
                <button onClick={() => setActivePage("faq")} className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 text-left active:scale-95 transition-transform">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-amber-50 text-amber-500"><HelpCircle size={20} /></div>
                    <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">Часті питання</p>
                        <p className="text-xs text-gray-500">Допомога з функціями</p>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
                </button>

                {/* PRIVACY POLICY */}
                <button onClick={() => setActivePage("privacy")} className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 text-left active:scale-95 transition-transform">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600"><Lock size={20} /></div>
                    <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">Політика конфіденційності</p>
                        <p className="text-xs text-gray-500">Privacy Policy</p>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
                </button>

                {/* TERMS OF SERVICE */}
                <button onClick={() => setActivePage("terms")} className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 text-left active:scale-95 transition-transform">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600"><FileText size={20} /></div>
                    <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">Умови надання послуг</p>
                        <p className="text-xs text-gray-500">Terms of Service</p>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
                </button>

                {/* EULA */}
                <button onClick={() => setActivePage("eula")} className="w-full bg-indigo-50/30 border border-indigo-100 rounded-2xl p-4 shadow-sm flex items-center gap-4 text-left group active:scale-95 transition-transform">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-white text-indigo-600 shadow-sm"><ShieldCheck size={20} /></div>
                    <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm group-hover:text-indigo-700 transition-colors">Ліцензійна угода (EULA)</p>
                        <p className="text-xs text-gray-500">Умови використання застосунку</p>
                    </div>
                    <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
                </button>
            </div>

            {/* ── FOOTER ── */}
            <p className="text-center text-[10px] text-gray-400 mt-12 px-4 uppercase tracking-[2px]">
                Книгарні Києва · v.1.0.2 · 2026
            </p>
        </div>
    );
}