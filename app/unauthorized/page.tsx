import Link from "next/link";
import { ShieldOff } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
          <ShieldOff className="h-10 w-10 text-red-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Access Denied
        </h1>
        
        <p className="text-gray-600 mb-8">
          You don't have permission to access this page. 
          Please contact your administrator if you believe this is an error.
        </p>
        
        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="inline-block w-full bg-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-200"
          >
            Go to Dashboard
          </Link>
          
          <Link
            href="/"
            className="inline-block w-full border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg hover:bg-gray-50 transition duration-200"
          >
            Back to Home
          </Link>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          Need help?{" "}
          <Link href="/contact" className="text-blue-600 hover:text-blue-500">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
