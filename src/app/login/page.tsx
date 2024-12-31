import GoogleLoginButton from "@/app/login/GoogleLoginButton";
import Image from "next/image";
import SiteLogo from "@/app/host/dashboard/sitelogo.svg";

export default async function LoginPage(props: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const searchParams = await props.searchParams;
  const redirectTo = searchParams.redirect;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Section - Hero/Branding */}
      <div className="md:w-1/2 bg-gradient-to-br from-indigo-600 to-blue-500 p-8 flex flex-col justify-center items-center text-white">
        <div className="max-w-md text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Welcome to Kahoots Portal
          </h1>
          <p className="text-lg md:text-xl opacity-90 mb-8">
            Create, share, and participate in interactive quizzes with real-time
            results
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="text-2xl font-bold mb-1">Easy</div>
              <div className="text-sm opacity-75">to use</div>
            </div>
            <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="text-2xl font-bold mb-1">Real-time</div>
              <div className="text-sm opacity-75">results</div>
            </div>
            <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="text-2xl font-bold mb-1">Fun</div>
              <div className="text-sm opacity-75">interactive</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Login */}
      <div className="md:w-1/2 bg-gray-50 p-8 flex flex-col justify-center items-center">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-blue-500 rounded-xl rotate-6"></div>
              <div className="absolute inset-0 bg-indigo-600 rounded-xl rotate-3"></div>
              <div className="absolute inset-0 bg-white rounded-xl flex items-center justify-center">
                <Image
                  priority
                  src={SiteLogo}
                  alt="Kahoot Portal"
                  className="w-12 h-12"
                />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Sign in to get started
            </h2>
            <p className="text-gray-600 mb-8">
              Use your Google account to sign in securely
            </p>
          </div>
          <GoogleLoginButton redirectTo={redirectTo} />
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              By signing in, you agree to our Terms of Service and Privacy
              Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
