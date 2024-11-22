import { signInWithGoogle } from "@/app/login/actions";
import OneTapComponent from "@/app/login/OneTapComponent";
import GoogleIcon from "@/app/components/icons/GoogleIcon";
export default async function LoginPage(props: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const searchParams = await props.searchParams;
  const redirectTo = searchParams.redirect;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in with Google
          </h2>
        </div>
        <div>
          <form action={signInWithGoogle.bind(null, redirectTo)}>
            <button
              type="submit"
              className="group relative w-full flex justify-center items-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition duration-150 ease-in-out"
            >
              <GoogleIcon className="mr-4 w-8 h-8" />
              Sign in with Google
            </button>
          </form>
          <OneTapComponent redirectTo={redirectTo} />
        </div>
      </div>
    </div>
  );
}
