
import pool from "@/lib/db";
import { jwtVerify } from "jose";

export async function GET(request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";

    const sessionCookie = cookieHeader
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith("spmb_session="));

    const token = sessionCookie?.slice("spmb_session=".length);
    const secret = process.env.SESSION_SECRET;

    if (!token || !secret || secret.length < 32) {
      return Response.json(
        { success: false, message: "Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"] }
    );

    if (payload.role !== "calon_siswa" || !payload.sub) {
      return Response.json(
        { success: false, message: "Akses hanya untuk calon siswa." },
        { status: 403 }
      );
    }

    const [rows] = await pool.query(
      `SELECT id, nama, email, nisn, whatsapp, created_at
       FROM calon_siswa
       WHERE id = ?
       LIMIT 1`,
      [payload.sub]
    );

    if (rows.length === 0) {
      return Response.json(
        { success: false, message: "Data calon siswa tidak ditemukan." },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("API PROFIL CALON SISWA:", error);

    return Response.json(
      { success: false, message: "Sesi tidak valid atau sudah berakhir." },
      { status: 401 }
    );
  }
}
