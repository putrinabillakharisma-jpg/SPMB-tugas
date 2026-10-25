
import pool from "@/lib/db";
import { jwtVerify } from "jose";

async function isAdmin(request) {
  const cookieHeader = request.headers.get("cookie") || "";

  const cookie = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("spmb_session="));

  const token = cookie?.slice("spmb_session=".length);
  const secret = process.env.SESSION_SECRET;

  if (!token || !secret || secret.length < 32) {
    return false;
  }

  try {
    const { payload } = await jwtVerify(
      decodeURIComponent(token),
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"] }
    );

    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function GET(request) {
  try {
    if (!(await isAdmin(request))) {
      return Response.json(
        { message: "Akses hanya untuk admin." },
        { status: 401 }
      );
    }

    const [rows] = await pool.query(`
      SELECT
        b.id,
        b.user_id,
        u.nama AS nama_calon_siswa,
        b.jenis_berkas,
        b.nama_file,
        b.path_file,
        b.status_verifikasi,
        b.catatan_admin,
        b.tanggal_upload,
        b.tanggal_verifikasi
      FROM berkas_calon_siswa b
      LEFT JOIN users u ON u.id = b.user_id
      ORDER BY b.tanggal_upload DESC, b.id DESC
    `);

    const [summaryRows] = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(status_verifikasi = 'Terverifikasi'), 0)
          AS terverifikasi,
        COALESCE(SUM(status_verifikasi = 'Belum Diverifikasi'), 0)
          AS belum_verifikasi,
        COALESCE(SUM(status_verifikasi = 'Perlu Revisi'), 0)
          AS perlu_revisi
      FROM berkas_calon_siswa
    `);

    return Response.json({
      data: rows,
      summary: summaryRows[0],
    });
  } catch (error) {
    console.error("GET laporan dokumen:", error);

    return Response.json(
      { message: "Gagal mengambil data dokumen." },
      { status: 500 }
    );
  }
}
