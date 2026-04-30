import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Star, Send, Loader2, Trash2, Eye, Heart } from 'lucide-react';
import { API_URL } from '../utils/api';
import StoreDetailMap from './StoreDetailMap';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { translations } from '../translations';

function formatHours(hoursStr) {
    if (!hoursStr) return '—';
    return hoursStr.split(';').map(s => s.trim()).filter(Boolean).join('\n');
}

export default function StoreDetail({ bookstores, currentUser, refreshFavorites }) {
    const { theme } = useContext(ThemeContext);
    const { language } = useContext(LanguageContext);
    const t = translations[language];

    // Хелпери для локалізованих полів
    const deptLabel = (dept) => t.departmentNames?.[dept] || dept;
    const storeName = (store) => language === 'en' && store.name_eng ? store.name_eng : store.name;
    const storeAddress = (store) => language === 'en' && store.address_eng ? store.address_eng : store.address;

    const { id } = useParams();
    const navigate = useNavigate();
    const { state } = useLocation();
    const isDark = theme === 'dark';

    const [ratingData, setRatingData] = useState({
        average: null, count: 0, ratings: [], comments: [], deletedComments: []
    });
    const [userRating, setUserRating] = useState(0);
    const [comment, setComment] = useState('');
    const [showDeleted, setShowDeleted] = useState(false);
    const [deletionReason, setDeletionReason] = useState('');
    const [deletingCommentId, setDeletingCommentId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentLoading, setCommentLoading] = useState(false);
    const [views, setViews] = useState(0);
    const [viewsLoading, setViewsLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);

    const store = bookstores.find(s => s.id === parseInt(id));

    const viewsLabel = (count) => {
        if (language === 'en') return `${count} ${count === 1 ? 'view' : 'views'}`;
        if (count === 1) return `${count} перегляд`;
        if (count < 5) return `${count} перегляди`;
        return `${count} переглядів`;
    };

    useEffect(() => {
        if (!store) return;
        const fetchData = async () => {
            try {
                if (currentUser?.userId) {
                    await fetch(`${API_URL}/bookstores/${id}/view`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: currentUser.userId })
                    });
                }
                const viewsRes = await fetch(`${API_URL}/bookstores/${id}/views`);
                const viewsData = await viewsRes.json();
                setViews(viewsData.views || 0);

                const res = await fetch(`${API_URL}/bookstores/${id}/ratings`);
                const data = await res.json();
                setRatingData(data);

                const existing = data.ratings.find(r => r.username === currentUser?.username);
                if (existing) setUserRating(existing.rating);

                if (currentUser?.userId) {
                    const favRes = await fetch(`${API_URL}/bookstores/${id}/favorite?userId=${currentUser.userId}`);
                    const favData = await favRes.json();
                    setIsFavorite(favData.isFavorite || false);
                }
            } catch (err) {
                console.error('Помилка завантаження даних:', err);
            } finally {
                setLoading(false);
                setViewsLoading(false);
            }
        };
        fetchData();

        const checkFavorite = async () => {
            if (!currentUser?.userId || !store) return;
            try {
                const res = await fetch(`${API_URL}/bookstores/${id}/favorite?userId=${currentUser.userId}`);
                const data = await res.json();
                setIsFavorite(data.isFavorite || false);
            } catch (err) {
                console.error('Помилка перевірки улюбленого:', err);
            }
        };
        checkFavorite();
    }, [id, store, currentUser]);

    const toggleFavorite = async () => {
        if (!currentUser?.userId) { alert(t.loginToFavorite); return; }
        try {
            const action = isFavorite ? 'remove' : 'add';
            const res = await fetch(`${API_URL}/bookstores/${id}/favorite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.userId, action })
            });
            if (res.ok) {
                const data = await res.json();
                setIsFavorite(data.isFavorite);
                if (refreshFavorites) refreshFavorites();
            } else {
                const err = await res.json();
                alert(err.error || t.favoriteError);
            }
        } catch (err) {
            alert(t.connectionError);
        }
    };

    const handleRate = async (rating) => {
        if (!currentUser) { alert(t.loginToRate); return; }
        try {
            await fetch(`${API_URL}/bookstores/${id}/rate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUser.username, rating })
            });
            const res = await fetch(`${API_URL}/bookstores/${id}/ratings`);
            const data = await res.json();
            setRatingData(data);
            setUserRating(rating);
        } catch { alert(t.rateError); }
    };

    const handleComment = async () => {
        if (!currentUser) { alert(t.loginToComment); return; }
        if (!comment.trim()) { alert(t.writeComment); return; }
        setCommentLoading(true);
        try {
            await fetch(`${API_URL}/bookstores/${id}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUser.username, comment })
            });
            setComment('');
            const res = await fetch(`${API_URL}/bookstores/${id}/ratings`);
            const data = await res.json();
            setRatingData(data);
        } catch { alert(t.commentError); }
        finally { setCommentLoading(false); }
    };

    const handleDeleteComment = async (commentId) => {
        if (!deletionReason.trim()) { alert(t.enterDeletionReason); return; }
        if (!currentUser?.isAdmin) { alert(t.adminOnly); return; }
        try {
            const res = await fetch(`${API_URL}/bookstores/${id}/comment/${commentId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUser.username, reason: deletionReason })
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || t.deleteCommentError);
            }
            setDeletionReason('');
            setDeletingCommentId(null);
            const resRefresh = await fetch(`${API_URL}/bookstores/${id}/ratings`);
            const data = await resRefresh.json();
            setRatingData(data);
        } catch (err) { alert(t.deleteCommentError + ': ' + err.message); }
    };

    if (!store) {
        return (
            <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-50'}`}>
                <div className={`text-center p-8 rounded-xl shadow-xl max-w-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                    <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                        {t.storeNotFound}
                    </h2>
                    <button onClick={() => navigate('/')}
                        className={`px-6 py-3 rounded-lg text-white transition-colors ${isDark ? 'bg-indigo-700 hover:bg-indigo-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                        {t.backToList}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen p-6 transition-colors duration-300 ${isDark ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-blue-50 to-indigo-50'}`}>
            <button onClick={() => navigate('/')}
                className={`mb-6 flex items-center gap-2 transition-colors ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'}`}>
                <ArrowLeft size={20} />
                {t.backToList}
            </button>

            <div className={`rounded-2xl shadow-xl p-6 max-w-5xl mx-auto transition-colors duration-300 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>

                {/* Заголовок + улюблене */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                    <h1 className={`text-2xl font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                        {storeName(store)}
                    </h1>
                    <button onClick={toggleFavorite}
                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm w-full sm:w-auto ${isFavorite
                                ? 'bg-pink-600 hover:bg-pink-700 text-white'
                                : isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                            }`}>
                        {isFavorite ? <Heart size={18} fill="white" /> : <Heart size={18} />}
                        {isFavorite ? t.inFavorites : t.addToFavorites}
                    </button>
                </div>

                {/* Перегляди */}
                <div className={`flex items-center gap-2 mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <Eye size={18} />
                    <span className="text-sm">
                        {viewsLoading ? t.loading : viewsLabel(views)}
                    </span>
                </div>

                {/* Рейтинг */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div>
                        <div className={`text-4xl font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                            {ratingData.average || '—'}
                        </div>
                        <div className="flex mt-1">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Star key={i} size={18} className={ratingData.average >= i ? 'text-yellow-400 fill-yellow-400' : isDark ? 'text-gray-600' : 'text-gray-300'} />
                            ))}
                        </div>
                        <div className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {ratingData.count} {t.ratingsCount}
                        </div>
                    </div>
                    {currentUser && (
                        <div>
                            <p className={`mb-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t.yourRating}:</p>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button key={star} onClick={() => handleRate(star)} className="focus:outline-none">
                                        <Star size={28} className={`transition ${userRating >= star ? 'text-yellow-400 fill-yellow-400' : isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Інформація */}
                <div className="grid md:grid-cols-2 gap-8 mb-10">
                    <div className="space-y-6">
                        <div className="flex items-start gap-3">
                            <MapPin size={24} className={`mt-1 shrink-0 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
                            <div>
                                <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t.address}</p>
                                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                    {storeAddress(store)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Clock size={24} className={`mt-1 shrink-0 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
                            <div>
                                <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t.hours}</p>
                                <p className={`whitespace-pre-line ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {formatHours(store.hours)}
                                </p>
                            </div>
                        </div>
                        {store.latitude && store.longitude && (
                            <div className="flex items-start gap-3">
                                <MapPin size={24} className={`mt-1 shrink-0 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
                                <div>
                                    <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t.coordinates}</p>
                                    <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                        {parseFloat(store.latitude).toFixed(6)}, {parseFloat(store.longitude).toFixed(6)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div>
                        <p className={`font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t.departments}</p>
                        <div className="flex flex-wrap gap-2">
                            {store.departments?.length > 0 ? (
                                store.departments.map(d => (
                                    <span key={d} className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                                        {deptLabel(d)}
                                    </span>
                                ))
                            ) : (
                                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t.noDepartmentsSpecified}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Карта */}
                <StoreDetailMap store={store} userPosition={state?.userPosition || null} />

                {/* Коментарі */}
                <div className="mt-12">
                    <h3 className={`text-2xl font-bold mb-6 ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                        {t.comments} ({ratingData.comments.length})
                    </h3>

                    {ratingData.comments.length === 0 ? (
                        <p className={`italic text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {t.noCommentsYet}
                        </p>
                    ) : (
                        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4">
                            {ratingData.comments.map((c, idx) => (
                                <div key={idx} className={`border-l-4 pl-5 py-4 rounded-r-lg relative transition-colors ${isDark ? 'border-indigo-600 bg-gray-700' : 'border-indigo-500 bg-gray-50'}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{c.username}</span>
                                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {new Date(c.created_at).toLocaleString(language === 'en' ? 'en-GB' : 'uk-UA', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <p className={`leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{c.comment}</p>
                                    {currentUser?.isAdmin && (
                                        <button onClick={() => setDeletingCommentId(c.id)}
                                            className={`absolute bottom-2 right-2 p-1.5 rounded-full transition ${isDark ? 'text-red-400 hover:bg-red-900/50' : 'text-red-500 hover:bg-red-100'}`}
                                            title={t.deleteComment}>
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Форма видалення */}
                    {deletingCommentId && currentUser?.isAdmin && (
                        <div className={`mt-8 p-6 rounded-xl border ${isDark ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'}`}>
                            <h4 className={`text-lg font-semibold mb-4 ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                                {t.deleteComment}
                            </h4>
                            <textarea value={deletionReason} onChange={e => setDeletionReason(e.target.value)}
                                placeholder={t.enterDeletionReason}
                                className={`w-full p-4 border rounded-lg focus:ring-2 focus:ring-red-500 min-h-[100px] resize-y ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-red-300 text-gray-800'}`}
                            />
                            <div className="flex flex-col sm:flex-row gap-3 mt-4">
                                <button
                                    onClick={() => handleDeleteComment(deletingCommentId)}
                                    disabled={!deletionReason.trim()}
                                    className={`flex-1 py-3.5 rounded-lg text-white font-medium transition-all ${deletionReason.trim()
                                            ? isDark ? 'bg-red-700 hover:bg-red-600' : 'bg-red-600 hover:bg-red-700'
                                            : 'bg-gray-400 cursor-not-allowed'
                                        }`}>
                                    {t.deleteComment}
                                </button>
                                <button
                                    onClick={() => { setDeletingCommentId(null); setDeletionReason(''); }}
                                    className={`flex-1 py-3.5 rounded-lg font-medium transition-all ${isDark
                                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                                            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                                        }`}>
                                    {t.cancel}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Видалені коментарі */}
                    {ratingData.deletedComments?.length > 0 && (
                        <button onClick={() => setShowDeleted(!showDeleted)}
                            className={`mt-8 px-8 py-3 rounded-lg transition ${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>
                            {showDeleted ? t.hideDeletedComments : t.showDeletedComments}
                        </button>
                    )}

                    {showDeleted && ratingData.deletedComments?.length > 0 && (
                        <div className="mt-10 space-y-6">
                            <h4 className={`text-lg font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t.deletedComments}
                            </h4>
                            {ratingData.deletedComments.map((c, idx) => (
                                <div key={idx} className={`border-l-4 pl-5 py-4 rounded-r-lg ${isDark ? 'border-red-600 bg-red-900/30' : 'border-red-500 bg-red-50'}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{c.username}</span>
                                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {new Date(c.created_at).toLocaleString(language === 'en' ? 'en-GB' : 'uk-UA', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <p className={`line-through ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{c.comment}</p>
                                    <p className={`mt-2 text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                                        {t.deletedOn} {new Date(c.deleted_at).toLocaleString(language === 'en' ? 'en-GB' : 'uk-UA', {
                                            day: '2-digit', month: 'long', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })} {t.byAdmin} <span className="font-medium">{c.deleted_by}</span>, {t.reason}: {c.deletion_reason}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Форма коментаря */}
                    {currentUser && (
                        <div className="mt-12">
                            <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                {t.leaveComment}
                            </h3>
                            <textarea value={comment} onChange={e => setComment(e.target.value)}
                                placeholder={t.commentPlaceholder}
                                className={`w-full p-4 border rounded-lg focus:ring-2 focus:ring-indigo-500 min-h-[140px] resize-y transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-700'}`}
                            />
                            <button onClick={handleComment}
                                disabled={!comment.trim() || commentLoading}
                                className={`mt-4 px-8 py-3 rounded-lg text-white font-medium transition flex items-center gap-2 ${comment.trim() && !commentLoading
                                        ? isDark ? 'bg-indigo-700 hover:bg-indigo-600' : 'bg-indigo-600 hover:bg-indigo-700'
                                        : 'bg-gray-400 cursor-not-allowed'
                                    }`}>
                                {commentLoading
                                    ? <><Loader2 size={20} className="animate-spin" />{t.sending}</>
                                    : <><Send size={20} />{t.sendComment}</>
                                }
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}