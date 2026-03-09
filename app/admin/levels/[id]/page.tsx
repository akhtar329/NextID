// app/(admin)/admin/levels/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/app/lib/db';
import { levels, degrees } from '@/app/lib/schema';
import { eq, and, desc, count, inArray } from 'drizzle-orm';

export const metadata: Metadata = {
  title: 'Manage Levels | Admin Dashboard | NextID.pk',
  description: 'Create, edit, and manage educational levels',
};

interface LevelWithStats {
  id: number;
  name: string;
  slug: string;
  fullForm: string | null;
  displayOrder: number | null;
  status: boolean | null;
  createdAt: Date | null;
  degreesCount: number;
}

async function getLevelsWithStats(): Promise<LevelWithStats[]> {
  try {
    const allLevels = await db
      .select({
        id: levels.id,
        name: levels.name,
        slug: levels.slug,
        fullForm: levels.fullForm,
        displayOrder: levels.displayOrder,
        status: levels.status,
        createdAt: levels.createdAt,
      })
      .from(levels)
      .orderBy(levels.displayOrder, levels.name);

    const levelsWithStats = await Promise.all(
      allLevels.map(async (level) => {
        const degreesResult = await db
          .select({ count: count() })
          .from(degrees)
          .where(eq(degrees.levelId, level.id));

        const degreesCount = degreesResult[0]?.count || 0;

        return {
          ...level,
          degreesCount,
        };
      })
    );

    return levelsWithStats;
  } catch (error) {
    console.error('Error fetching levels:', error);
    return [];
  }
}

export default async function AdminLevelsPage() {
  const levels = await getLevelsWithStats();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Educational Levels</h1>
            <Link
              href="/admin/levels/create"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Add New Level
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-gray-900">{levels.length}</div>
              <div className="text-sm text-gray-600">Total Levels</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-green-600">
                {levels.filter(l => l.status === true).length}
              </div>
              <div className="text-sm text-gray-600">Active Levels</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-yellow-600">
                {levels.filter(l => l.status === false).length}
              </div>
              <div className="text-sm text-gray-600">Inactive Levels</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-purple-600">
                {levels.reduce((sum, l) => sum + l.degreesCount, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Degrees</div>
            </div>
          </div>

          {/* Levels Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Full Form
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Display Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Degrees
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {levels.map((level) => (
                  <tr key={level.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {level.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{level.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {level.fullForm || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {level.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {level.displayOrder || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {level.degreesCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {level.status ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {level.createdAt ? new Date(level.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/levels/${level.id}`}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this level?')) {
                            // Delete logic here
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}