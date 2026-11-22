# Spin Wheel — Roda Pengacak

**Demo live:** [spin-wheel di GitHub Pages](https://kirax-12.github.io/spin-wheel/)

Roda pengacak nama berbasis web. Isi daftar nama, tekan **PUTAR!**, dan roda akan berhenti di satu nama secara acak. Cocok buat giveaway, arisan, urutan presentasi, atau mutusin siapa yang traktir kopi hari ini.

Dibangun dengan HTML, CSS, dan JavaScript murni — tanpa framework, tanpa library, tanpa server. Cukup buka `index.html` di browser.

## Fitur

- **Daftar nama bebas** — satu nama per baris di textarea, roda langsung menggambar ulang setiap kali daftar berubah.
- **2–24 nama** — di bawah 2 nama tombol putar nonaktif; di atas 24 nama akan muncul peringatan dan hanya 24 nama pertama yang dipakai.
- **Putaran realistis** — animasi `requestAnimationFrame` dengan easing cubic ease-out, durasi acak 5–8 detik.
- **Suara klik** — bunyi tick setiap segmen melewati jarum, pakai WebAudio (mulai setelah tombol ditekan, sesuai aturan browser).
- **Banner pemenang** — nama pemenang tampil besar, lengkap dengan ledakan confetti dan dua pilihan: *Hapus Pemenang* (buat undian tanpa pengulangan) atau *Putar Lagi*.
- **Acak Urutan** — mengocok ulang susunan nama di daftar.
- **Responsif** — roda menyesuaikan lebar layar ponsel, label nama otomatis dipersingkat kalau daftarnya panjang.

## Cara Pakai

1. Tulis nama-nama di panel **Daftar Nama**, satu per baris.
2. Tekan **PUTAR!** dan tunggu rodanya berhenti.
3. Nama yang berhenti tepat di jarum atas adalah pemenangnya.
4. Kalau mau lanjut tanpa pemenang yang sama, tekan **Hapus Pemenang**, lalu putar lagi.

## Teknologi

- Canvas 2D untuk roda dan confetti
- `requestAnimationFrame` + cubic ease-out untuk animasi putaran
- WebAudio API untuk suara tick dan jingle pemenang
- Font Space Grotesk, Space Mono, dan Caveat (Google Fonts)

---

Dibuat oleh **Remike Dev** — [github.com/kirax-12](https://github.com/kirax-12)
