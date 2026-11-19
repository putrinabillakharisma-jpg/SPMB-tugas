
import { jwtVerify } from "jose";

export async function getCalonSiswa(request) {
  try {
    const cookieHeader =
      request.headers.get("cookie") || "";

    const sessionCookie = cookieHeader
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith("spmb_session="));

    if (!sessionCookie) {
      return null;
    }

    const token = sessionCookie.slice(
      "spmb_session=".length
    );

    const secret = process.env.SESSION_SECRET;

    if (!secret || secret.length < 32) {
      throw new Error("SESSION_SECRET tidak valid.");
    }

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

    return {
      id: Number(payload.sub),
      nama: payload.nama,
      role: payload.role,
    };

  } catch (error) {
    console.error("Session calon siswa:", error);
    return null;
  }
}
