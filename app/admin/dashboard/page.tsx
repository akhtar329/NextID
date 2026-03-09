// app/admin/dashboard/page.tsx
"use client";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Welcome to Admin Panel!</h2>
        
        <div className="mb-4 p-4 bg-green-50 rounded-lg">
          <p className="text-green-700">✅ You have accessed the dashboard!</p>
        </div>
        
        <div className="space-y-4">
          <p>If you can see this page, login and redirect are working.</p>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-bold mb-2">Next Steps:</h3>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Login successful</li>
              <li>Redirect successful</li>
              <li>Session can be added back later</li>
            </ol>
          </div>
          
          <button
            onClick={() => {
              // Clear everything and go back to login
              localStorage.clear();
              window.location.href = "/login";
            }}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear & Go to Login
          </button>
        </div>
      </div>
    </div>
  );
}