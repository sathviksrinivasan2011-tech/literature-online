import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

type GoogleProfile = {
  email?: string;
  name?: string;
  picture?: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!code || !clientId || !clientSecret) redirect("/?auth=google-failed");

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${appUrl}/api/auth/google/callback`,
      grant_type: "authorization_code"
    })
  });

  if (!tokenResponse.ok) redirect("/?auth=google-failed");
  const token = await tokenResponse.json() as { access_token?: string };
  if (!token.access_token) redirect("/?auth=google-failed");

  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { authorization: `Bearer ${token.access_token}` }
  });
  if (!profileResponse.ok) redirect("/?auth=google-failed");
  const profile = await profileResponse.json() as GoogleProfile;
  const saved = profile.email
    ? await prisma.profile.upsert({
      where: { email: profile.email },
      update: {
        nickname: profile.name || profile.email.split("@")[0],
        avatarUrl: profile.picture
      },
      create: {
        email: profile.email,
        nickname: profile.name || profile.email.split("@")[0],
        avatarUrl: profile.picture
      }
    })
    : null;

  cookies().set("literature_profile", JSON.stringify({
    id: saved?.id,
    name: saved?.nickname || profile.name,
    email: profile.email,
    avatarUrl: saved?.avatarUrl || profile.picture
  }), {
    httpOnly: false,
    sameSite: "lax",
    secure: appUrl.startsWith("https://"),
    path: "/",
    maxAge: 60 * 60 * 24 * 90
  });

  redirect("/");
}
