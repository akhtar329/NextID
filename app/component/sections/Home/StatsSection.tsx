// app/component/sections/StatsSection.tsx
// ✅ Server Component - Already optimized

const StatsSection = () => {
  const stats = [
    {
      id: 1,
      number: "500+",
      label: "Schools Listed",
      description: "Government & Private Schools",
      icon: "🏫",
      color: "from-blue-500 to-blue-600"
    },
    {
      id: 2,
      number: "300+",
      label: "Colleges",
      description: "All boards including FBISE, BISE",
      icon: "🏛️",
      color: "from-green-500 to-green-600"
    },
    {
      id: 3,
      number: "50+",
      label: "Universities",
      description: "Recognized by HEC",
      icon: "🎓",
      color: "from-purple-500 to-purple-600"
    },
    {
      id: 4,
      number: "10,000+",
      label: "Active Users",
      description: "Students & Parents",
      icon: "👨‍👩‍👧‍👦",
      color: "from-orange-500 to-orange-600"
    },
    {
      id: 5,
      number: "95%",
      label: "Accuracy Rate",
      description: "Verified Information",
      icon: "✅",
      color: "from-teal-500 to-teal-600"
    },
    {
      id: 6,
      number: "24/7",
      label: "Support Available",
      description: "Education Counseling",
      icon: "🕒",
      color: "from-red-500 to-red-600"
    }
  ];

  const achievements = [
    { number: "5+", label: "Years Experience" },
    { number: "15+", label: "Cities Covered" },
    { number: "100K+", label: "Monthly Visits" },
    { number: "98%", label: "Satisfaction Rate" }
  ];

  const cities = [
    { name: "Karachi", institutions: "250+", percentage: 35, color: "blue", icon: "🏙️" },
    { name: "Lahore", institutions: "180+", percentage: 25, color: "green", icon: "🌆" },
    { name: "Islamabad", institutions: "120+", percentage: 20, color: "purple", icon: "🏛️" },
    { name: "Other Cities", institutions: "150+", percentage: 20, color: "orange", icon: "🏙️" }
  ];

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-block mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs md:text-sm font-semibold px-3 md:px-4 py-1 rounded-full">
              📊 Our Impact
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
            Pakistan's Most Trusted Educational Platform
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Join thousands of students and parents who rely on NextID for accurate 
            educational information and resources
          </p>
        </div>

        {/* Main Stats Grid - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mb-12 md:mb-16">
          {stats.map((stat) => (
            <div 
              key={stat.id}
              className="bg-white rounded-2xl shadow-lg p-5 md:p-6 lg:p-8 hover:shadow-xl transition-shadow duration-300 border border-gray-100 group"
            >
              <div className="flex items-start justify-between mb-4 md:mb-6">
                <div className={`w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-xl md:text-2xl">{stat.icon}</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">{stat.number}</div>
                  <div className="text-[10px] md:text-xs text-gray-500 mt-1">Live Count</div>
                </div>
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-1 md:mb-2">{stat.label}</h3>
              <p className="text-sm md:text-base text-gray-600">{stat.description}</p>
              <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-100">
                <div className="text-xs md:text-sm text-gray-500 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  Updated daily
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Achievement Bar - Responsive */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 md:p-8 mb-12 md:mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {achievements.map((achievement, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 md:mb-2">
                  {achievement.number}
                </div>
                <div className="text-xs md:text-sm text-blue-100 font-medium">
                  {achievement.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Stats - Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 mb-12 md:mb-16">
          
          {/* Left Column - Growth Stats */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">📈</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">Platform Growth</h3>
            </div>
            
            <div className="space-y-5 md:space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm md:text-base text-gray-700">User Growth (Monthly)</span>
                  <span className="font-semibold text-green-600 text-sm md:text-base">+25%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full transition-all duration-1000" style={{ width: '85%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm md:text-base text-gray-700">Institution Listings</span>
                  <span className="font-semibold text-blue-600 text-sm md:text-base">+15%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full transition-all duration-1000" style={{ width: '75%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm md:text-base text-gray-700">Content Accuracy</span>
                  <span className="font-semibold text-purple-600 text-sm md:text-base">98%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full transition-all duration-1000" style={{ width: '98%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Regional Coverage */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">🗺️</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">Regional Coverage</h3>
            </div>
            
            <div className="space-y-3 md:space-y-4">
              {cities.map((city) => (
                <div 
                  key={city.name}
                  className={`flex items-center justify-between p-3 md:p-4 bg-${city.color}-50 rounded-xl hover:shadow-md transition-shadow cursor-pointer`}
                >
                  <div className="flex items-center flex-1">
                    <div className={`w-8 h-8 md:w-10 md:h-10 bg-${city.color}-100 rounded-lg flex items-center justify-center mr-3`}>
                      <span className={`text-${city.color}-600 text-sm md:text-base`}>{city.icon}</span>
                    </div>
                    <div>
                      <div className="font-medium text-sm md:text-base text-gray-900">{city.name}</div>
                      <div className="text-xs md:text-sm text-gray-500">{city.institutions} Institutions</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 text-sm md:text-base">{city.percentage}%</div>
                    <div className="text-xs text-gray-500">Coverage</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trust Badges - Responsive */}
        <div className="pt-8 md:pt-12 border-t border-gray-200">
          <h3 className="text-xl md:text-2xl font-bold text-center text-gray-900 mb-8 md:mb-10">
            Trusted by Educational Communities
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            <div className="text-center p-4 md:p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
              <div className="text-2xl md:text-3xl mb-2 md:mb-3 group-hover:scale-110 transition-transform">🎯</div>
              <div className="font-semibold text-gray-900 text-sm md:text-base">100% Verified</div>
              <div className="text-xs md:text-sm text-gray-600 mt-1">Information</div>
            </div>
            <div className="text-center p-4 md:p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
              <div className="text-2xl md:text-3xl mb-2 md:mb-3 group-hover:scale-110 transition-transform">🔒</div>
              <div className="font-semibold text-gray-900 text-sm md:text-base">Data Security</div>
              <div className="text-xs md:text-sm text-gray-600 mt-1">Protected</div>
            </div>
            <div className="text-center p-4 md:p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
              <div className="text-2xl md:text-3xl mb-2 md:mb-3 group-hover:scale-110 transition-transform">📈</div>
              <div className="font-semibold text-gray-900 text-sm md:text-base">Daily Updates</div>
              <div className="text-xs md:text-sm text-gray-600 mt-1">Real-time Info</div>
            </div>
            <div className="text-center p-4 md:p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
              <div className="text-2xl md:text-3xl mb-2 md:mb-3 group-hover:scale-110 transition-transform">💬</div>
              <div className="font-semibold text-gray-900 text-sm md:text-base">24/7 Support</div>
              <div className="text-xs md:text-sm text-gray-600 mt-1">Help Available</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;