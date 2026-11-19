
import pool from "@/lib/db";
import { jwtVerify } from "jose";

async function isAdmin(request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";

    const sessionCookie = cookieHeader
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith("spmb_session="));

    if (!sessionCookie) return false;

    const token = sessionCookie.substring(
      "spmb_session=".length
    );

    const secret = process.env.SESSION_SECRET;

    if (!secret || secret.length < 32) {
      return false;
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );

    return payload.role === "admin";
  } catch (error) {
    console.error("ADMIN AUTH:", error);
    return false;
  }
}

const STATUS_VALID = [
  "Belum Diverifikasi",
  "Terverifikasi",
  "Perlu Revisi",
];

// GET DATA BERKAS
export async function GET(request) {
  try {
    if (!(await isAdmin(request))) {
      return Response.json(
        { message: "Akses hanya untuk admin." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const cari = searchParams.get("cari")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";

    let sql = `
      SELECT
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
      LEFT JOIN calon_siswa cs
        ON cs.id = b.user_id
      WHERE 1 = 1
    `;

    const values = [];

    if (status) {
      if (!STATUS_VALID.includes(status)) {
        return Response.json(
          { message: "Filter status tidak valid." },
          { status: 400 }
        );
      }

      sql += " AND b.status_verifikasi = ?";
      values.push(status);
    }

    if (cari) {
      sql += `
        AND (
          cs.nama LIKE ?
          OR cs.nisn LIKE ?
          OR b.jenis_berkas LIKE ?
          OR b.nama_file LIKE ?
        )
      `;

      const keyword = `%${cari}%`;

      values.push(
        keyword,
        keyword,
        keyword,
        keyword
      );
    }

    sql += `
      ORDER BY b.tanggal_upload DESC, b.id DESC
    `;

    const [rows] = await pool.execute(sql, values);

    return Response.json({
      message: "Data berkas berhasil diambil.",
      data: rows,
    });
  } catch (error) {
    console.error("GET VERIFIKASI BERKAS:", error);

    return Response.json(
      {
        message:
          "Terjadi kesalahan saat mengambil data berkas.",
      },
      { status: 500 }
    );
  }
}

// UPDATE STATUS VERIFIKASI
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
    const catatan = String(
      body.catatan_admin || ""
    ).trim();

    if (!Number.isInteger(id) || id <= 0) {
      return Response.json(
        { message: "ID berkas tidak valid." },
        { status: 400 }
      );
    }

    if (!STATUS_VALID.includes(status)) {
      return Response.json(
        { message: "Status verifikasi tidak valid." },
        { status: 400 }
      );
    }

    if (
      status === "Perlu Revisi" &&
      !catatan
    ) {
      return Response.json(
        {
          message:
            "Catatan admin wajib diisi jika berkas perlu revisi.",
        },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `
        UPDATE berkas_calon_siswa
        SET
          status_verifikasi = ?,
          catatan_admin = ?,
          tanggal_verifikasi = CASE
            WHEN ? = 'Terverifikasi'
              THEN NOW()
            ELSE NULL
          END
        WHERE id = ?
      `,
      [
        status,
        catatan || null,
        status,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return Response.json(
        { message: "Data berkas tidak ditemukan." },
        { status: 404 }
      );
    }

    return Response.json({
      message:
        "Status verifikasi berkas berhasil diperbarui.",
    });
  } catch (error) {
    console.error("PATCH VERIFIKASI BERKAS:", error);

    return Response.json(
      {
        message:
          "Terjadi kesalahan saat menyimpan verifikasi.",
      },
      { status: 500 }
    );
  }
}
