import { Index } from 'flexsearch';
import { transliterate } from './transliterate';

export function buildSearchIndex(bookstores) {
    const index = new Index({
        tokenize: 'forward',
        resolution: 9,
        cache: true,
    });

    bookstores.forEach(store => {
        const text = [
            store.name,
            transliterate(store.name),
            store.address,
            transliterate(store.address),
        ].filter(Boolean).join(' ');

        index.add(store.id, text);
    });

    return index;
}