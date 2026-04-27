// app/(public)/privacy/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';

export const revalidate = 86400;
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Privacy Policy | NextID.pk - Education Portal Pakistan',
  description: 'Learn about how NextID.pk collects, uses, and protects your personal information. Our privacy policy explains our data practices and your rights.',
  keywords: 'privacy policy, data protection, privacy, terms, education portal privacy',
  alternates: {
    canonical: 'https://www.nextid.pk/privacy',
  },
  openGraph: {
    title: 'Privacy Policy - NextID.pk',
    description: 'How we protect and handle your data at NextID.pk',
    images: ['/images/privacy-og.jpg'],
  },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-blue-600">Home</Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900 font-medium">Privacy Policy</span>
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
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-xl text-blue-200">
              Your privacy is important to us. Learn how we collect, use, and protect your information.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-4">
        <div className="max-w-4xl mx-auto text-right text-sm text-gray-500">
          Last Updated: March 7, 2026
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12">
          
          <div className="prose prose-blue max-w-none">
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-6">
              Welcome to NextID.pk (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your personal information 
              and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard 
              your information when you visit our website nextid.pk (the &quot;Site&quot;) and use our services.
            </p>
            <p className="text-gray-700 mb-8">
              Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, 
              please do not access the site. We reserve the right to make changes to this privacy policy at any time 
              and for any reason. We will alert you about any changes by updating the &quot;Last Updated&quot; date of this 
              privacy policy.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Personal Information</h3>
            <p className="text-gray-700 mb-4">
              We may collect personal information that you voluntarily provide to us when you:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li>Register for an account</li>
              <li>Subscribe to our newsletter</li>
              <li>Fill out a contact form</li>
              <li>Participate in surveys or promotions</li>
              <li>Request information about admissions or results</li>
            </ul>
            <p className="text-gray-700 mb-4">
              The personal information we collect may include:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li>Name and contact information (email, phone number)</li>
              <li>Educational background and interests</li>
              <li>Login credentials (if you create an account)</li>
              <li>Any other information you choose to provide</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Automatically Collected Information</h3>
            <p className="text-gray-700 mb-4">
              When you visit our Site, we automatically collect certain information about your device and usage, including:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li>IP address and browser type</li>
              <li>Pages visited and time spent on pages</li>
              <li>Referring website addresses</li>
              <li>Device information (operating system, screen resolution)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">
              We use the information we collect for various purposes, including to:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li>Provide, operate, and maintain our website and services</li>
              <li>Improve, personalize, and expand our services</li>
              <li>Understand and analyze how you use our website</li>
              <li>Develop new products, services, features, and functionality</li>
              <li>Communicate with you, either directly or through one of our partners</li>
              <li>Send you emails and newsletters</li>
              <li>Find and prevent fraud</li>
              <li>Respond to your comments and questions</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Sharing Your Information</h2>
            <p className="text-gray-700 mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share your information in the following situations:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li><strong>With educational institutions:</strong> When you request information about admissions or programs</li>
              <li><strong>With service providers:</strong> Third-party vendors who help us operate our website</li>
              <li><strong>For legal reasons:</strong> If required by law or to protect our rights</li>
              <li><strong>With your consent:</strong> When you explicitly agree to share your information</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 mb-4">
              We use cookies and similar tracking technologies to track activity on our website and hold certain information. 
              Cookies are files with small amount of data which may include an anonymous unique identifier.
            </p>
            <p className="text-gray-700 mb-4">
              You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, 
              if you do not accept cookies, you may not be able to use some portions of our website.
            </p>
            <p className="text-gray-700 mb-6">
              We use the following types of cookies:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li><strong>Essential cookies:</strong> Necessary for the website to function properly</li>
              <li><strong>Analytics cookies:</strong> Help us understand how visitors interact with our website</li>
              <li><strong>Functional cookies:</strong> Remember your preferences</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information. 
              However, please note that no method of transmission over the internet or method of electronic storage is 100% secure.
            </p>
            <p className="text-gray-700 mb-6">
              While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee 
              its absolute security. If you have reason to believe that your interaction with us is no longer secure, 
              please immediately notify us.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Third-Party Links</h2>
            <p className="text-gray-700 mb-6">
              Our website may contain links to third-party websites, including educational institutions and boards. 
              We have no control over and assume no responsibility for the content, privacy policies, or practices of 
              any third-party sites or services. We strongly advise you to review the privacy policy of every site you visit.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children&apos;s Privacy</h2>
            <p className="text-gray-700 mb-4">
              Our services are intended for users who are at least 13 years of age. We do not knowingly collect personal 
              information from children under 13. If you are a parent or guardian and you are aware that your child has 
              provided us with personal information, please contact us so that we can take necessary actions.
            </p>
            <p className="text-gray-700 mb-6">
              For users between 13 and 18 years of age, we recommend reviewing this privacy policy with a parent or guardian.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Your Rights and Choices</h2>
            <p className="text-gray-700 mb-4">
              Depending on your location, you may have certain rights regarding your personal information, including:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li><strong>Access:</strong> Request a copy of the information we hold about you</li>
              <li><strong>Correction:</strong> Request that we correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request that we delete your information</li>
              <li><strong>Opt-out:</strong> Opt-out of marketing communications</li>
              <li><strong>Data portability:</strong> Request a copy of your data in a machine-readable format</li>
            </ul>
            <p className="text-gray-700 mb-6">
              To exercise any of these rights, please contact us using the information provided in the &quot;Contact Us&quot; section.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Data Retention</h2>
            <p className="text-gray-700 mb-6">
              We will retain your personal information only for as long as necessary to fulfill the purposes outlined in 
              this privacy policy, unless a longer retention period is required or permitted by law. When we have no 
              ongoing legitimate business need to process your information, we will either delete or anonymize it.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update our privacy policy from time to time. We will notify you of any changes by posting the new 
              privacy policy on this page and updating the &quot;Last Updated&quot; date at the top of this page.
            </p>
            <p className="text-gray-700 mb-6">
              You are advised to review this privacy policy periodically for any changes. Changes to this privacy policy 
              are effective when they are posted on this page.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions or concerns about this privacy policy or our data practices, please contact us at:
            </p>
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <p className="text-gray-700 mb-2">
                <strong>Email:</strong> <a href="mailto:privacy@nextid.pk" className="text-blue-600 hover:underline">privacy@nextid.pk</a>
              </p>
              <p className="text-gray-700 mb-2">
                <strong>Address:</strong> Office #2, Street No#2, Madena Town, Ahatta, Taxila Rawalpindi, Punjab 47000 Pakistan
              </p>
              <p className="text-gray-700">
                <strong>Phone:</strong> <a href="tel:+923425527329" className="text-blue-600 hover:underline">+92 342 5537329</a>
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-bold text-blue-800 mb-2">By Using Our Website</h3>
              <p className="text-blue-700">
                By continuing to use our website, you acknowledge that you have read and understood this privacy policy 
                and consent to the collection and use of your information as described herein.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}