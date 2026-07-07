# ML API Klasifikasi Produk PangkalMart

API ini menggunakan TF-IDF dan `DecisionTreeClassifier` untuk mengklasifikasikan produk ke kategori:

- makanan
- kerajinan
- pertanian
- perikanan

## Dataset aktif

Dataset project disimpan di:

```text
ml-api/data/dataset_produk_umkm.xlsx
```

Sheet utama harus bernama `Dataset_1000` dan memiliki kolom:

```text
nama_produk | deskripsi_produk | kategori
```

Sheet uji input bebas bernama `Uji_Input_Bebas` dan memiliki kolom:

```text
nama_produk | deskripsi_produk | kategori_seharusnya
```

## Mengganti dataset dan melatih ulang

1. Ganti file `ml-api/data/dataset_produk_umkm.xlsx` dengan dataset baru.
2. Pastikan nama sheet dan kolom tetap sesuai format di atas.
3. Jalankan evaluasi tanpa mengganti model aktif:

```powershell
.\ml-api\venv\Scripts\python.exe ml-api\train_model.py
```

4. Periksa hasil pada:

```text
ml-api/training_report.json
```

5. Aktifkan model hanya jika metriknya baik:

```powershell
.\ml-api\venv\Scripts\python.exe ml-api\train_model.py --activate
```

Script akan menolak aktivasi jika macro F1 holdout di bawah `0.90`. Batas tersebut dapat diubah dengan `--min-holdout-f1`.

Model lama otomatis disimpan di:

```text
ml-api/models/archive/
```

## Menjalankan API

Setelah model diganti, hentikan server API lama lalu jalankan kembali:

```powershell
cd ml-api
.\venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8002 --reload
```

Gunakan port yang sama dengan `ML_API_URL` pada `.env` Laravel. Endpoint yang tersedia:

- `GET /` untuk status API dan metadata model.
- `GET /model-info` untuk informasi dataset, parameter, dan metrik model aktif.
- `POST /predict` untuk prediksi kategori produk.

Contoh request:

```json
{
  "nama_produk": "Bakso Ikan",
  "deskripsi_produk": "Bakso ikan siap makan dan gurih"
}
```

## Hasil training dataset saat ini

- Jumlah data: 1.000
- Distribusi: 250 data per kategori
- Nama produk unik: 248
- Cross-validation macro F1: 98,84%
- Holdout accuracy: 99,00%
- Holdout macro F1: 98,98%
- Uji input bebas: 100% (11 dari 11 benar)

Evaluasi holdout memakai kelompok nama produk. Variasi dari nama produk yang sama tidak dibagi ke data train dan test, sehingga hasilnya lebih realistis daripada pembagian acak biasa.
