import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-6">
          <AlertTriangle className="h-10 w-10 text-yellow-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Authentication Error
        </h1>
        
        <p className="text-gray-600 mb-8">
          Something went wrong during authentication. 
          Please try again or contact support if the problem persists.
        </p>
        
        <div className="space-y-4">
          <Link
            href="/login"
            className="inline-block w-full bg-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-200"
          >
            Try Again
          </Link>
        </div>
      </div>
    </div>
  );
}