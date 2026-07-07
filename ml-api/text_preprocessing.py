import re
from functools import lru_cache

from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory


stemmer = StemmerFactory().create_stemmer()
stopwords = set(StopWordRemoverFactory().get_stop_words())


@lru_cache(maxsize=50000)
def stem_kata(kata: str) -> str:
    return stemmer.stem(kata)


def preprocessing_teks(teks: str, kamus_normalisasi=None) -> str:
    kamus_normalisasi = kamus_normalisasi or {}
    teks = re.sub(r"[^a-zA-Z\s]", " ", str(teks)).lower()
    tokens = teks.split()
    tokens = [kamus_normalisasi.get(kata, kata) for kata in tokens]
    tokens = " ".join(tokens).split()
    tokens = [kata for kata in tokens if kata not in stopwords]
    tokens = [stem_kata(kata) for kata in tokens]
    return " ".join(kata for kata in tokens if kata)
