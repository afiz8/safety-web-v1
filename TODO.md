# TODO

## Fit to Work: Ubah jadi grid + pilihan dropdown (biar gak banyak ngetik)
- [ ] Update `src/pages/FitToWorkForm.js`:
  - [ ] `hasilAssessmentK3`: text -> select {Low, Medium, High}
  - [ ] `apdWajib`: text -> select (pilihan level/kelengkapan APD)
  - [ ] `daftarPeralatan`: text -> select (pilihan level/kesiapan peralatan)
  - [ ] `tekananDarah`: text -> select {Normal, Tidak Normal}
  - [ ] Rapikan layout input pakai grid konsisten
  - [ ] Update `evaluateFitToWork()` sesuai format nilai baru
  - [ ] Update reset state tombol Batal sesuai default baru
- [ ] Testing manual:
  - [ ] Submit dengan kombinasi selector Low/Medium/High
  - [ ] Cek status Fit/Unfit berubah
  - [ ] Cek edit assessment (klik edit -> update -> submit)


