// app/component/sections/StatsSection.tsx
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

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Pakistan's Most Trusted Educational Platform
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of students and parents who rely on NextID for accurate 
            educational information and resources
          </p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {stats.map((stat) => (
            <div 
              key={stat.id}
              className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 border border-gray-100"
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-gray-900">{stat.number}</div>
                  <div className="text-sm text-gray-500 mt-1">Live Count</div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{stat.label}</h3>
              <p className="text-gray-600">{stat.description}</p>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="text-sm text-gray-500 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Updated daily
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Achievement Bar */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {achievement.number}
                </div>
                <div className="text-blue-100 font-medium">
                  {achievement.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Growth Stats */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Platform Growth</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">User Growth (Monthly)</span>
                  <span className="font-semibold text-green-600">+25%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">Institution Listings</span>
                  <span className="font-semibold text-blue-600">+15%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">Content Accuracy</span>
                  <span className="font-semibold text-purple-600">98%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '98%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Regional Coverage */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Regional Coverage</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-blue-600">🏙️</span>
                  </div>
                  <div>
                    <div className="font-medium">Karachi</div>
                    <div className="text-sm text-gray-500">250+ Institutions</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">35%</div>
                  <div className="text-sm text-gray-500">Coverage</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-green-600">🌆</span>
                  </div>
                  <div>
                    <div className="font-medium">Lahore</div>
                    <div className="text-sm text-gray-500">180+ Institutions</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">25%</div>
                  <div className="text-sm text-gray-500">Coverage</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-purple-600">🏛️</span>
                  </div>
                  <div>
                    <div className="font-medium">Islamabad</div>
                    <div className="text-sm text-gray-500">120+ Institutions</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">20%</div>
                  <div className="text-sm text-gray-500">Coverage</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-orange-600">🏙️</span>
                  </div>
                  <div>
                    <div className="font-medium">Other Cities</div>
                    <div className="text-sm text-gray-500">150+ Institutions</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">20%</div>
                  <div className="text-sm text-gray-500">Coverage</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 pt-12 border-t border-gray-200">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-10">
            Trusted by Educational Communities
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <div className="text-3xl mb-4">🎯</div>
              <div className="font-semibold text-gray-900">100% Verified</div>
              <div className="text-sm text-gray-600 mt-1">Information</div>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <div className="text-3xl mb-4">🔒</div>
              <div className="font-semibold text-gray-900">Data Security</div>
              <div className="text-sm text-gray-600 mt-1">Protected</div>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <div className="text-3xl mb-4">📈</div>
              <div className="font-semibold text-gray-900">Daily Updates</div>
              <div className="text-sm text-gray-600 mt-1">Real-time Info</div>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <div className="text-3xl mb-4">💬</div>
              <div className="font-semibold text-gray-900">24/7 Support</div>
              <div className="text-sm text-gray-600 mt-1">Help Available</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;