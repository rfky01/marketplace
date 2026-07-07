from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pathlib import Path

import joblib
import re

from text_preprocessing import preprocessing_teks as preprocess_text


# =========================================================
# Inisialisasi FastAPI
# =========================================================
app = FastAPI(
    title="API Klasifikasi Produk UMKM",
    description="API untuk klasifikasi kategori produk UMKM menggunakan TF-IDF dan Decision Tree",
    version="1.1"
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
model_metadata = pipeline_model.get("metadata", {})


def preprocessing_teks(teks: str) -> str:
    return preprocess_text(teks, kamus_normalisasi)


def normalisasi_ringan(teks: str) -> str:
    teks = re.sub(r"[^a-zA-Z\s]", " ", str(teks)).lower()
    tokens = teks.split()
    tokens = [kamus_normalisasi.get(kata, kata) for kata in tokens]
    return " ".join(tokens)


def aturan_kategori_otomatis(nama_produk: str, deskripsi_produk: str):
    teks = normalisasi_ringan(f"{nama_produk} {deskripsi_produk}")

    # PERIKANAN - dibuat lebih dulu agar "bibit ikan" tidak terbaca sebagai pertanian.
    kata_perikanan = [
        "bibit ikan", "benih ikan", "pakan ikan", "pelet ikan",
        "siap tebar", "ikan hidup", "kolam ikan", "budidaya ikan",
        "bibit lele", "bibit nila", "bibit gurame",
        "pakan lele", "pakan nila", "pakan gurame",
    ]

    if any(kata in teks for kata in kata_perikanan):
        return "perikanan"

    # PERTANIAN - bibit/benih/pupuk/hasil tani mentah.
    # Aturan ini sengaja diletakkan sebelum makanan agar kasus seperti
    # "bibit pisang goreng" tetap masuk pertanian, bukan makanan.
    kata_pertanian = [
        "bibit", "benih", "pupuk", "npk", "urea", "kompos",
        "pupuk kandang", "pupuk organik", "pupuk cair",
        "obat hama", "obat wereng", "wereng", "walang sangit",
        "pestisida", "insektisida", "fungisida", "herbisida",
        "racun rumput", "siap tanam", "ditanam", "tanam",
        "semai", "hasil panen", "hasil kebun", "panen",
        "petani", "mentah",
    ]

    if any(kata in teks for kata in kata_pertanian):
        return "pertanian"

    # MAKANAN - produk sudah dimasak / siap konsumsi.
    kata_makanan = [
        "tumis", "oseng", "goreng", "digoreng", "masak", "dimasak",
        "matang", "siap makan", "siap santap", "lauk",
        "sayur matang", "olahan", "cemilan", "camilan",
        "keripik", "kerupuk", "kue", "bolu", "sambal",
    ]

    if any(kata in teks for kata in kata_makanan):
        return "makanan"

    # KERAJINAN - produk buatan tangan.
    kata_kerajinan = [
        "anyaman", "rotan", "kerajinan", "buatan tangan",
        "handmade", "tikar", "bilik", "tas rotan",
        "keranjang", "hiasan", "souvenir", "suvenir",
    ]

    if any(kata in teks for kata in kata_kerajinan):
        return "kerajinan"

    return None


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
        "kategori": ["makanan", "kerajinan", "pertanian", "perikanan"],
        "model": model_metadata,
    }


@app.get("/model-info")
def model_info():
    return {
        "status": "success",
        "metadata": model_metadata,
        "classes": [str(kelas) for kelas in model.classes_],
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

        kategori_aturan = aturan_kategori_otomatis(nama_produk, deskripsi_produk)

        if kategori_aturan is not None:
            detail_probabilitas = {
                str(kelas): (100.0 if str(kelas) == kategori_aturan else 0.0)
                for kelas in model.classes_
            }

            return {
                "status": "success",
                "nama_produk": nama_produk,
                "deskripsi_produk": deskripsi_produk,
                "teks_bersih": teks_bersih,
                "kategori": kategori_aturan,
                "skor_kepercayaan": 100.0,
                "probabilitas": detail_probabilitas,
                "sumber_prediksi": "aturan_kategori_otomatis"
            }

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
            "probabilitas": detail_probabilitas,
            "sumber_prediksi": "decision_tree"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat prediksi: {str(e)}"
        )
