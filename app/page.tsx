export default function Home() {
  return (
    <main className="spmb-page">

      {/* ================= NAVBAR ================= */}
      <header className="navbar">
        <div className="nav-container">

          <div className="logo-area">
            <div className="logo-circle">
              <img src="asset/logo cn.png" alt="" />
            </div>

            <div className="logo-text">
              <h3>SPMB</h3>
              <span>SMK Citra Negara</span>
            </div>
          </div>


          <nav className="nav-menu">
            <a href="#home">Beranda</a>
            <a href="#informasi">Informasi</a>
            <a href="#jalur">Jalur Pendaftaran</a>
          </nav>


         <a href="/login" className="login-btn">
            Login / Daftar
          </a>

        </div>
      </header>


      {/* ================= HERO ================= */}
      <section className="hero" id="home">

        <div className="hero-content">

          <span className="small-label">
            ✦ Pendaftaran Siswa Baru
          </span>

          <h1>
            Sistem Penerimaan
            <br />
            Murid Baru <span>(SPMB)</span>
          </h1>

          <p>
            Wujudkan masa depan yang lebih baik bersama 
            <br /> kami. Daftarkan diri Anda dan raih kesempatan 
            <br />menjadi bagian dari keluarga besar SMK Citra Negara.
          </p>

          <div className="hero-buttons">

            <a href="/login" className="primary-btn">
              <img src="icon/catatan.png" alt="" />
              Mulai Pendaftaran →
            </a>

            <button className="secondary-btn">
              Lihat Informasi →
            </button>

          </div>

        </div>


        <div className="hero-image">

          <div className="hero-circle"></div>

          <img
            src="/asset/cngedung.jpg"
            alt="Siswa SMK Citra Negara"
          />

        </div>

      </section>


      {/* ================= INFORMASI PENDAFTARAN ================= */}
      <section className="info-section" id="informasi">

        {/* CARD 1 */}
        <div className="info-card">

          <div className="card-top">
            <div className="card-icon blue">
              <img src="icon/data.png" alt="" />
            </div>

            <div className="dots">•••</div>
          </div>

          <h3>
            Pendaftaran Online
          </h3>

          <p>
            Proses pendaftaran mudah,
            cepat dan dapat dilakukan
            dari mana saja.
          </p>

        </div>


        {/* CARD 2 */}
        <div className="info-card">

          <div className="card-top">
            <div className="card-icon green">
              <img src="icon/centang.png" alt="" />
            </div>

            <div className="dots">•••</div>
          </div>

          <h3>
            Pantau Hasil Seleksi
          </h3>

          <p>
            Cek hasil seleksi secara online
            dengan mudah dan transparan.
          </p>

        </div>


        {/* CARD 3 */}
        <div className="info-card">

          <div className="card-top">
            <div className="card-icon purple">
              <img src="icon/topi.png" alt="" />
            </div>

            <div className="dots">•••</div>
          </div>

          <h3>
            Informasi Lengkap
          </h3>

          <p>
            Dapatkan informasi seputar
            Jalur, Persyaratan, dan Jadwal
            SPMB terbaru.
          </p>

        </div>


        {/* CARD 4 */}
        <div className="info-card">

          <div className="card-top">
            <div className="card-icon yellow">
              <img src="icon/head.png" alt="" />
            </div>

            <div className="dots">•••</div>
          </div>

          <h3>
            Layanan Bantuan
          </h3>

          <p>
            Jika ada kendala hubungi
            kami melalui kontak yang
            tersedia.
          </p>

        </div>

      </section>


      {/* ================= TENTANG KAMI ================= */}
      <section className="school-section">

        <div className="school-content">

          <span className="section-label">
            Tentang Kami
          </span>

          <h2>
            SMK Citra Negara
          </h2>

          <p>
            SMK Citra Negara adalah sekolah menengah kejuruan
            yang berkomitmen untuk mencetak lulusan yang kompeten,
            berkarakter, dan siap menghadapi dunia kerja maupun
            melanjutkan pendidikan ke jenjang yang lebih tinggi.
          </p>

          <button className="primary-btn school-btn">
            Pelajari Lebih Lanjut →
          </button>

        </div>


        <div className="school-image">

          <img
            src="/asset/gedungcn.png"
            alt="Gedung SMK Citra Negara"
          />

          <div className="school-decoration decoration-one">
            ◌
          </div>

          <div className="school-decoration decoration-two">
            ˚
          </div>

          <div className="image-bubble">
            <strong>SMK CITRA NEGARA</strong>
            <br />
            MANTAP!
          </div>

        </div>

      </section>


      {/* ================= JALUR PENDAFTARAN ================= */}
      <section className="path-section" id="jalur">

        <span className="section-label">
          Jalur Pendaftaran
        </span>

        <h2>
          Pilih Jalur yang sesuai dengan Minat dan Kemampuanmu
        </h2>


        <div className="path-container">

          {/* PRESTASI */}
          <div className="path-card">

            <div className="path-card-top">

              <div className="path-icon blue">
                <img src="icon/prestasi.png" alt="" />
              </div>

              <span className="path-dots">
                •••
              </span>

            </div>

            <h3>
              Jalur Prestasi
            </h3>

            <p>Untuk calon siswa berprestasi
              di bidang akademik maupun non
              akademik.</p>

          </div>


          {/* AFIRMASI */}
          <div className="path-card">

            <div className="path-card-top">

              <div className="path-icon green">
                <img src="icon/orang.png" alt="" />
              </div>

              <span className="path-dots">
                •••
              </span>

            </div>

            <h3>
              Jalur Afirmasi
            </h3>
            <p>
              Untuk calon siswa dari keluarga
kurang mampu.
            </p>

          </div>


          {/* PERPINDAHAN */}
          <div className="path-card">

            <div className="path-card-top">

              <div className="path-icon purple">
                <img src="icon/pesawat.png" alt="" />
              </div>

              <span className="path-dots">
                •••
              </span>

            </div>

            <h3>
              Jalur Perpindahan Tugas
              <br />
              Orang Tua
            </h3>
            <p>
              Untuk calon siswa yang mengikuti
orang tua/wali.
            </p>

          </div>


          {/* REGULER */}
          <div className="path-card">

            <div className="path-card-top">

              <div className="path-icon pink">
                <img src="icon/jam.png" alt="" />
              </div>

              <span className="path-dots">
                •••
              </span>

            </div>

            <h3>
              Jalur Reguler
            </h3>
            <p>
              Untuk seluruh calon siswa lulusan SMP/MTS yang memenuhi syarat
            </p>

          </div>

        </div>

      </section>


      {/* ================= BERITA ================= */}
      <section className="news-section">

        <span className="section-label">
          Berita & Pengumuman
        </span>

        <h2>
          Informasi Terbaru
        </h2>


        <div className="news-container">

          {/* NEWS 1 */}
          <div className="news-card">

            <div className="news-placeholder">
              <img src="icon/pengumuman.png" alt="" />
            </div>

            <div className="news-content">

              <span>
                Pengumuman
              </span>

              <h3>
                Informasi terbaru SPMB
              </h3>

              <p>
                Silahkan lakukan pendaftaran melalui website resmi
              </p>
              <a href="#">SPMB SMK Citra Negara.</a>

            </div>

          </div>


          {/* NEWS 2 */}
          <div className="news-card">

            <div className="news-placeholder">
              <img src="icon/kalender.png" alt="" />
            </div>

            <div className="news-content">

              <span>
                Informasi
              </span>

              <h3>
                Jadwal SPMB
              </h3>

              <p>
                Cek jadwal lengkap seleksi dan pengumuman hasil di menu informasi
              </p>

            </div>

          </div>


          {/* NEWS 3 */}
          <div className="news-card">

            <div className="news-placeholder">
              <img src="icon/seleksi.png" alt="" />
            </div>

            <div className="news-content">

              <span>
                Pengumuman
              </span>

              <h3>
                Hasil Seleksi
              </h3>

              <p>
                Cek jadwal lengkap seleksi dan pengumuman hasil di menu informasi
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* ================= FOOTER ================= */}
     <footer className="footer">

  <div className="footer-left">

    <div className="logo-circle">
      <img src="asset/logo cn.png" alt="" />
    </div>

    <div className="logo-text">
      <h3>SPMB</h3>
      <span>SMK Citra Negara</span>
    </div>

  </div>


  <div className="footer-text">
    <p>Bersama Mewujudkan Generasi Unggul</p>
    <span>dan Berkarakter</span>
  </div>


  <div className="socials">

    <a href="#">
      <img src="icon/insta.png" alt="" />
    </a>

    <a href="#">
      <img src="icon/facebook.png" alt="" />
    </a>

    <a href="#">
      <img src="icon/yt.png" alt="" />
    </a>

  </div>


  <div className="footer-credit">

    <div className="credit-line">
      <img src="icon/garis.png" alt="" />
    </div>

    <span>
      ©2026 SMK Citra Negara. All rights reserved
    </span>

  </div>

</footer>



    </main>
  );
}