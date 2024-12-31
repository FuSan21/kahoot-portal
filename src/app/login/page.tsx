import GoogleLoginButton from "@/app/login/GoogleLoginButton";
import Image from "next/image";
import SiteLogo from "@/app/host/dashboard/sitelogo.svg";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function LoginPage(props: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const searchParams = await props.searchParams;
  const redirectTo = searchParams.redirect;

  return (
    <div className="h-full flex flex-col md:flex-row">
      {/* Left Section - Hero/Branding */}
      <div className="flex-1 md:w-1/2 bg-gradient-to-br from-primary to-primary/80 p-8 flex flex-col justify-center items-center text-white">
        <div className="max-w-md text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Welcome to Kahoots Portal
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8">
            Create, share, and participate in interactive quizzes with real-time
            results
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold mb-1">Easy</div>
                <div className="text-sm text-white/75">to use</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold mb-1">Real-time</div>
                <div className="text-sm text-white/75">results</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold mb-1">Fun</div>
                <div className="text-sm text-white/75">interactive</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Right Section - Login */}
      <div className="flex-1 md:w-1/2 bg-muted/50 p-8 flex flex-col justify-center items-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto relative">
              <div className="absolute inset-0 bg-primary rounded-xl rotate-6"></div>
              <div className="absolute inset-0 bg-primary/80 rounded-xl rotate-3"></div>
              <div className="absolute inset-0 bg-background rounded-xl flex items-center justify-center">
                <Image
                  priority
                  src={SiteLogo}
                  alt="Kahoot Portal"
                  className="w-12 h-12"
                />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl">Sign in to get started</CardTitle>
              <CardDescription>
                Use your Google account to sign in securely
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <GoogleLoginButton redirectTo={redirectTo} />
            <Separator />
            <p className="text-center text-sm text-muted-foreground">
              By signing in, you agree to our Terms of Service and Privacy
              Policy
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
