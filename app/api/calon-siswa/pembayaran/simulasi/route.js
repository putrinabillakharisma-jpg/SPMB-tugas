
import pool from "@/lib/db";
import { jwtVerify } from "jose";
import { randomUUID } from "crypto";

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

    return { id: Number(payload.id) };
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    const user = await getCalonSiswa(request);

    if (!user) {
      return Response.json(
        { message: "Silakan login sebagai calon siswa." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const pembayaranId = Number(body.pembayaran_id);

    if (
      !Number.isSafeInteger(pembayaranId) ||
      pembayaranId <= 0
    ) {
      return Response.json(
        { message: "ID pembayaran tidak valid." },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute(
      `SELECT
        id,
        nominal,
        status,
        metode_pembayaran,
        jenis_pembayaran
      FROM pembayaran
      WHERE id = ?
        AND calon_siswa_id = ?
        AND jenis_pembayaran = 'Pendaftaran'
      LIMIT 1`,
      [pembayaranId, user.id]
    );

    if (!rows.length) {
      return Response.json(
        { message: "Tagihan pembayaran tidak ditemukan." },
        { status: 404 }
      );
    }

    const pembayaran = rows[0];
    const status = String(pembayaran.status).toLowerCase();
    const metode = String(
      pembayaran.metode_pembayaran || ""
    ).toLowerCase();

    if (status === "diterima") {
      return Response.json({
        message: "Pembayaran sudah diterima.",
        pembayaran,
      });
    }

    if (status !== "menunggu pembayaran") {
      return Response.json(
        {
          message:
            "Tagihan tidak berada dalam status menunggu pembayaran.",
        },
        { status: 400 }
      );
    }

    const metodeSimulasi = [
      "qris simulasi",
      "virtual account simulasi",
    ];

    if (!metodeSimulasi.includes(metode)) {
      return Response.json(
        {
          message:
            "Simulasi hanya tersedia untuk metode QRIS dan Virtual Account.",
        },
        { status: 400 }
      );
    }

    const reference = `DEMO-${randomUUID()}`;

    // Status diperbarui oleh server, bukan dari nilai status
    // yang dikirim langsung oleh browser.
    const [result] = await pool.execute(
      `UPDATE pembayaran
       SET status = 'Diterima',
           tanggal_bayar = NOW(),
           tanggal_verifikasi = NOW(),
           payment_reference = ?,
           catatan_admin = ?
       WHERE id = ?
         AND calon_siswa_id = ?
         AND status = 'Menunggu Pembayaran'`,
      [
        reference,
        "Pembayaran berhasil melalui simulasi demonstrasi. Bukan transaksi sungguhan.",
        pembayaranId,
        user.id,
      ]
    );

    if (result.affectedRows === 0) {
      return Response.json(
        {
          message:
            "Status pembayaran berubah. Silakan muat ulang halaman.",
        },
        { status: 409 }
      );
    }

    const [updatedRows] = await pool.execute(
      `SELECT
        id,
        calon_siswa_id,
        nominal,
        status,
        metode_pembayaran,
        tanggal_bayar,
        tanggal_verifikasi,
        jenis_pembayaran,
        payment_reference,
        catatan_admin,
        created_at
      FROM pembayaran
      WHERE id = ?
      LIMIT 1`,
      [pembayaranId]
    );

    return Response.json({
      message:
        "Simulasi pembayaran berhasil. Status pembayaran menjadi Diterima.",
      pembayaran: updatedRows[0],
      simulasi: true,
    });
  } catch (error) {
    console.error("Simulasi pembayaran error:", error);

    return Response.json(
      { message: "Gagal menjalankan simulasi pembayaran." },
      { status: 500 }
    );
  }
}
