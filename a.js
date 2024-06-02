const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

async function scrapePdfFiles(url) {
  try {
    // Buat permintaan HTTP ke URL
    const response = await axios.get(url);

    // Parsing HTML menggunakan Cheerio
    const $ = cheerio.load(response.data);

    // Temukan semua link file PDF
    const pdfLinks = $('a[href$=".pdf"]');

    // Tentukan direktori untuk menyimpan file PDF
    const pdfDirectory = path.join(__dirname, 'pdf_files');
    if (!fs.existsSync(pdfDirectory)) {
      fs.mkdirSync(pdfDirectory);
    }

    // Fungsi untuk membersihkan nama file dari karakter ilegal
    const sanitizeFileName = (name) => {
      return name.replace(/[\/\\?%*:|"<>]/g, '-').trim();
    };

    // Unduh semua file PDF secara paralel
    const downloadPromises = pdfLinks.map((i, element) => {
      const pdfUrl = new URL($(element).attr('href'), url).href;
      let pdfFileName = sanitizeFileName($(element).text()) || `file${i + 1}.pdf`;
      pdfFileName = pdfFileName.endsWith('.pdf') ? pdfFileName : `${pdfFileName}.pdf`;
      const pdfFilePath = path.join(pdfDirectory, pdfFileName);

      console.log(`Downloading ${pdfUrl} to ${pdfFilePath}`);

      return axios.get(pdfUrl, { responseType: 'arraybuffer' })
        .then((pdfResponse) => {
          fs.writeFileSync(pdfFilePath, pdfResponse.data);
          console.log(`File "${pdfFileName}" berhasil disimpan.`);
        })
        .catch((error) => {
          console.error(`Gagal mengunduh file "${pdfFileName}":`, error);
        });
    }).get(); // `.get()` untuk mengubah objek cheerio menjadi array

    await Promise.all(downloadPromises);
    console.log('Semua file PDF berhasil diunduh.');

  } catch (error) {
    console.error('Terjadi kesalahan:', error);
  }
}

// Panggil fungsi scrapePdfFiles dengan URL halaman web yang akan discrape
scrapePdfFiles('https://kampusmerdeka.kemdikbud.go.id/profile/document/');
