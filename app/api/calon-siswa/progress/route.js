
import pool from "@/lib/db";
import { jwtVerify } from "jose";

async function getCalonSiswaId(request) {
  const cookieHeader = request.headers.get("cookie") || "";

  const sessionCookie = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("spmb_session="));

  const token = sessionCookie?.slice("spmb_session=".length);
  const secret = process.env.SESSION_SECRET;

  if (!token || !secret || secret.length < 32) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"] }
    );

    if (
      payload.role !== "calon_siswa" ||
      !payload.sub ||
      !Number.isInteger(Number(payload.sub)) ||
      Number(payload.sub) <= 0
    ) {
      return null;
    }

    return Number(payload.sub);
  } catch {
    return null;
  }
}

export async function GET(request) {
  try {
    const calonSiswaId = await getCalonSiswaId(request);

    if (!calonSiswaId) {
      return Response.json(
        {
          success: false,
          message: "Silakan login terlebih dahulu.",
        },
        { status: 401 }
      );
    }

    // =========================================
    // 1. DATA DIRI
    // =========================================

    const [biodataRows] = await pool.query(
      `SELECT
        nik,
        tempat_lahir,
        tanggal_lahir,
        jenis_kelamin,
        agama,
        sekolah,
        tahun_lulus,
        alamat,
        ayah,
        ibu,
        pekerjaan,
        hp_ortu
      FROM biodata_siswa
      WHERE calon_siswa_id = ?
      LIMIT 1`,
      [calonSiswaId]
    );

    const biodata = biodataRows[0];

    const biodataFields = [
      "nik",
      "tempat_lahir",
      "tanggal_lahir",
      "jenis_kelamin",
      "agama",
      "sekolah",
      "tahun_lulus",
      "alamat",
      "ayah",
      "ibu",
      "pekerjaan",
      "hp_ortu",
    ];

    const jumlahBiodataTerisi = biodata
      ? biodataFields.filter((field) => {
          const value = biodata[field];

          return (
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ""
          );
        }).length
      : 0;

    const dataDiri =
      jumlahBiodataTerisi === 0
        ? "todo"
        : jumlahBiodataTerisi === biodataFields.length
          ? "done"
          : "progress";

    // =========================================
    // 2. PILIHAN JURUSAN
    // =========================================

    const [jurusanRows] = await pool.query(
      `SELECT jurusan_1, jurusan_2
       FROM pilihan_jurusan
       WHERE calon_siswa_id = ?
       LIMIT 1`,
      [calonSiswaId]
    );

    const pilihanJurusan =
      jurusanRows.length > 0 &&
      jurusanRows[0].jurusan_1 &&
      String(jurusanRows[0].jurusan_1).trim() !== ""
        ? "done"
        : "todo";

    // =========================================
    // 3. PEMBAYARAN
    // =========================================

    const [pembayaranRows] = await pool.query(
      `SELECT status
       FROM pembayaran
       WHERE calon_siswa_id = ?
       ORDER BY created_at DESC`,
      [calonSiswaId]
    );

    let pembayaran = "todo";

    if (pembayaranRows.length > 0) {
      pembayaran = pembayaranRows.some(
        (item) => item.status === "Diterima"
      )
        ? "done"
        : "progress";
    }

    // =========================================
    // 4. TES TPA
    // =========================================

    const [tpaRows] = await pool.query(
      `SELECT
        COUNT(*) AS total,
        SUM(
          CASE
            WHEN status = 'Selesai' THEN 1
            ELSE 0
          END
        ) AS selesai,
        SUM(
          CASE
            WHEN status = 'Sedang Mengerjakan' THEN 1
            ELSE 0
          END
        ) AS proses
      FROM hasil_tpa
      WHERE calon_siswa_id = ?`,
      [calonSiswaId]
    );

    const tpa = tpaRows[0];

    let tesTPA = "todo";

    if (Number(tpa.total) > 0) {
      if (Number(tpa.selesai) > 0) {
        tesTPA = "done";
      } else if (Number(tpa.proses) > 0) {
        tesTPA = "progress";
      }
    }

    // =========================================
    // 5. LAPORAN / DOKUMEN
    // =========================================

    const [dokumenRows] = await pool.query(
      `SELECT
        COUNT(*) AS total,
        SUM(
          CASE
            WHEN status_verifikasi = 'Terverifikasi' THEN 1
            ELSE 0
          END
        ) AS terverifikasi
      FROM berkas_calon_siswa
      WHERE user_id = ?`,
      [calonSiswaId]
    );

    const dokumen = dokumenRows[0];

    let laporanDokumen = "todo";

    if (Number(dokumen.total) > 0) {
      laporanDokumen =
        Number(dokumen.terverifikasi) === Number(dokumen.total)
          ? "done"
          : "progress";
    }

    // =========================================
    // RESPONSE
    // =========================================

    return Response.json({
      success: true,
      message: "Progress pendaftaran berhasil diambil.",
      data: {
        dataDiri,
        pilihanJurusan,
        pembayaran,
        tesTPA,
        laporanDokumen,
      },
    });
  } catch (error) {
    console.error("PROGRESS CALON SISWA:", error);

    return Response.json(
      {
        success: false,
        message: "Gagal mengambil progres pendaftaran.",
      },
      { status: 500 }
    );
  }
}
