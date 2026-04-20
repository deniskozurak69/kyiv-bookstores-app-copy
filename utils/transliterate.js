const UA_TO_LAT = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd',
    'е': 'e', 'є': 'ye', 'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i',
    'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh',
    'щ': 'shch', 'ю': 'yu', 'я': 'ya', 'ь': '', 'ъ': '',
};

export function transliterate(str) {
    if (!str) return '';
    return str.toLowerCase().split('').map(ch => UA_TO_LAT[ch] ?? ch).join('');
}