// app/(public)/faqs/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';

export const revalidate = 86400;
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions (FAQs) | NextID.pk - Education Portal Pakistan',
  description: 'Find answers to commonly asked questions about admissions, results, programs, universities, and education in Pakistan.',
  keywords: 'FAQs, frequently asked questions, education help, admissions help, results help, Pakistan education',
  alternates: {
    canonical: 'https://www.nextid.pk/faqs',
  },
  openGraph: {
    title: 'FAQs - Education Pakistan | NextID.pk',
    description: 'Get answers to all your education-related questions in one place.',
    images: ['/images/faqs-og.jpg'],
  },
};

interface FaqCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
}

interface FaqItem {
  id: number;
  category: string;
  question: string;
  answer: string;
}

const faqCategories: FaqCategory[] = [
  { id: 'admissions', name: 'Admissions', icon: '📝', count: 8 },
  { id: 'results', name: 'Results', icon: '📊', count: 6 },
  { id: 'programs', name: 'Programs', icon: '🎓', count: 5 },
  { id: 'universities', name: 'Universities', icon: '🏛️', count: 7 },
  { id: 'boards', name: 'Boards', icon: '📋', count: 4 },
  { id: 'general', name: 'General', icon: '❓', count: 6 },
];

const faqs: FaqItem[] = [
  {
    id: 1,
    category: 'admissions',
    question: 'When do admissions start in Pakistan?',
    answer: 'Admissions in Pakistan typically start in **July-August** for Fall semester and **December-January** for Spring semester. However, dates vary by university and program. Top universities like NUST, FAST, and LUMS usually announce admissions in March-April. We recommend checking individual university websites or our admissions section for exact dates.'
  },
  {
    id: 2,
    category: 'admissions',
    question: 'What is the admission process in Pakistan?',
    answer: 'The admission process generally involves:\n\n• Online application submission\n• Uploading educational documents\n• Entry test (for most universities)\n• Interview (for some programs)\n• Merit list announcement\n• Fee submission for confirmation\n\nSpecific requirements vary by university and program.'
  },
  {
    id: 3,
    category: 'admissions',
    question: 'What documents are required for admission?',
    answer: 'Commonly required documents include:\n\n• Matric/O-Level certificates\n• Intermediate/A-Level certificates\n• CNIC/B-Form copy\n• Passport-sized photographs\n• Domicile certificate\n• Entry test score card\n• Experience letters (if applicable)\n• Character certificate'
  },
  {
    id: 4,
    category: 'results',
    question: 'How can I check my result online?',
    answer: 'You can check your result by:\n\n1. Visiting the official board/university website\n2. Entering your roll number\n3. Selecting your exam year\n4. Clicking "Search" or "View Result"\n\nWe also provide direct links to result portals on our Results page.'
  },
  {
    id: 5,
    category: 'results',
    question: 'When are results announced?',
    answer: 'Results are typically announced 2-3 months after examinations:\n\n• Matric (SSC): August-September\n• Intermediate (HSSC): September-October\n• University results: Vary by institution\n• Supplementary exams: December-January'
  },
  {
    id: 6,
    category: 'results',
    question: 'What if I lose my roll number?',
    answer: 'If you lose your roll number:\n\n• Contact your school/college\n• Visit the board/university office with your documents\n• Check your old admit card\n• Use name-based search if available\n• Some boards offer roll number recovery through their portal'
  },
  {
    id: 7,
    category: 'programs',
    question: 'What are the most popular programs in Pakistan?',
    answer: 'Popular programs include:\n\n• **Engineering**: Civil, Mechanical, Electrical, Computer\n• **Medical**: MBBS, BDS, Pharmacy, Nursing\n• **Business**: BBA, MBA, Accounting\n• **Computer Science**: BS CS, Software Engineering\n• **Law**: LLB\n• **Education**: B.Ed, M.Ed\n• **Arts**: BA, MA English, Mass Communication'
  },
  {
    id: 8,
    category: 'programs',
    question: 'What is the duration of different programs?',
    answer: 'Program durations:\n\n• Matric (SSC): 2 years\n• Intermediate (HSSC): 2 years\n• Bachelor (BA/BSc): 2 years\n• BS (4-Year): 4 years\n• BBA: 4 years\n• MBBS: 5 years\n• BDS: 4 years\n• LLB: 3-5 years\n• MA/MSc: 2 years\n• MS/MPhil: 2 years\n• PhD: 3-5 years'
  },
  {
    id: 9,
    category: 'universities',
    question: 'Which are the top universities in Pakistan?',
    answer: 'Top universities include:\n\n• **NUST** (Islamabad)\n• **FAST** (Lahore, Karachi, Islamabad)\n• **LUMS** (Lahore)\n• **Punjab University** (Lahore)\n• **Karachi University** (Karachi)\n• **UET Lahore**\n• **COMSATS** (Multiple cities)\n• **IBA Karachi**\n• **Air University** (Islamabad)\n• **Quaid-e-Azam University** (Islamabad)'
  },
  {
    id: 10,
    category: 'universities',
    question: 'What is the difference between public and private universities?',
    answer: '**Public Universities:**\n• Government-funded\n• Lower fee structure\n• More competitive entry\n• Larger class sizes\n\n**Private Universities:**\n• Self-funded\n• Higher fees\n• Often better facilities\n• Smaller classes\n• More flexible schedules'
  },
  {
    id: 11,
    category: 'boards',
    question: 'What are the main education boards in Pakistan?',
    answer: 'Main education boards:\n\n• **FBISE** (Federal Board, Islamabad)\n• **BISE Lahore** (Punjab)\n• **BISE Karachi** (Sindh)\n• **BISE Peshawar** (KPK)\n• **BISE Quetta** (Balochistan)\n• **AKUEB** (Aga Khan University Board)\n\nEach board conducts exams and announces results for Matric and Intermediate.'
  },
  {
    id: 12,
    category: 'boards',
    question: 'How do I get my marksheet if I lose it?',
    answer: 'If you lose your marksheet:\n\n• Visit your respective board office\n• Submit an application for duplicate marksheet\n• Pay the prescribed fee\n• Provide your exam details (year, roll number)\n• Submit an affidavit if required\n\nThe process usually takes 2-4 weeks.'
  },
  {
    id: 13,
    category: 'general',
    question: 'Is NextID.pk free to use?',
    answer: 'Yes! **NextID.pk is completely free** for all users. You can access admission information, results, news, and educational resources without any cost. We may introduce premium features in the future, but basic services will always remain free.'
  },
  {
    id: 14,
    category: 'general',
    question: 'How can I contact NextID.pk for support?',
    answer: 'You can reach us through:\n\n• **Email:** info@nextid.pk\n• **Phone:** +92 342 5537329\n• **WhatsApp:** +92 342 5537329\n• **Contact Form:** Visit our Contact page\n\nWe typically respond within 24 hours on business days.'
  },
  {
    id: 15,
    category: 'general',
    question: 'Do you provide admission guidance?',
    answer: 'Yes! Our platform provides:\n\n• Detailed admission information\n• University listings\n• Program details\n• Merit lists\n• Application deadlines\n• Entry test information\n\nWhile we provide comprehensive information, we recommend verifying details with official sources.'
  }
];

const categoryIcons: Record<string, string> = {
  admissions: '📝',
  results: '📊',
  programs: '🎓',
  universities: '🏛️',
  boards: '📋',
  general: '❓'
};

function renderAnswer(answer: string): React.ReactNode {
  const lines = answer.split('\n');
  const elements: React.ReactNode[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    if (line.startsWith('•')) {
      elements.push(<li key={i} className="ml-4 mb-1">{line.substring(1)}</li>);
    } else if (line.match(/^\d+\./)) {
      elements.push(<li key={i} className="ml-4 mb-1">{line}</li>);
    } else if (line.includes('**')) {
      elements.push(
        <p key={i} className="mb-2" dangerouslySetInnerHTML={{ 
          __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
        }} />
      );
    } else {
      elements.push(<p key={i} className="mb-2">{line}</p>);
    }
  }
  
  return <>{elements}</>;
}

export default function FAQsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-blue-600">Home</Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900 font-medium">FAQs</span>
          </div>
        </div>
      </div>

      <section className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white relative overflow-hidden py-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-400 rounded-full mix-blend-overlay filter blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-xl text-blue-200 mb-8">
              Find answers to commonly asked questions about admissions, results, 
              programs, and education in Pakistan.
            </p>
            
            <div className="max-w-2xl mx-auto mt-4">
              <div className="bg-white rounded-xl shadow-lg p-2 flex items-center">
                <span className="text-gray-400 text-xl pl-4">🔍</span>
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  className="w-full px-4 py-3 focus:outline-none text-gray-900"
                  id="faq-search"
                />
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition whitespace-nowrap">
                  Search
                </button>
              </div>
              <p className="text-sm text-blue-200 mt-3 text-center">
                Popular: Admissions, Results, Programs, Universities
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Categories</h2>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-3 rounded-lg bg-blue-600 text-white font-medium flex items-center justify-between">
                  <span>📋 All Questions</span>
                  <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
                    {faqs.length}
                  </span>
                </button>
                {faqCategories.map((cat) => (
                  <button
                    key={cat.id}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 transition flex items-center justify-between group"
                  >
                    <span>
                      {cat.icon} {cat.name}
                    </span>
                    <span className="text-sm text-gray-400 group-hover:text-blue-600">
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Need More Help?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Can&apos;t find what you&apos;re looking for? Contact our support team.
                </p>
                <Link
                  href="/contact"
                  className="block text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-3">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={faq.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition"
                  id={`faq-${faq.id}`}
                >
                  <div className="p-6 cursor-pointer hover:bg-gray-50 transition flex items-start justify-between group">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-medium px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                          {categoryIcons[faq.category]} {faq.category}
                        </span>
                        <span className="text-xs text-gray-400">
                          Question #{index + 1}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600">
                        {faq.question}
                      </h3>
                    </div>
                    <div className="text-2xl text-gray-400 group-hover:text-blue-600 ml-4">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                    <div className="prose prose-blue max-w-none text-gray-700">
                      {renderAnswer(faq.answer)}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-sm">
                      <span className="text-gray-400">Was this helpful?</span>
                      <div className="flex gap-3">
                        <button className="text-gray-600 hover:text-green-600 flex items-center gap-1">
                          <span>👍</span> Yes
                        </button>
                        <button className="text-gray-600 hover:text-red-600 flex items-center gap-1">
                          <span>👎</span> No
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-100 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Still Have Questions?</h3>
              <p className="text-gray-600 mb-6">
                If you couldn&apos;t find the answer you were looking for, feel free to reach out to us directly.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href="/contact"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Contact Support
                </Link>
                <Link
                  href="/admissions"
                  className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-50 transition border border-blue-200"
                >
                  Browse Admissions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer.replace(/\n/g, ' ').replace(/\*/g, '')
              }
            }))
          })
        }}
      />
    </main>
  );
}