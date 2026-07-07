/**
 * Google Apps Script untuk membuat Google Form UAT PangkalMart
 * menggunakan skala Likert 1-5 sesuai metodologi skripsi.
 *
 * Cara pakai:
 * 1. Buka https://script.google.com/
 * 2. Buat project baru.
 * 3. Tempel seluruh isi file ini ke editor Apps Script.
 * 4. Klik Run pada fungsi createPangkalMartUatForm.
 * 5. Izinkan akses Google Form.
 * 6. Link edit dan link responden akan muncul di log.
 */
function createPangkalMartUatForm() {
  const form = FormApp.create('UAT Sistem Marketplace UMKM Desa PangkalMart');

  form.setDescription(
    'Form User Acceptance Test (UAT) ini digunakan untuk mengukur tingkat penerimaan dan kenyamanan pengguna ' +
    'terhadap fitur utama marketplace UMKM Desa PangkalMart, klasifikasi kategori produk otomatis menggunakan ' +
    'TF-IDF dan Decision Tree, serta notifikasi transaksi melalui WhatsApp Gateway.\n\n' +
    'Berikan penilaian berdasarkan pengalaman setelah mencoba langsung alur utama sistem sebagai pembeli dan penjual.\n\n' +
    'Skala penilaian:\n' +
    '1 = Sangat Tidak Setuju\n' +
    '2 = Tidak Setuju\n' +
    '3 = Cukup/Netral\n' +
    '4 = Setuju\n' +
    '5 = Sangat Setuju'
  );

  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setAcceptingResponses(true);
  form.setProgressBar(true);
  form.setShuffleQuestions(false);
  form.setConfirmationMessage(
    'Terima kasih. Penilaian UAT PangkalMart Anda telah tersimpan.'
  );

  addIdentitySection(form);

  addLikertSection(form, 'A. Kemudahan Penggunaan dan Tampilan', [
    'Saya dapat memahami cara melakukan registrasi dan login pada PangkalMart.',
    'Saya dapat memahami menu dan navigasi pada PangkalMart dengan mudah.',
    'Teks, tombol, dan informasi yang ditampilkan mudah dipahami.',
    'Tampilan PangkalMart nyaman digunakan pada perangkat yang saya gunakan.'
  ]);

  addLikertSection(form, 'B. Fitur Utama Marketplace', [
    'Saya dapat mencari, melihat daftar, dan memahami detail produk dengan mudah.',
    'Proses membuka toko dan mengunggah produk mudah dipahami serta dilakukan.',
    'Proses menambahkan produk ke keranjang dan melakukan checkout mudah dilakukan.',
    'Informasi status pesanan mudah ditemukan dan dipahami oleh pembeli maupun penjual.'
  ]);

  addLikertSection(form, 'C. Klasifikasi Kategori Produk Otomatis', [
    'Sistem dapat menentukan kategori produk secara otomatis tanpa saya memilih kategori secara manual.',
    'Kategori otomatis yang dihasilkan sesuai dengan nama dan deskripsi produk yang dimasukkan.',
    'Klasifikasi kategori otomatis membantu mengurangi kesalahan dalam menentukan kategori produk.'
  ]);

  addLikertSection(form, 'D. Notifikasi WhatsApp Gateway', [
    'Notifikasi WhatsApp diterima ketika terjadi perubahan status pesanan yang diuji.',
    'Isi notifikasi WhatsApp mengenai status pesanan jelas dan mudah dipahami.',
    'Notifikasi WhatsApp membantu saya mengetahui perubahan status pesanan dengan lebih cepat.'
  ]);

  addLikertSection(form, 'E. Penerimaan Sistem Secara Keseluruhan', [
    'PangkalMart memberikan respons dalam waktu yang dapat diterima saat digunakan.',
    'Fitur utama PangkalMart sesuai dengan kebutuhan pemasaran dan transaksi UMKM desa.',
    'PangkalMart membantu pengelolaan dan pemasaran produk UMKM menjadi lebih terstruktur.',
    'Secara keseluruhan, saya menerima dan bersedia menggunakan PangkalMart.'
  ]);

  form.addPageBreakItem()
    .setTitle('F. Saran dan Kesimpulan')
    .setHelpText('Berikan masukan berdasarkan pengalaman Anda selama mencoba PangkalMart.');

  form.addParagraphTextItem()
    .setTitle('Tuliskan kendala yang Anda alami saat menggunakan PangkalMart.')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Tuliskan saran perbaikan untuk PangkalMart.')
    .setRequired(false);

  Logger.log('Link edit Google Form: ' + form.getEditUrl());
  Logger.log('Link responden Google Form: ' + form.getPublishedUrl());
  Logger.log('Jumlah pernyataan Likert: 18');

  return {
    editUrl: form.getEditUrl(),
    responseUrl: form.getPublishedUrl(),
    likertQuestionCount: 18
  };
}

function addIdentitySection(form) {
  form.addSectionHeaderItem()
    .setTitle('Identitas Responden')
    .setHelpText('Data ini digunakan untuk mendeskripsikan responden UAT.');

  form.addTextItem()
    .setTitle('Nama Responden')
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Peran responden')
    .setChoiceValues([
      'Pelaku UMKM/Penjual',
      'Masyarakat/Pembeli',
      'Perangkat Desa',
      'Dosen/Penguji',
      'Lainnya'
    ])
    .setRequired(true);

  form.addTextItem()
    .setTitle('Perangkat yang digunakan')
    .setHelpText('Contoh: Android, iPhone, laptop Windows, atau MacBook.')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Browser yang digunakan')
    .setHelpText('Contoh: Chrome, Edge, Safari, atau Brave.')
    .setRequired(true);

  form.addDateItem()
    .setTitle('Tanggal Pengujian')
    .setRequired(true);
}

function addLikertSection(form, sectionTitle, statements) {
  form.addPageBreakItem()
    .setTitle(sectionTitle)
    .setHelpText(
      'Nilai setiap pernyataan dengan skala 1-5: ' +
      '1 Sangat Tidak Setuju, 2 Tidak Setuju, 3 Cukup/Netral, 4 Setuju, 5 Sangat Setuju.'
    );

  statements.forEach(function(statement) {
    form.addScaleItem()
      .setTitle(statement)
      .setBounds(1, 5)
      .setLabels('Sangat Tidak Setuju', 'Sangat Setuju')
      .setRequired(true);
  });
}
