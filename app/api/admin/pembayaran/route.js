
import pool from "@/lib/db";
import { jwtVerify } from "jose";

// Memeriksa apakah pengguna yang login adalah admin
async function isAdmin(request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";

    const sessionCookie = cookieHeader
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith("spmb_session="));

    const token = sessionCookie?.slice("spmb_session=".length);
    const secret = process.env.SESSION_SECRET;

    if (!token || !secret || secret.length < 32) {
      return false;
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"] }
    );

    return payload.role === "admin";
  } catch {
    return false;
  }
}

// GET: Mengambil semua data pembayaran
export async function GET(request) {
  try {
    const admin = await isAdmin(request);

    if (!admin) {
      return Response.json(
        { success: false, message: "Akses hanya untuk admin." },
        { status: 401 }
      );
    }

    const [rows] = await pool.query(`
      SELECT
        p.id,
        p.calon_siswa_id,
        c.nama,
        c.nisn,
        p.nominal,
        p.tanggal_bayar,
        p.metode_pembayaran,
        p.bukti_pembayaran,
        p.status,
        p.catatan_admin,
        p.tanggal_verifikasi,
        p.created_at
      FROM pembayaran p
      INNER JOIN calon_siswa c
        ON c.id = p.calon_siswa_id
      ORDER BY p.created_at DESC
    `);

    return Response.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("GET pembayaran error:", error);

    return Response.json(
      { success: false, message: "Gagal mengambil data pembayaran." },
      { status: 500 }
    );
  }
}

// PUT: Mengubah status pembayaran
export async function PUT(request) {
  try {
    const admin = await isAdmin(request);

    if (!admin) {
      return Response.json(
        { success: false, message: "Akses hanya untuk admin." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id = Number(body.id);
    const status = body.status;
    const catatan = body.catatan_admin?.trim() || null;

    const statusDiizinkan = [
      "Diterima",
      "Ditolak",
      "Menunggu Verifikasi",
    ];

    if (!Number.isInteger(id) || id <= 0) {
      return Response.json(
        { success: false, message: "ID pembayaran tidak valid." },
        { status: 400 }
      );
    }

    if (!statusDiizinkan.includes(status)) {
      return Response.json(
        { success: false, message: "Status pembayaran tidak valid." },
        { status: 400 }
      );
    }

    const [result] = await pool.query(
      `UPDATE pembayaran
       SET status = ?,
           catatan_admin = ?,
           tanggal_verifikasi = NOW()
       WHERE id = ?`,
      [status, catatan, id]
    );

    if (result.affectedRows === 0) {
      return Response.json(
        { success: false, message: "Data pembayaran tidak ditemukan." },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "Status pembayaran berhasil diperbarui.",
    });
  } catch (error) {
    console.error("PUT pembayaran error:", error);

    return Response.json(
      { success: false, message: "Gagal memperbarui pembayaran." },
      { status: 500 }
    );
  }
}
