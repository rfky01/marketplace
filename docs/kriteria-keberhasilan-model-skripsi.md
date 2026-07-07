# Kriteria Keberhasilan Model Klasifikasi

## Penempatan dalam Skripsi

Bagian utama ditempatkan pada **BAB III Metodologi Penelitian**, setelah subbab **3.7.8 Evaluasi Model Klasifikasi** dan sebelum **3.8 Integrasi Sistem**, dengan nomor subbab:

### 3.7.9 Kriteria Keberhasilan Model Klasifikasi

Hasil aktual dan keputusan kelayakannya kemudian dituliskan kembali pada **BAB IV Hasil dan Pembahasan**, setelah penyajian Confusion Matrix serta nilai accuracy, precision, recall, dan F1-score.

## Naskah BAB III Siap Tempel

### 3.7.9 Kriteria Keberhasilan Model Klasifikasi

Kriteria keberhasilan model klasifikasi ditetapkan sebelum proses pengujian dilakukan agar penilaian performa model dapat dilakukan secara objektif. Dalam penelitian ini, model Decision Tree digunakan untuk mengklasifikasikan produk ke dalam empat kategori, yaitu makanan, kerajinan, pertanian, dan perikanan. Penilaian model dilakukan menggunakan nilai accuracy, macro precision, macro recall, macro F1-score, serta recall pada setiap kategori.

Accuracy digunakan untuk mengetahui persentase seluruh data testing yang berhasil diklasifikasikan dengan benar. Pada klasifikasi multikelas, accuracy dihitung menggunakan rumus berikut:

```text
Accuracy = (Jumlah prediksi benar / Jumlah seluruh data testing) × 100%
```

Nilai precision, recall, dan F1-score dihitung pada setiap kategori menggunakan pendekatan one-versus-all. Selanjutnya, nilai rata-rata antarkategori dihitung menggunakan macro average agar setiap kategori memperoleh bobot penilaian yang sama.

Model klasifikasi dalam penelitian ini dinyatakan memenuhi kriteria keberhasilan apabila memenuhi ketentuan berikut:

1. Nilai accuracy pada data testing sekurang-kurangnya 80%.
2. Nilai macro F1-score sekurang-kurangnya 80%.
3. Nilai recall pada masing-masing kategori sekurang-kurangnya 70%.
4. Selisih accuracy antara data training dan data testing tidak lebih dari 10 poin persentase sebagai indikator awal bahwa model tidak mengalami overfitting yang berlebihan.

Nilai accuracy dan macro F1-score sebesar 80% digunakan sebagai batas operasional keberhasilan dalam penelitian ini. Batas recall sebesar 70% pada setiap kategori digunakan untuk memastikan bahwa model tidak hanya memperoleh nilai keseluruhan yang baik, tetapi juga tetap mampu mengenali seluruh kategori produk. Sementara itu, perbandingan performa data training dan data testing digunakan untuk melihat kemampuan generalisasi model terhadap data yang belum pernah digunakan pada proses pelatihan.

Apabila seluruh kriteria tersebut terpenuhi, model dinyatakan layak untuk diintegrasikan ke dalam sistem marketplace PangkalMart. Apabila salah satu kriteria utama belum terpenuhi, model dinyatakan memerlukan perbaikan melalui penambahan atau penyeimbangan dataset, perbaikan tahap preprocessing, serta penyesuaian parameter algoritma Decision Tree sebelum digunakan pada sistem.

Tabel berikut digunakan sebagai rencana penilaian keberhasilan model.

| No. | Indikator | Batas Minimal | Keterangan |
|---:|---|---:|---|
| 1 | Accuracy data testing | 80% | Mengukur ketepatan prediksi model secara keseluruhan |
| 2 | Macro F1-score | 80% | Mengukur keseimbangan precision dan recall seluruh kategori |
| 3 | Recall setiap kategori | 70% | Memastikan setiap kategori tetap dapat dikenali oleh model |
| 4 | Selisih accuracy training dan testing | Maksimal 10 poin persentase | Indikator awal untuk mendeteksi overfitting |

## Template Naskah BAB IV

### Evaluasi Kelayakan Model Klasifikasi

Berdasarkan pengujian terhadap **[jumlah data testing]** data testing, model Decision Tree memperoleh accuracy sebesar **[nilai accuracy]%**, macro precision sebesar **[nilai macro precision]%**, macro recall sebesar **[nilai macro recall]%**, dan macro F1-score sebesar **[nilai macro F1-score]%**. Nilai recall pada kategori makanan sebesar **[nilai]%**, kerajinan sebesar **[nilai]%**, pertanian sebesar **[nilai]%**, dan perikanan sebesar **[nilai]%**.

Accuracy pada data training diperoleh sebesar **[nilai training]%**, sedangkan accuracy pada data testing sebesar **[nilai testing]%**, sehingga terdapat selisih sebesar **[selisih]** poin persentase. Hasil tersebut kemudian dibandingkan dengan kriteria keberhasilan model yang telah ditetapkan pada BAB III.

| Indikator | Hasil Pengujian | Batas Minimal | Status |
|---|---:|---:|---|
| Accuracy data testing | [hasil]% | 80% | [Memenuhi/Tidak memenuhi] |
| Macro F1-score | [hasil]% | 80% | [Memenuhi/Tidak memenuhi] |
| Recall kategori makanan | [hasil]% | 70% | [Memenuhi/Tidak memenuhi] |
| Recall kategori kerajinan | [hasil]% | 70% | [Memenuhi/Tidak memenuhi] |
| Recall kategori pertanian | [hasil]% | 70% | [Memenuhi/Tidak memenuhi] |
| Recall kategori perikanan | [hasil]% | 70% | [Memenuhi/Tidak memenuhi] |
| Selisih accuracy training dan testing | [hasil] poin | Maksimal 10 poin | [Memenuhi/Tidak memenuhi] |

Berdasarkan perbandingan tersebut, model klasifikasi **[telah/belum]** memenuhi kriteria keberhasilan karena **[jelaskan indikator yang memenuhi atau belum memenuhi]**. Dengan demikian, model **[layak diintegrasikan ke dalam PangkalMart/perlu diperbaiki dan diuji kembali sebelum digunakan]**.

## Template Kesimpulan BAB V

Model Decision Tree yang dikombinasikan dengan pembobotan TF-IDF memperoleh accuracy sebesar **[nilai]%** dan macro F1-score sebesar **[nilai]%** pada data testing. Berdasarkan batas keberhasilan yang telah ditetapkan, yaitu accuracy dan macro F1-score sekurang-kurangnya 80% serta recall setiap kategori sekurang-kurangnya 70%, model dinyatakan **[memenuhi/belum memenuhi]** kriteria untuk digunakan dalam klasifikasi kategori produk pada marketplace PangkalMart.

## Catatan Penggunaan

- Angka di dalam tanda **[ ]** harus diganti menggunakan hasil pengujian nyata.
- Nilai contoh 80% pada BAB III lama tidak boleh ditulis sebagai hasil penelitian sebelum pengujian dilakukan.
- Gunakan pembagian data training dan testing yang sama seperti pada saat model dilatih serta catat `random_state` agar hasil dapat direproduksi.
- Tampilkan Confusion Matrix dan classification report sebagai bukti perhitungan pada BAB IV atau lampiran.
