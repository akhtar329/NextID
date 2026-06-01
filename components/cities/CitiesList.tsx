// /components/cities/CitiesList.tsx
import { CityWithStats } from '@/types/cities.types';

interface CitiesListProps {
  cities: CityWithStats[];
}

export function CitiesList({ cities }: CitiesListProps) {
  // Make sure cities is an array
  const citiesArray = Array.isArray(cities) ? cities : [];
  
  if (citiesArray.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No cities found</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Cities in Pakistan</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {citiesArray.map((city) => (
          <div key={city.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">{city.name}</h2>
            {city.province && (
              <p className="text-gray-600 mb-4">Province: {city.province}</p>
            )}
            <div className="flex gap-4 text-sm text-gray-500">
              <span>🏢 {city.institutesCount} Institutes</span>
              <span>📝 {city.admissionsCount} Admissions</span>
              <span>📰 {city.newsCount} News</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}