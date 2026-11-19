
import pool from "@/lib/db";
import { jwtVerify } from "jose";

export const runtime = "nodejs";

async function getCalonSiswa(request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";

    const sessionCookie = cookieHeader
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith("spmb_session="));

    if (!sessionCookie) return null;

    const token = sessionCookie.slice("spmb_session=".length);
    const secret = process.env.SESSION_SECRET;

    if (!secret || secret.length < 32) return null;

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );

    if (
      payload.role !== "calon_siswa" ||
      !payload.id ||
      !Number.isSafeInteger(Number(payload.id))
    ) {
      return null;
    }

    return {
      id: Number(payload.id),
      nama: payload.nama || "Calon Siswa",
    };
  } catch (error) {
    console.error("Session TPA error:", error);
    return null;
  }
}

// Pastikan pembayaran formulir sudah diterima.
async function cekPembayaran(calonSiswaId) {
  const [rows] = await pool.execute(
    `SELECT id, status
     FROM pembayaran
     WHERE calon_siswa_id = ?
       AND jenis_pembayaran = 'Pendaftaran'
     ORDER BY id DESC
     LIMIT 1`,
    [calonSiswaId]
  );

  return (
    rows.length > 0 &&
    String(rows[0].status).toLowerCase() === "diterima"
  );
}

// Mengambil tes aktif yang sedang berada dalam jadwal.
async function getTesAktif() {
  const [rows] = await pool.execute(
    `SELECT
       id,
       judul,
       deskripsi,
       tanggal_mulai,
       tanggal_selesai,
       durasi_menit,
       jumlah_soal,
       status
     FROM tes_tpa
     WHERE status = 'Aktif'
       AND (tanggal_mulai IS NULL OR tanggal_mulai <= NOW())
       AND (tanggal_selesai IS NULL OR tanggal_selesai >= NOW())
     ORDER BY id DESC
     LIMIT 1`
  );

  return rows[0] || null;
}

// GET: mengecek pembayaran dan mengambil informasi tes.
export async function GET(request) {
  try {
    const user = await getCalonSiswa(request);

    if (!user) {
      return Response.json(
        { message: "Silakan login sebagai calon siswa." },
        { status: 401 }
      );
    }

    const sudahBayar = await cekPembayaran(user.id);

    if (!sudahBayar) {
      return Response.json({
        terkunci: true,
        message:
          "Tes TPA belum dapat diakses. Silakan selesaikan pembayaran formulir dan tunggu verifikasi admin.",
        tes: null,
        hasil: null,
        soal: [],
      });
    }

    const tes = await getTesAktif();

    if (!tes) {
      return Response.json({
        terkunci: false,
        tersedia: false,
        message: "Belum ada Tes TPA yang tersedia saat ini.",
        tes: null,
        hasil: null,
        soal: [],
      });
    }

    const [hasilRows] = await pool.execute(
      `SELECT
         id,
         tes_id,
         calon_siswa_id,
         nilai,
         status,
         mulai_at,
         selesai_at,
         created_at
       FROM hasil_tpa
       WHERE tes_id = ?
         AND calon_siswa_id = ?
       LIMIT 1`,
      [tes.id, user.id]
    );

    const hasil = hasilRows[0] || null;

    // Jika tes sudah selesai, jangan kirim soal lagi.
    if (hasil && hasil.status === "Selesai") {
      return Response.json({
        terkunci: false,
        tersedia: true,
        selesai: true,
        message: "Kamu sudah menyelesaikan Tes TPA ini.",
        tes,
        hasil,
        soal: [],
      });
    }

    // Jika belum memulai, cukup kirim informasi tes.
    if (!hasil || hasil.status !== "Sedang Mengerjakan") {
      return Response.json({
        terkunci: false,
        tersedia: true,
        selesai: false,
        sudahMulai: false,
        message: "Tes TPA siap dimulai.",
        tes,
        hasil,
        soal: [],
      });
    }

    // Kunci jawaban TIDAK ikut dikirim ke browser.
    const [soalRows] = await pool.execute(
      `SELECT
         id,
         pertanyaan,
         opsi_a,
         opsi_b,
         opsi_c,
         opsi_d,
         urutan
       FROM soal_tpa
       WHERE tes_id = ?
       ORDER BY urutan ASC, id ASC`,
      [tes.id]
    );

    return Response.json({
      terkunci: false,
      tersedia: true,
      selesai: false,
      sudahMulai: true,
      message: "Tes TPA sedang dikerjakan.",
      tes,
      hasil,
      soal: soalRows,
    });
  } catch (error) {
    console.error("GET Tes TPA error:", error);

    return Response.json(
      { message: "Gagal mengambil data Tes TPA." },
      { status: 500 }
    );
  }
}

// POST: memulai tes atau menyelesaikan tes.
export async function POST(request) {
  try {
    const user = await getCalonSiswa(request);

    if (!user) {
      return Response.json(
        { message: "Silakan login sebagai calon siswa." },
        { status: 401 }
      );
    }

    // Cek pembayaran kembali di server.
    const sudahBayar = await cekPembayaran(user.id);

    if (!sudahBayar) {
      return Response.json(
        {
          message:
            "Akses ditolak. Pembayaran formulir belum diterima.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const action = String(body.action || "");

    // =========================
    // MULAI TES
    // =========================
    if (action === "start") {
      const tes = await getTesAktif();

      if (!tes) {
        return Response.json(
          { message: "Tidak ada tes yang aktif saat ini." },
          { status: 404 }
        );
      }

      const [soalRows] = await pool.execute(
        `SELECT id
         FROM soal_tpa
         WHERE tes_id = ?`,
        [tes.id]
      );

      if (soalRows.length === 0) {
        return Response.json(
          { message: "Soal untuk tes ini belum tersedia." },
          { status: 400 }
        );
      }

      const [existing] = await pool.execute(
        `SELECT id, status, mulai_at, selesai_at, nilai
         FROM hasil_tpa
         WHERE tes_id = ?
           AND calon_siswa_id = ?
         LIMIT 1`,
        [tes.id, user.id]
      );

      if (existing.length > 0) {
        const hasil = existing[0];

        if (hasil.status === "Selesai") {
          return Response.json(
            {
              message: "Tes ini sudah pernah diselesaikan.",
              hasil,
            },
            { status: 409 }
          );
        }

        if (hasil.status === "Sedang Mengerjakan") {
          return Response.json({
            message: "Tes sudah dimulai sebelumnya.",
            hasil,
          });
        }
      }

      const [insertResult] = await pool.execute(
        `INSERT INTO hasil_tpa (
           tes_id,
           calon_siswa_id,
           status,
           mulai_at,
           created_at
         )
         VALUES (?, ?, 'Sedang Mengerjakan', NOW(), NOW())`,
        [tes.id, user.id]
      );

      const [hasilBaru] = await pool.execute(
        `SELECT
           id,
           tes_id,
           calon_siswa_id,
           nilai,
           status,
           mulai_at,
           selesai_at
         FROM hasil_tpa
         WHERE id = ?
         LIMIT 1`,
        [insertResult.insertId]
      );

      return Response.json({
        message: "Tes TPA berhasil dimulai.",
        tes,
        hasil: hasilBaru[0],
      });
    }

    // =========================
    // SELESAIKAN TES
    // =========================
    if (action === "finish") {
      const tesId = Number(body.tes_id);
      const jawaban = body.jawaban;

      if (!Number.isSafeInteger(tesId) || tesId <= 0) {
        return Response.json(
          { message: "ID tes tidak valid." },
          { status: 400 }
        );
      }

      if (
        !jawaban ||
        typeof jawaban !== "object" ||
        Array.isArray(jawaban)
      ) {
        return Response.json(
          { message: "Data jawaban tidak valid." },
          { status: 400 }
        );
      }

      const [tesRows] = await pool.execute(
        `SELECT id, durasi_menit
         FROM tes_tpa
         WHERE id = ?
         LIMIT 1`,
        [tesId]
      );

      if (!tesRows.length) {
        return Response.json(
          { message: "Data tes tidak ditemukan." },
          { status: 404 }
        );
      }

      const [hasilRows] = await pool.execute(
        `SELECT id, status, mulai_at, nilai
         FROM hasil_tpa
         WHERE tes_id = ?
           AND calon_siswa_id = ?
         LIMIT 1`,
        [tesId, user.id]
      );

      if (!hasilRows.length) {
        return Response.json(
          { message: "Kamu belum memulai tes ini." },
          { status: 400 }
        );
      }

      const hasilLama = hasilRows[0];

      if (hasilLama.status === "Selesai") {
        return Response.json({
          message: "Tes sudah diselesaikan sebelumnya.",
          hasil: hasilLama,
        });
      }

      if (hasilLama.status !== "Sedang Mengerjakan") {
        return Response.json(
          { message: "Status pengerjaan tes tidak valid." },
          { status: 400 }
        );
      }

      // Ambil kunci jawaban langsung dari database.
      const [soalRows] = await pool.execute(
        `SELECT id, kunci_jawaban
         FROM soal_tpa
         WHERE tes_id = ?
         ORDER BY urutan ASC, id ASC`,
        [tesId]
      );

      if (soalRows.length === 0) {
        return Response.json(
          { message: "Soal tes tidak ditemukan." },
          { status: 400 }
        );
      }

      let benar = 0;

      for (const soal of soalRows) {
        const jawabanUser = String(
          jawaban[String(soal.id)] || ""
        ).toUpperCase();

        if (
          ["A", "B", "C", "D"].includes(jawabanUser) &&
          jawabanUser === soal.kunci_jawaban
        ) {
          benar++;
        }
      }

      const totalSoal = soalRows.length;
      const nilai = Number(
        ((benar / totalSoal) * 100).toFixed(2)
      );

      // Simpan nilai dan status dari perhitungan server.
      await pool.execute(
        `UPDATE hasil_tpa
         SET nilai = ?,
             status = 'Selesai',
             selesai_at = NOW()
         WHERE id = ?
           AND calon_siswa_id = ?
           AND status = 'Sedang Mengerjakan'`,
        [nilai, hasilLama.id, user.id]
      );

      const [hasilSelesai] = await pool.execute(
        `SELECT
           id,
           tes_id,
           calon_siswa_id,
           nilai,
           status,
           mulai_at,
           selesai_at
         FROM hasil_tpa
         WHERE id = ?
         LIMIT 1`,
        [hasilLama.id]
      );

      return Response.json({
        message: "Tes TPA berhasil diselesaikan.",
        hasil: hasilSelesai[0],
        benar,
        total_soal: totalSoal,
      });
    }

    return Response.json(
      { message: "Aksi tidak dikenali." },
      { status: 400 }
    );
  } catch (error) {
    console.error("POST Tes TPA error:", error);

    return Response.json(
      { message: "Terjadi kesalahan saat memproses Tes TPA." },
      { status: 500 }
    );
  }
}
