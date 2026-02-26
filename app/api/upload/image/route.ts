import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "@/sanity/lib/client";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: "Invalid file type. Use JPG, PNG or WebP"
      }, { status: 400 });
    }

    // Validate file size — max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({
        success: false,
        error: "File too large. Max size is 5MB"
      }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const asset = await writeClient.assets.upload("image", buffer, {
      filename: file.name,
      contentType: file.type,
    });

    return NextResponse.json({
      success: true,
      url: asset.url,
      assetId: asset._id,
    });

  } catch (err) {
    console.error("[image upload]", err);
    return NextResponse.json({
      success: false,
      error: "Upload failed"
    }, { status: 500 });
  }
}