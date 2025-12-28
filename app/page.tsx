import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import Pricing from "@/components/Pricing";
import SignIn from "@/components/sign-in";
import UserMenu from "@/components/user/UserMenu";

import config from "@/config";
import { auth } from "@/lib/auth";

export default async function Home() {
  // In development, redirect directly to the app dashboard
  /*
  if (process.env.NODE_ENV === 'development') {
    redirect('/app');
  }
*/
  const session = await auth();
  const user = session?.user;
  return (
    <div className="flex flex-col">
      {/* Navigation Menu */}
      <nav className="bg-[var(--background)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left side - Logo and navigation links */}
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/icon-192.png"
                  alt="GenHub Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <span className="text-2xl font-bold text-gray-800">GenHub</span>
              </Link>
              <div className="flex space-x-6">
                <Link href="/" className="text-lg text-gray-600 hover:text-gray-900 link-hover">
                  Home
                </Link>
                <Link href="#pricing" className="text-lg text-gray-600 hover:text-gray-900 link-hover">
                  Pricing
                </Link>
                {user && (
                  <Link href="/app/" className="text-lg text-gray-600 hover:text-gray-900 link-hover">
                    App
                  </Link>
                )}
              </div>
            </div>

            {/* Right side - Auth buttons */}
            <div className="flex items-center gap-2">
              {user ? (
                <UserMenu />
              ) : (
                <div className="flex items-center">
                  <SignIn />
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Image
                src="/icon-192.png"
                alt="GenHub Logo"
                width={80}
                height={80}
                className="object-contain"
              />
            </div>
            <h1 className="text-4xl font-bold mb-2">{config.metadata.title}</h1>
            <p className="text-gray-600 mb-8">{config.metadata.description}</p>
          </div>

          <div className="flex flex-col gap-4 items-center">
            {!user ? (
              <>
              </>
            ) : (
              <Link
                href="/app/"
                className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-800 hover:bg-[var(--background)] hover:border-gray-400 font-semibold py-2.5 px-6 rounded-full "
              >
                Go to App
              </Link>
            )}
          </div>
        </div>
      </div>

      <Pricing />
    </div>
  );
}
