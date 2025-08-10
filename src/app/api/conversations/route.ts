import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get conversations with latest query for preview
    const conversations = await db.conversation.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        queries: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            prompt: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            queries: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Conversations API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const conversation = await db.conversation.create({
      data: {
        title,
        userId: session.user.id,
      },
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Create conversation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
