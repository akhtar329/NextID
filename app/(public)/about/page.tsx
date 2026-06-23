// app/(public)/about/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Users, 
  Award, 
  GraduationCap, 
  BookOpen,
  TrendingUp,
  Eye,
  Clock,
  CheckCircle,
  Mail,
  Phone,
  Globe,
  ExternalLink
} from 'lucide-react';

// ==================== METADATA ====================
export const metadata: Metadata = {
  title: 'About Us | NextID.pk - Pakistan\'s Leading Education Platform',
  description: 'Learn about NextID.pk - Pakistan\'s trusted education platform for admissions, results, scholarships, jobs, and educational news. Our mission is to empower students.',
  keywords: 'about us, education platform Pakistan, NextID.pk, student resources, education news Pakistan',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://www.nextid.pk/about',
  },
  openGraph: {
    title: 'About NextID.pk - Pakistan\'s Education Platform',
    description: 'Empowering students with admissions, results, scholarships, jobs, and educational news.',
    url: 'https://www.nextid.pk/about',
    siteName: 'NextID.pk',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About NextID.pk',
    description: 'Pakistan\'s trusted education platform for students.',
    images: ['/og-image.png'],
  },
};

// ==================== DATA ====================
const STATS = [
  { icon: GraduationCap, value: '50,000+', label: 'Students Served', color: 'from-blue-500 to-blue-600' },
  { icon: BookOpen, value: '1,000+', label: 'Educational Resources', color: 'from-green-500 to-green-600' },
  { icon: TrendingUp, value: '98%', label: 'User Satisfaction', color: 'from-purple-500 to-purple-600' },
  { icon: Eye, value: '5M+', label: 'Monthly Views', color: 'from-orange-500 to-orange-600' },
];

const SERVICES = [
  {
    icon: GraduationCap,
    title: 'Admissions',
    description: 'Find latest university and college admissions across Pakistan.',
    link: '/admissions',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Award,
    title: 'Results',
    description: 'Check board and university results online quickly.',
    link: '/results',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: BookOpen,
    title: 'Scholarships',
    description: 'Discover fully funded and partial scholarships for Pakistani students.',
    link: '/scholarships',
    color: 'bg-yellow-50 text-yellow-600',
  },
  {
    icon: Users,
    title: 'Jobs',
    description: 'Find education, IT, and management job opportunities.',
    link: '/jobs',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    icon: Clock,
    title: 'Date Sheets',
    description: 'View and download exam schedules for all boards and universities.',
    link: '/date-sheets',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: TrendingUp,
    title: 'News & Updates',
    description: 'Stay informed with the latest educational news in Pakistan.',
    link: '/news',
    color: 'bg-red-50 text-red-600',
  },
];

const TEAM_MEMBERS = [
  {
    name: 'Pervez Akhtar',
    role: 'Founder & CEO',
    bio: 'Education enthusiast with 15+ years of experience in educational technology.',
    initials: 'PA',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    name: 'Rabail',
    role: 'Chief Operating Officer (COO)',
    bio: 'Driving operational excellence and scaling NextID.pk\'s impact across Pakistan\'s education sector.',
    initials: 'R',
    color: 'from-pink-500 to-rose-500',
  },
  {
    name: 'Fatima',
    role: 'Student Success Manager',
    bio: 'Dedicated to helping students find the right educational opportunities and supporting them throughout their journey.',
    initials: 'F',
    color: 'from-emerald-500 to-teal-500',
  },
];

const VALUES = [
  {
    icon: Users,
    title: 'Student First',
    description: 'Every decision we make is centered around the needs of students.',
  },
  {
    icon: CheckCircle,
    title: 'Trust & Transparency',
    description: 'We provide accurate, verified information from official sources.',
  },
  {
    icon: TrendingUp,
    title: 'Excellence',
    description: 'We strive for excellence in everything we do for our users.',
  },
  {
    icon: Globe,
    title: 'Accessibility',
    description: 'Making educational resources accessible to every Pakistani student.',
  },
];

// ==================== COMPONENTS ====================

function AboutHero() {
  return (
    <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      </div>
      
      <div className="relative container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <GraduationCap className="w-4 h-4" />
            <span className="text-sm font-medium">About NextID.pk</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Empowering Pakistan&apos;s <br />
            <span className="text-yellow-300">Educational Future</span>
          </h1>
          
          <p className="text-xl text-indigo-100 max-w-3xl mx-auto leading-relaxed">
            NextID.pk is Pakistan&apos;s leading educational platform, helping students discover 
            admissions, results, scholarships, jobs, and educational news — all in one place.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatsSection() {
  return (
    <div className="container mx-auto px-4 -mt-10 relative z-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {STATS.map((stat, index) => (
          <div 
            key={index}
            className="bg-white rounded-2xl shadow-xl p-6 text-center hover:shadow-2xl transition-shadow duration-300"
          >
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-3`}>
              <stat.icon className="w-7 h-7 text-white" />
            </div>
            <div className="text-2xl md:text-3xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MissionSection() {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Award className="w-4 h-4" />
            Our Mission
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Connecting Students with <br />
            <span className="text-indigo-600">Educational Opportunities</span>
          </h2>
          
          <p className="text-lg text-gray-600 leading-relaxed mb-6">
            At NextID.pk, we believe that every Pakistani student deserves access to 
            quality educational information. Our platform brings together admissions, 
            results, scholarships, jobs, and educational news to help students make 
            informed decisions about their future.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-800">Verified Information</p>
                <p className="text-sm text-gray-500">We source information from official educational boards and institutions.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-800">Updated Daily</p>
                <p className="text-sm text-gray-500">Our team works around the clock to keep information current and accurate.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-800">Free for All</p>
                <p className="text-sm text-gray-500">We believe education should be accessible to everyone, without barriers.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <div className="aspect-[4/3] bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <div className="text-center text-white p-8">
                <GraduationCap className="w-24 h-24 mx-auto mb-4 opacity-80" />
                <h3 className="text-3xl font-bold">NextID.pk</h3>
                <p className="text-indigo-200">Empowering Students Since 2022</p>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-yellow-400 rounded-full opacity-20"></div>
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-pink-400 rounded-full opacity-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServicesSection() {
  return (
    <div className="bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <BookOpen className="w-4 h-4" />
            What We Offer
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything Students Need in One Place
          </h2>
          <p className="text-lg text-gray-600">
            From admissions to job opportunities, we provide comprehensive educational resources.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((service, index) => (
            <Link
              key={index}
              href={service.link}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className={`w-12 h-12 rounded-xl ${service.color} flex items-center justify-center mb-4`}>
                <service.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition">
                {service.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {service.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function ValuesSection() {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Users className="w-4 h-4" />
          Our Values
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          What Drives Us Forward
        </h2>
        <p className="text-lg text-gray-600">
          These core values guide everything we do at NextID.pk.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {VALUES.map((value, index) => (
          <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 text-center">
            <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <value.icon className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{value.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{value.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamSection() {
  return (
    <div className="bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Users className="w-4 h-4" />
            Our Team
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Meet the People Behind NextID.pk
          </h2>
          <p className="text-lg text-gray-600">
            Passionate professionals dedicated to empowering Pakistani students.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {TEAM_MEMBERS.map((member, index) => (
            <div 
              key={index} 
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 text-center group"
            >
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <span className="text-2xl font-bold text-white">
                  {member.initials}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
              <p className={`text-sm font-medium mb-2 ${member.role === 'Chief Operating Officer (COO)' ? 'text-pink-600' : 'text-indigo-600'}`}>
                {member.role}
              </p>
              <p className="text-sm text-gray-500 leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContactCTA() {
  return (
    <div className="container mx-auto px-4 pb-20">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">Have Questions?</h2>
            <p className="text-indigo-100 text-lg leading-relaxed mb-4">
              We&apos;re here to help you navigate your educational journey. 
              Reach out to us anytime.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition"
              >
                Contact Us
                <ExternalLink className="w-4 h-4" />
              </Link>
              <Link
                href="/faq"
                className="inline-flex items-center gap-2 bg-white/20 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition"
              >
                Visit FAQ
              </Link>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <Mail className="w-5 h-5 mb-2" />
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-indigo-200">support@nextid.pk</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <Phone className="w-5 h-5 mb-2" />
              <p className="text-sm font-medium">Phone</p>
              <p className="text-sm text-indigo-200">+92 342 5537329</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN PAGE ====================
export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <AboutHero />
      <StatsSection />
      <MissionSection />
      <ServicesSection />
      <ValuesSection />
      <TeamSection />
      <ContactCTA />
    </main>
  );
}