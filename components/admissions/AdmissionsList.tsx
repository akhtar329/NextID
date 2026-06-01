'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

// ✅ Add type definitions
interface AdmissionsSidebarProps {
  stats: {
    total?: number;
    open?: number;
    closed?: number;
    expected?: number;
  };
  filters: {
    year?: string;
    status?: string;
    instituteId?: number;
  };
  createUrl: (params: Record<string, string>) => string;
}

export default function AdmissionsSidebar({ stats, filters, createUrl }: AdmissionsSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentYear = filters.year || searchParams.get('year') || '';
  const currentStatus = filters.status || searchParams.get('status') || '';

  const years = [2024, 2025, 2026, 2027];
  const statuses = [
    { value: 'Open', label: 'Open Admissions' },
    { value: 'Closed', label: 'Closed Admissions' },
    { value: 'Expected', label: 'Expected Admissions' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="font-semibold text-lg mb-4 pb-2 border-b">Filters</h3>
      
      {/* Year Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
        <div className="space-y-2">
          <Link
            href={createUrl({ ...(currentYear ? {} : { year: '' }) })}
            className={`block px-3 py-2 text-sm rounded-md ${!currentYear ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            All Years
          </Link>
          {years.map((year) => (
            <Link
              key={year}
              href={createUrl({ year: year.toString() })}
              className={`block px-3 py-2 text-sm rounded-md ${currentYear === year.toString() ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {year}
              {stats && (
                <span className="float-right text-xs">
                  {stats.total}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Status Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
        <div className="space-y-2">
          <Link
            href={createUrl({ ...(currentStatus ? {} : { status: '' }) })}
            className={`block px-3 py-2 text-sm rounded-md ${!currentStatus ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            All Status
          </Link>
          {statuses.map((status) => (
            <Link
              key={status.value}
              href={createUrl({ status: status.value })}
              className={`block px-3 py-2 text-sm rounded-md ${currentStatus === status.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {status.label}
             {stats && stats[status.value.toLowerCase() as keyof typeof stats] !== undefined && 
 (stats[status.value.toLowerCase() as keyof typeof stats] as number) > 0 && (
  <span className="float-right text-xs">
    ({stats[status.value.toLowerCase() as keyof typeof stats]})
  </span>
)}
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Admissions:</span>
              <span className="font-semibold">{stats.total || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-600">Open:</span>
              <span className="font-semibold">{stats.open || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600">Closed:</span>
              <span className="font-semibold">{stats.closed || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-600">Expected:</span>
              <span className="font-semibold">{stats.expected || 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}