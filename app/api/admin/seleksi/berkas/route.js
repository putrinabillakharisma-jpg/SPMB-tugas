
import pool from "@/lib/db";
import { jwtVerify } from "jose";

async function isAdmin(request) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const cari = searchParams.get("cari") || "";

    const allowedStatuses = [
      "Belum Diverifikasi",
      "Terverifikasi",
      "Perlu Revisi",
    ];

    const conditions = [];
    const params = [];

    if (status && allowedStatuses.includes(status)) {
      conditions.push("b.status_verifikasi = ?");
      params.push(status);
    }

    if (cari.trim()) {
      conditions.push(
        "(cs.nama LIKE ? OR cs.nisn LIKE ? OR b.jenis_berkas LIKE ?)"
      );

      const keyword = `%${cari.trim()}%`;
      params.push(keyword, keyword, keyword);
    }

    const where =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const [rows] = await pool.query(
      `SELECT
        b.id,
        b.user_id,
        cs.nama,
        cs.nisn,
        b.jenis_berkas,
        b.nama_file,
        b.path_file,
        b.status_verifikasi,
        b.catatan_admin,
        b.tanggal_upload,
        b.tanggal_verifikasi
      FROM berkas_calon_siswa b
      LEFT JOIN calon_siswa cs ON cs.id = b.user_id
      ${where}
      ORDER BY b.tanggal_upload DESC`,
      params
    );

    return Response.json({ data: rows });
  } catch (error) {
    console.error("GET verifikasi berkas:", error);

    return Response.json(
      { message: "Gagal mengambil data berkas." },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    if (!(await isAdmin(request))) {
      return Response.json(
        { message: "Akses hanya untuk admin." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id = Number(body.id);
    const status = body.status_verifikasi;
    const catatan = String(body.catatan_admin || "").trim();

    const allowedStatuses = [
      "Belum Diverifikasi",
      "Terverifikasi",
      "Perlu Revisi",
    ];

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      !allowedStatuses.includes(status)
    ) {
      return Response.json(
        { message: "ID atau status verifikasi tidak valid." },
        { status: 400 }
      );
    }

    if (status === "Perlu Revisi" && !catatan) {
      return Response.json(
        { message: "Catatan wajib diisi jika berkas perlu revisi." },
        { status: 400 }
      );
    }

    const [result] = await pool.query(
      `UPDATE berkas_calon_siswa
       SET status_verifikasi = ?,
           catatan_admin = ?,
           tanggal_verifikasi = NOW()
       WHERE id = ?`,
      [status, catatan || null, id]
    );

    if (result.affectedRows === 0) {
      return Response.json(
        { message: "Data berkas tidak ditemukan." },
        { status: 404 }
      );
    }

    return Response.json({
      message: "Status verifikasi berhasil diperbarui.",
    });
  } catch (error) {
    console.error("PATCH verifikasi berkas:", error);

    return Response.json(
      { message: "Gagal memperbarui status berkas." },
      { status: 500 }
    );
  }
}
