import { useAuth } from "@clerk/clerk-react";

export function VerifyEmail() {
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="w-full max-w-[480px] p-6">
        <div className="mb-8 text-center">
          <img
            src="https://cdn.prod.website-files.com/669ed0783d780b8512f370a5/67e0b1dc686c0fa648631187_Color%201%20(on%20white).png"
            alt="careCycle"
            className="h-8 mx-auto mb-6"
          />
          <h1 className="text-2xl font-semibold text-gray-900">
            Verify your email
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Please check your email to continue
          </p>
        </div>
      </div>
    </div>
  );
}
