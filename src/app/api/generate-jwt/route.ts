"use server";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// Define the expected request body
interface GenerateJWTRequestBody {
  userId: string;
  name: string;
  avatar: string;
  email: string;
  moderator: boolean;
  room?: string; // Optional: Specify room if needed
}

// Define the JWT payload structure
interface JWTPayload {
  aud: string;
  context: {
    user: {
      id: string;
      name: string;
      email: string;
      moderator: string;
    };
    features: {
      livestreaming: string;
      "outbound-call": string;
      transcription: string;
      recording: string;
    };
    room: {
      regex: boolean;
    };
  };
  room: string;
  sub: string;
}

export async function POST(request: Request) {
  try {
    const body: GenerateJWTRequestBody = await request.json();

    // Validate required fields
    const { userId, name, avatar, email, moderator, room } = body;
    if (!userId || !name || !avatar || !email || moderator === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Read the private key from environment variable
    const privateKeyBase64 = process.env.JITSI_PRIVATE_KEY || "";
    const privateKey = Buffer.from(privateKeyBase64, "base64").toString(
      "ascii"
    );

    if (!privateKey) {
      return NextResponse.json(
        { error: "Private key not configured" },
        { status: 500 }
      );
    }

    // Define JWT payload
    const payload: JWTPayload = {
      aud: "jitsi",
      context: {
        user: {
          id: userId,
          name,
          email,
          moderator: moderator.toString(),
        },
        features: {
          livestreaming: "false",
          "outbound-call": "false",
          transcription: "false",
          recording: "false",
        },
        room: {
          regex: false,
        },
      },
      room: room || "AGT Quiz Portal",
      sub: process.env.JITSI_SUBJECT?.split("/")[0] || "",
    };

    // Define JWT options
    const signOptions: jwt.SignOptions = {
      algorithm: "RS256",
      expiresIn: "1h",
      issuer: "chat",
      notBefore: 0,
      header: {
        alg: "RS256",
        kid: process.env.JITSI_SUBJECT || "",
      },
    };

    // Sign the JWT
    const token = jwt.sign(payload, privateKey, signOptions);

    // Return the JWT
    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error generating JWT:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
