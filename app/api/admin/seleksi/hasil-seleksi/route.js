
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

  if (!token || !secret || secret.length < 32) return false;

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
        cs.id AS calon_siswa_id,
        cs.nama,
        cs.nisn,
        ht.nilai AS nilai_tpa,
        ht.status AS status_tpa,
        hs.id AS hasil_seleksi_id,
        COALESCE(hs.status_seleksi, 'Menunggu Hasil')
          AS status_seleksi,
        hs.catatan_admin,
        hs.ditetapkan_at
      FROM calon_siswa cs

      LEFT JOIN hasil_tpa ht
        ON ht.id = (
          SELECT h2.id
          FROM hasil_tpa h2
          WHERE h2.calon_siswa_id = cs.id
          ORDER BY h2.created_at DESC, h2.id DESC
          LIMIT 1
        )

      LEFT JOIN hasil_seleksi hs
        ON hs.calon_siswa_id = cs.id

      WHERE cs.role = 'calon_siswa'
      ORDER BY cs.nama ASC
    `);

    return Response.json({ data: rows });
  } catch (error) {
    console.error("GET hasil seleksi:", error);

    return Response.json(
      { message: "Gagal mengambil hasil seleksi." },
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
    const calonSiswaId = Number(body.calon_siswa_id);
    const status = body.status_seleksi;
    const catatan = String(body.catatan_admin || "").trim();

    const allowedStatuses = [
      "Menunggu Hasil",
      "Lulus",
      "Tidak Lulus",
    ];

    if (
      !Number.isInteger(calonSiswaId) ||
      calonSiswaId <= 0 ||
      !allowedStatuses.includes(status)
    ) {
      return Response.json(
        { message: "Data hasil seleksi tidak valid." },
        { status: 400 }
      );
    }

    const [students] = await pool.query(
      `SELECT id FROM calon_siswa
       WHERE id = ? AND role = 'calon_siswa'`,
      [calonSiswaId]
    );

    if (students.length === 0) {
      return Response.json(
        { message: "Calon siswa tidak ditemukan." },
        { status: 404 }
      );
    }

    // Keputusan akhir hanya boleh ditetapkan setelah
    // calon siswa memiliki hasil TPA yang selesai.
    if (status !== "Menunggu Hasil") {
      const [tests] = await pool.query(
        `SELECT id
         FROM hasil_tpa
         WHERE calon_siswa_id = ?
           AND status = 'Selesai'
         LIMIT 1`,
        [calonSiswaId]
      );

      if (tests.length === 0) {
        return Response.json(
          {
            message:
              "Calon siswa belum memiliki hasil TPA berstatus Selesai.",
          },
          { status: 400 }
        );
      }
    }

    const ditetapkanAt =
      status === "Menunggu Hasil" ? null : new Date();

    await pool.query(
      `INSERT INTO hasil_seleksi
        (calon_siswa_id, status_seleksi, catatan_admin, ditetapkan_at)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        status_seleksi = VALUES(status_seleksi),
        catatan_admin = VALUES(catatan_admin),
        ditetapkan_at = VALUES(ditetapkan_at)`,
      [calonSiswaId, status, catatan || null, ditetapkanAt]
    );

    return Response.json({
      message: "Hasil seleksi berhasil disimpan.",
    });
  } catch (error) {
    console.error("PATCH hasil seleksi:", error);

    return Response.json(
      { message: "Gagal menyimpan hasil seleksi." },
      { status: 500 }
    );
  }
}
