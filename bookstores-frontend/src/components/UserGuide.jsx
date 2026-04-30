import { useState } from "react";
import {
    BookOpen, Search, MapPin, Star, MessageCircle, BarChart2,
    Bot, Moon, ChevronRight, ChevronDown, ChevronUp, X, ArrowLeft,
    Info, HelpCircle, UserCheck, Map, Heart, ShieldCheck, Play
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
            "Використовувати автоматизовані засоби (боти, скрипти) для взаємодії з Застоसंकом."
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

// ─── SUB-PAGES ────────────────────────────────────────────────────────────────

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
        <div className="min-h-screen bg-gray-50 pb-10">
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

// ─── MAIN GUIDE PAGE ─────────────────────────────────────────────────────────

export default function GuidePage({ onBack }) {
    const [activePage, setActivePage] = useState(null);

    const activeSection = sections.find((s) => s.id === activePage);

    if (activePage === "faq") return <FAQPage onBack={() => setActivePage(null)} />;
    if (activePage === "eula") return <EULAPage onBack={() => setActivePage(null)} />;
    if (activeSection) return <SectionPage section={activeSection} onBack={() => setActivePage(null)} />;

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* TOP BAR */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
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

            {/* HERO */}
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

            {/* ГАЛЕРЕЯ ФОТО (Пошук у public/images/) */}
            <div className="mt-6">
                <h2 className="px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Галерея застосунку</h2>
                <div className="flex overflow-x-auto gap-4 px-4 pb-4 snap-x no-scrollbar">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex-shrink-0 w-48 aspect-[9/16] bg-gray-200 rounded-2xl shadow-sm snap-center border-2 border-white overflow-hidden">
                            <img
                                src={`/images/photo${i}.jpg`}
                                alt={`Screen ${i}`}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/400x700?text=Image+Missing'; }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* ВІДЕО-ДЕМОНСТРАЦІЯ (Пошук у public/images/) */}
            <div className="mx-4 mt-4 bg-white rounded-3xl p-5 shadow-sm border border-indigo-50">
                <div className="flex items-center gap-2 mb-4">
                    <Play size={16} className="text-indigo-500" />
                    <h2 className="font-semibold text-gray-800 text-sm">Відео-огляд</h2>
                </div>
                <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center group">
                    <video
                        controls
                        className="w-full h-full object-cover"
                        poster="/images/photo1.jpg" // Використовує перше фото як заставку
                    >
                        <source src="/images/video.mp4" type="video/mp4" />
                        Ваш браузер не підтримує відео.
                    </video>
                </div>
            </div>

            {/* QUICK STATS */}
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

            {/* SECTIONS LIST */}
            <div className="px-4 mt-8">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Інструкції</h2>
                <div className="space-y-3">
                    {sections.map((section) => (
                        <button key={section.id} onClick={() => setActivePage(section.id)} className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 text-left active:scale-95 transition-transform">
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

            {/* SUPPORT & LEGAL */}
            <div className="px-4 mt-8 space-y-3">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Підтримка та право</h2>

                <button onClick={() => setActivePage("faq")} className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 text-left active:scale-95 transition-transform">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-amber-50 text-amber-500"><HelpCircle size={20} /></div>
                    <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">Часті питання</p>
                        <p className="text-xs text-gray-500">Допомога з функціями</p>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
                </button>

                <button onClick={() => setActivePage("eula")} className="w-full bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 shadow-sm flex items-center gap-4 text-left group active:scale-95 transition-transform">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-white text-indigo-600 shadow-sm"><ShieldCheck size={20} /></div>
                    <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm group-hover:text-indigo-700 transition-colors">Ліцензійна угода (EULA)</p>
                        <p className="text-xs text-gray-500">Умови використання застосунку</p>
                    </div>
                    <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
                </button>
            </div>

            {/* FOOTER */}
            <p className="text-center text-[10px] text-gray-400 mt-12 px-4 uppercase tracking-[2px]">
                Книгарні Києва · v.1.0.2 · 2026
            </p>
        </div>
    );
}