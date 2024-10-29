interface GenerateJWTParams {
  userId: string;
  name: string;
  avatar: string;
  email: string | null;
  moderator: boolean;
  room?: string;
}

interface GenerateJWTResponse {
  token: string;
}

export const generateJWT = async ({
  userId,
  name,
  avatar,
  email,
  moderator,
  room,
}: GenerateJWTParams): Promise<string> => {
  try {
    const response = await fetch("/api/generate-jwt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        name,
        avatar,
        email,
        moderator,
        room,
      }),
    });

    if (!response.ok) {
      // Extract error message from the response if available
      const errorData = await response.json();
      const errorMessage = errorData.error || "Failed to generate JWT";
      throw new Error(errorMessage);
    }

    const data: GenerateJWTResponse = await response.json();
    return data.token;
  } catch (error) {
    console.error("Error generating JWT:", error);
    throw new Error("Failed to generate JWT");
  }
};
