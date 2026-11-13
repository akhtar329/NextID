
import React from "react";

export type Column<T> = {
  header: string;
  accessor: keyof T;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
};

type Props<T> = {
  columns: Column<T>[];
  data: T[];
};

export default function Table<T extends { id: number }>({
  columns,
  data,
}: Props<T>) {
  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            {columns.map((col, index) => (
              <th
                key={`${String(col.accessor)}-${index}`}
                scope="col"
                className="px-4 py-3 font-semibold text-gray-700"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row) => (
            <tr key={row.id} className="border-t hover:bg-gray-50">
              {columns.map((col, index) => {
                const value = row[col.accessor];

                return (
                  <td
                    key={`${String(col.accessor)}-${index}`}
                    className="px-4 py-3"
                  >
                    {col.render
                      ? col.render(value, row)
                      : (value as React.ReactNode)}
                  </td>
                );
              })}
            </tr>
          ))}

          {data.length === 0 && (
            <tr>
              <td
                colSpan={Math.max(columns.length, 1)}
                className="text-center py-6 text-gray-500"
              >
                No data found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
