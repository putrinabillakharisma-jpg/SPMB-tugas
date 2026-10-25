
import pool from "./lib/db.js";
import bcrypt from "bcryptjs";

async function createAdmin() {
  try {
    // Data akun admin SPMB
    const nama = "Admin SPMB";
    const email = "admin@spmb.com";
    const password = "AdminSPMB2026!";

    // Periksa apakah email sudah terdaftar
    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      console.log("Email admin sudah terdaftar.");
      return;
    }

    // Hash password sebelum disimpan ke database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan akun admin ke database
    await pool.execute(
      `INSERT INTO users
       (nama, email, password, role, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [nama, email, hashedPassword, "admin"]
    );

    console.log("Akun admin berhasil dibuat!");
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("Role: admin");
  } catch (error) {
    console.error("Gagal membuat akun admin:", error.message);
  } finally {
    await pool.end();
  }
}

createAdmin();
