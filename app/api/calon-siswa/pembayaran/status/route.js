
import pool from "@/lib/db";
import { jwtVerify } from "jose";

export const runtime = "nodejs";

// ========================================
// CEK SESSION CALON SISWA
// ========================================
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

    if (!secret || secret.length < 32) {
      return null;
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );

    if (
      payload.role !== "calon_siswa" ||
      !payload.id
    ) {
      return null;
    }

    return {
      id: Number(payload.id),
    };
  } catch (error) {
    return null;
  }
}

// ========================================
// GET: CEK STATUS PEMBAYARAN
// ========================================
export async function GET(request) {
  try {
    const user = await getCalonSiswa(request);

    if (!user) {
      return Response.json(
        {
          message: "Silakan login sebagai calon siswa.",
        },
        { status: 401 }
      );
    }

    const [rows] = await pool.execute(
      `SELECT
        id,
        nominal,
        metode_pembayaran,
        bukti_pembayaran,
        status,
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
      WHERE calon_siswa_id = ?
        AND jenis_pembayaran = ?
      ORDER BY id DESC
      LIMIT 1`,
      [user.id, "Pendaftaran"]
    );

    if (!rows.length) {
      return Response.json({
        message: "Belum ada tagihan pembayaran.",
        pembayaran: null,
        status: "Belum Membayar",
        bolehTesTPA: false,
      });
    }

    const pembayaran = rows[0];

    const status = String(
      pembayaran.status || ""
    ).toLowerCase();

    const bolehTesTPA = status === "diterima";

    return Response.json({
      message: "Status pembayaran berhasil diperiksa.",
      pembayaran,
      status: pembayaran.status,
      bolehTesTPA,
    });
  } catch (error) {
    console.error("Status pembayaran error:", error);

    return Response.json(
      {
        message: "Gagal memeriksa status pembayaran.",
      },
      { status: 500 }
    );
  }
}
