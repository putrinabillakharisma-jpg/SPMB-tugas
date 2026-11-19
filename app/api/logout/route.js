
export async function POST() {
  const response = Response.json({
    success: true,
    message: "Logout berhasil.",
  });

  response.headers.append(
    "Set-Cookie",
    "spmb_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0"
  );

  return response;
}
