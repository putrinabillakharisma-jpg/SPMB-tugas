
import pool from "@/lib/db";
import { jwtVerify } from "jose";

// Memeriksa session login calon siswa
async function getCalonSiswa(request) {
  const cookieHeader = request.headers.get("cookie") || "";

  const sessionCookie = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("spmb_session="));

  if (!sessionCookie) {
    return null;
  }

  const token = sessionCookie.slice("spmb_session=".length);
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
      !/^\d+$/.test(payload.sub)
    ) {
      return null;
    }

    return { id: payload.sub };
  } catch {
    return null;
  }
}

// GET: mengambil data diri calon siswa yang sedang login
export async function GET(request) {
  try {
    const session = await getCalonSiswa(request);

    if (!session) {
      return Response.json(
        { message: "Silakan login sebagai calon siswa." },
        { status: 401 }
      );
    }

    const [rows] = await pool.execute(
      `SELECT
         cs.id,
         cs.nama,
         cs.nisn,
         cs.whatsapp AS hp,
         bs.nik,
         bs.tempat_lahir AS tempatLahir,
         bs.tanggal_lahir AS tanggalLahir,
         bs.jenis_kelamin AS jenisKelamin,
         bs.agama,
         bs.foto,
         bs.sekolah,
         bs.tahun_lulus AS tahunLulus,
         bs.email,
         bs.alamat,
         bs.ayah,
         bs.ibu,
         bs.pekerjaan,
         bs.hp_ortu AS hpOrtu
       FROM calon_siswa cs
       LEFT JOIN biodata_siswa bs
         ON bs.calon_siswa_id = cs.id
       WHERE cs.id = ?
       LIMIT 1`,
      [session.id]
    );

    if (rows.length === 0) {
      return Response.json(
        { message: "Akun calon siswa tidak ditemukan." },
        { status: 404 }
      );
    }

    return Response.json({
      message: "Data diri berhasil diambil.",
      data: rows[0],
    });
  } catch (error) {
    console.error("GET biodata error:", error);

    return Response.json(
      { message: "Gagal mengambil data diri." },
      { status: 500 }
    );
  }
}

// POST: menyimpan atau memperbarui data diri
export async function POST(request) {
  let connection;

  try {
    const session = await getCalonSiswa(request);

    if (!session) {
      return Response.json(
        { message: "Silakan login sebagai calon siswa." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const textValue = (value) =>
      typeof value === "string" ? value.trim() : "";

    const nama = textValue(body.nama);
    const nisn = textValue(body.nisn);
    const hp = textValue(body.hp);
    const nik = textValue(body.nik);
    const tempatLahir = textValue(body.tempatLahir);
    const tanggalLahir = textValue(body.tanggalLahir);
    const jenisKelamin = textValue(body.jenisKelamin);
    const agama = textValue(body.agama);
    const foto = textValue(body.foto);
    const sekolah = textValue(body.sekolah);
    const tahunLulus = textValue(body.tahunLulus);
    const email = textValue(body.email).toLowerCase();
    const alamat = textValue(body.alamat);
    const ayah = textValue(body.ayah);
    const ibu = textValue(body.ibu);
    const pekerjaan = textValue(body.pekerjaan);
    const hpOrtu = textValue(body.hpOrtu);

    if (!nama || !nisn || !hp) {
      return Response.json(
        {
          message: "Nama, NISN, dan nomor WhatsApp wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (!/^\d{10}$/.test(nisn)) {
      return Response.json(
        { message: "NISN harus terdiri dari 10 angka." },
        { status: 400 }
      );
    }

    if (nik && !/^\d{16}$/.test(nik)) {
      return Response.json(
        { message: "NIK harus terdiri dari 16 angka." },
        { status: 400 }
      );
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json(
        { message: "Format email tidak valid." },
        { status: 400 }
      );
    }

    if (
      jenisKelamin &&
      !["Laki-laki", "Perempuan"].includes(jenisKelamin)
    ) {
      return Response.json(
        { message: "Jenis kelamin tidak valid." },
        { status: 400 }
      );
    }

    if (
      tanggalLahir &&
      !/^\d{4}-\d{2}-\d{2}$/.test(tanggalLahir)
    ) {
      return Response.json(
        { message: "Format tanggal lahir tidak valid." },
        { status: 400 }
      );
    }

    if (tahunLulus && !/^\d{4}$/.test(tahunLulus)) {
      return Response.json(
        { message: "Tahun lulus harus terdiri dari 4 angka." },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Pastikan NISN sesuai dengan akun yang sedang login.
    const [accounts] = await connection.execute(
      `SELECT id, nisn
       FROM calon_siswa
       WHERE id = ?
       LIMIT 1`,
      [session.id]
    );

    if (
      accounts.length === 0 ||
      accounts[0].nisn !== nisn
    ) {
      await connection.rollback();

      return Response.json(
        {
          message:
            "NISN tidak sesuai dengan akun yang sedang login.",
        },
        { status: 400 }
      );
    }

    // Perbarui nama dan WhatsApp pada akun calon siswa.
    await connection.execute(
      `UPDATE calon_siswa
       SET nama = ?, whatsapp = ?
       WHERE id = ?`,
      [nama, hp, session.id]
    );

    // Simpan biodata baru atau perbarui biodata yang sudah ada.
    await connection.execute(
      `INSERT INTO biodata_siswa (
         calon_siswa_id,
         nik,
         tempat_lahir,
         tanggal_lahir,
         jenis_kelamin,
         agama,
         foto,
         sekolah,
         tahun_lulus,
         email,
         alamat,
         ayah,
         ibu,
         pekerjaan,
         hp_ortu
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         nik = VALUES(nik),
         tempat_lahir = VALUES(tempat_lahir),
         tanggal_lahir = VALUES(tanggal_lahir),
         jenis_kelamin = VALUES(jenis_kelamin),
         agama = VALUES(agama),
         foto = VALUES(foto),
         sekolah = VALUES(sekolah),
         tahun_lulus = VALUES(tahun_lulus),
         email = VALUES(email),
         alamat = VALUES(alamat),
         ayah = VALUES(ayah),
         ibu = VALUES(ibu),
         pekerjaan = VALUES(pekerjaan),
         hp_ortu = VALUES(hp_ortu)`,
      [
        session.id,
        nik || null,
        tempatLahir || null,
        tanggalLahir || null,
        jenisKelamin || null,
        agama || null,
        foto || null,
        sekolah || null,
        tahunLulus || null,
        email || null,
        alamat || null,
        ayah || null,
        ibu || null,
        pekerjaan || null,
        hpOrtu || null,
      ]
    );

    await connection.commit();

    return Response.json({
      message: "Data diri berhasil disimpan.",
    });
  } catch (error) {
    if (connection) {
      await connection.rollback().catch(() => {});
    }

    console.error("POST biodata error:", error);

    return Response.json(
      { message: "Gagal menyimpan data diri ke database." },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
