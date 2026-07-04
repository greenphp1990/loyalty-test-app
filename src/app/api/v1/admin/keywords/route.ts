import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { KeywordSeverity, KeywordStatus } from "@prisma/client";

// Guard helper to check admin role
async function checkAdminGuard() {
  const session = await getSessionUser();
  if (!session) return null;
  const adminRoles = ["SUPER_ADMIN", "FINANCE_ADMIN", "SUPPORT_ADMIN", "CONTENT_ADMIN"];
  if (!adminRoles.includes(session.role)) return null;
  return session;
}

// GET all blocked keywords
export async function GET() {
  try {
    const session = await checkAdminGuard();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keywords = await prisma.blockedKeyword.findMany({
      orderBy: { keyword: "asc" },
    });

    return NextResponse.json({ keywords }, { status: 200 });

  } catch (error) {
    console.error("❌ Admin GET keywords error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
  }
}

// POST create or enable a blocked keyword
export async function POST(request: Request) {
  try {
    const session = await checkAdminGuard();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { keyword, severity = "HIGH" } = body;

    if (!keyword || !keyword.trim()) {
      return NextResponse.json({ error: "Keyword is required." }, { status: 400 });
    }

    const cleanKeyword = keyword.toLowerCase().trim();
    const cleanSeverity = severity.toUpperCase() as KeywordSeverity;

    const newKeyword = await prisma.blockedKeyword.upsert({
      where: { keyword: cleanKeyword },
      update: {
        severity: cleanSeverity,
        status: KeywordStatus.ACTIVE,
      },
      create: {
        keyword: cleanKeyword,
        severity: cleanSeverity,
        status: KeywordStatus.ACTIVE,
      },
    });

    return NextResponse.json({
      message: "Blocked keyword saved successfully.",
      keyword: newKeyword,
    }, { status: 201 });

  } catch (error) {
    console.error("❌ Admin POST keyword error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
  }
}

// DELETE a blocked keyword (expects ?id=uuid query param)
export async function DELETE(request: Request) {
  try {
    const session = await checkAdminGuard();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing keyword ID." }, { status: 400 });
    }

    await prisma.blockedKeyword.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Blocked keyword removed successfully." }, { status: 200 });

  } catch (error) {
    console.error("❌ Admin DELETE keyword error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
  }
}
