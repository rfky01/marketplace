from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pathlib import Path
from functools import lru_cache

import re
import joblib

from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory


# =========================================================
# Inisialisasi FastAPI
# =========================================================
app = FastAPI(
    title="API Klasifikasi Produk UMKM",
    description="API untuk klasifikasi kategori produk UMKM menggunakan TF-IDF dan Decision Tree",
    version="1.0"
)


# =========================================================
# Load file pipeline model
# =========================================================
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "pipeline_decision_tree_umkm.pkl"

if not MODEL_PATH.exists():
    raise FileNotFoundError(
        "File pipeline_decision_tree_umkm.pkl tidak ditemukan di folder ml-api"
    )

pipeline_model = joblib.load(MODEL_PATH)

model = pipeline_model["model"]
tfidf = pipeline_model["tfidf"]
kamus_normalisasi = pipeline_model.get("kamus_normalisasi", {})


# =========================================================
# Inisialisasi Sastrawi
# =========================================================
stemmer_factory = StemmerFactory()
stemmer = stemmer_factory.create_stemmer()

stopword_factory = StopWordRemoverFactory()
stopwords = set(stopword_factory.get_stop_words())


@lru_cache(maxsize=20000)
def stem_kata(kata: str) -> str:
    return stemmer.stem(kata)


def preprocessing_teks(teks: str) -> str:
    """
    Fungsi preprocessing teks produk.
    Tahapan:
    1. Cleaning
    2. Case folding
    3. Tokenizing
    4. Normalisasi kata tidak baku
    5. Stopword removal
    6. Stemming
    """

    # 1. Cleaning
    teks = re.sub(r"[^a-zA-Z\s]", " ", str(teks))

    # 2. Case folding
    teks = teks.lower()

    # 3. Tokenizing
    tokens = teks.split()

    # 4. Normalisasi kata tidak baku
    tokens = [kamus_normalisasi.get(kata, kata) for kata in tokens]

    # 5. Stopword removal
    tokens = [kata for kata in tokens if kata not in stopwords]

    # 6. Stemming
    tokens = [stem_kata(kata) for kata in tokens]

    return " ".join(tokens)


# =========================================================
# Format request dari Laravel
# =========================================================
class ProdukRequest(BaseModel):
    nama_produk: str
    deskripsi_produk: str


# =========================================================
# Endpoint utama untuk cek API
# =========================================================
@app.get("/")
def index():
    return {
        "status": "success",
        "message": "API Klasifikasi Produk UMKM aktif",
        "kategori": ["makanan", "kerajinan", "pertanian", "perikanan"]
    }


# =========================================================
# Endpoint prediksi kategori produk
# =========================================================
@app.post("/predict")
def predict_produk(data: ProdukRequest):
    try:
        nama_produk = data.nama_produk.strip()
        deskripsi_produk = data.deskripsi_produk.strip()

        if nama_produk == "" or deskripsi_produk == "":
            raise HTTPException(
                status_code=400,
                detail="nama_produk dan deskripsi_produk tidak boleh kosong"
            )

        # Format teks harus sama seperti saat training di Google Colab
        teks_produk = nama_produk + " " + nama_produk + " " + deskripsi_produk

        # Preprocessing
        teks_bersih = preprocessing_teks(teks_produk)

        # TF-IDF
        teks_tfidf = tfidf.transform([teks_bersih])

        # Prediksi kategori
        kategori_prediksi = model.predict(teks_tfidf)[0]

        # Probabilitas/skor kepercayaan
        probabilitas = model.predict_proba(teks_tfidf)[0]
        skor_kepercayaan = max(probabilitas) * 100

        detail_probabilitas = {}
        for kelas, nilai in zip(model.classes_, probabilitas):
            detail_probabilitas[kelas] = round(float(nilai * 100), 2)

        return {
            "status": "success",
            "nama_produk": nama_produk,
            "deskripsi_produk": deskripsi_produk,
            "teks_bersih": teks_bersih,
            "kategori": kategori_prediksi,
            "skor_kepercayaan": round(float(skor_kepercayaan), 2),
            "probabilitas": detail_probabilitas
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat prediksi: {str(e)}"
        )