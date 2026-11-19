
import pool from "@/lib/db";
import { jwtVerify } from "jose";

export const runtime = "nodejs";

const BIAYA_PENDAFTARAN = 150000;
const JENIS_PEMBAYARAN = "Pendaftaran";

const METODE = {
  QRIS: "QRIS Simulasi",
  VA: "Virtual Account Simulasi",
  TRANSFER: "Transfer Bank Manual",
};

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
      nama: payload.nama,
      email: payload.email,
    };
  } catch (error) {
    console.error("Session error:", error);
    return null;
  }
}

// GET: mengambil tagihan pendaftaran
export async function GET(request) {
  try {
    const user = await getCalonSiswa(request);

    if (!user) {
      return Response.json(
        { message: "Silakan login sebagai calon siswa." },
        { status: 401 }
      );
    }

    const [rows] = await pool.execute(
      `SELECT
        id,
        calon_siswa_id,
        nominal,
        tanggal_bayar,
        metode_pembayaran,
        bukti_pembayaran,
        status,
        catatan_admin,
        tanggal_verifikasi,
        jenis_pembayaran,
        payment_reference,
        payment_url,
        qr_url,
        va_number,
        created_at
      FROM pembayaran
      WHERE calon_siswa_id = ?
        AND jenis_pembayaran = ?
      ORDER BY id DESC
      LIMIT 1`,
      [user.id, JENIS_PEMBAYARAN]
    );

    return Response.json({
      message: "Data pembayaran berhasil diambil.",
      biaya: BIAYA_PENDAFTARAN,
      pembayaran: rows[0] || null,
    });
  } catch (error) {
    console.error("GET pembayaran error:", error);

    return Response.json(
      { message: "Gagal mengambil data pembayaran." },
      { status: 500 }
    );
  }
}

// POST: membuat tagihan atau menyimpan metode pembayaran
export async function POST(request) {
  try {
    const user = await getCalonSiswa(request);

    if (!user) {
      return Response.json(
        { message: "Silakan login sebagai calon siswa." },
        { status: 401 }
      );
    }

    let body = {};

    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const metodeInput = String(
      body.metode || body.metode_pembayaran || ""
    ).toUpperCase();

    if (metodeInput && !METODE[metodeInput]) {
      return Response.json(
        { message: "Metode pembayaran tidak valid." },
        { status: 400 }
      );
    }

    const metodeDipilih = metodeInput
      ? METODE[metodeInput]
      : null;

    // Periksa data calon siswa
    const [calonSiswa] = await pool.execute(
      `SELECT id, nama, nisn
       FROM calon_siswa
       WHERE id = ?
       LIMIT 1`,
      [user.id]
    );

    if (!calonSiswa.length) {
      return Response.json(
        { message: "Data calon siswa tidak ditemukan." },
        { status: 404 }
      );
    }

    // Pastikan pilihan jurusan sudah diisi
    const [pilihan] = await pool.execute(
      `SELECT id, jurusan_1, jurusan_2
       FROM pilihan_jurusan
       WHERE calon_siswa_id = ?
       LIMIT 1`,
      [user.id]
    );

    if (!pilihan.length || !pilihan[0].jurusan_1) {
      return Response.json(
        {
          message:
            "Silakan lengkapi pilihan jurusan terlebih dahulu.",
        },
        { status: 400 }
      );
    }

    // Periksa tagihan terakhir
    const [existing] = await pool.execute(
      `SELECT
        id,
        calon_siswa_id,
        nominal,
        status,
        metode_pembayaran,
        bukti_pembayaran,
        payment_reference,
        payment_url,
        qr_url,
        va_number,
        jenis_pembayaran,
        created_at
      FROM pembayaran
      WHERE calon_siswa_id = ?
        AND jenis_pembayaran = ?
      ORDER BY id DESC
      LIMIT 1`,
      [user.id, JENIS_PEMBAYARAN]
    );

    if (existing.length > 0) {
      const pembayaran = existing[0];
      const status = String(pembayaran.status).toLowerCase();

      if (status === "diterima") {
        return Response.json({
          message: "Pembayaran sudah diterima.",
          pembayaran,
        });
      }

      const statusAktif = [
        "menunggu pembayaran",
        "menunggu verifikasi",
        "diproses",
      ];

      if (statusAktif.includes(status)) {
        // Metode hanya boleh diganti selama belum dibayar.
        if (
          metodeDipilih &&
          status === "menunggu pembayaran"
        ) {
          await pool.execute(
            `UPDATE pembayaran
             SET metode_pembayaran = ?
             WHERE id = ?
               AND calon_siswa_id = ?
               AND status = 'Menunggu Pembayaran'`,
            [metodeDipilih, pembayaran.id, user.id]
          );
        }

        const [updatedRows] = await pool.execute(
          `SELECT
            id,
            calon_siswa_id,
            nominal,
            status,
            metode_pembayaran,
            bukti_pembayaran,
            catatan_admin,
            tanggal_bayar,
            tanggal_verifikasi,
            jenis_pembayaran,
            payment_reference,
            payment_url,
            qr_url,
            va_number,
            created_at
          FROM pembayaran
          WHERE id = ?
          LIMIT 1`,
          [pembayaran.id]
        );

        return Response.json({
          message: "Tagihan pembayaran sudah tersedia.",
          pembayaran: updatedRows[0],
        });
      }

      // Jika tagihan sebelumnya ditolak atau gagal,
      // calon siswa boleh membuat tagihan baru.
    }

    // Buat tagihan baru
    const [result] = await pool.execute(
      `INSERT INTO pembayaran (
        calon_siswa_id,
        nominal,
        metode_pembayaran,
        status,
        jenis_pembayaran,
        created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        user.id,
        BIAYA_PENDAFTARAN,
        metodeDipilih || "Belum Dipilih",
        "Menunggu Pembayaran",
        JENIS_PEMBAYARAN,
      ]
    );

    const [newRows] = await pool.execute(
      `SELECT
        id,
        calon_siswa_id,
        nominal,
        status,
        metode_pembayaran,
        jenis_pembayaran,
        created_at
      FROM pembayaran
      WHERE id = ?
      LIMIT 1`,
      [result.insertId]
    );

    return Response.json(
      {
        message: "Tagihan berhasil dibuat.",
        pembayaran: newRows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST pembayaran error:", error);

    return Response.json(
      { message: "Gagal membuat tagihan pembayaran." },
      { status: 500 }
    );
  }
}
