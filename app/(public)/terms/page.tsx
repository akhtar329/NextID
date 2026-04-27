// app/(public)/terms/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';

 

export const metadata: Metadata = {
  title: 'Terms of Service | NextID.pk - Education Portal Pakistan',
  description: 'Read the terms and conditions for using NextID.pk. Understand your rights and responsibilities when accessing our education portal.',
  keywords: 'terms of service, terms and conditions, legal, user agreement, education portal terms',
  alternates: {
    canonical: 'https://www.nextid.pk/terms',
  },
  openGraph: {
    title: 'Terms of Service - NextID.pk',
    description: 'Terms and conditions for using NextID.pk education portal',
    images: ['/images/terms-og.jpg'],
  },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-blue-600">Home</Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900 font-medium">Terms of Service</span>
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
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-xl text-blue-200">
              Please read these terms carefully before using our platform.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-4">
        <div className="max-w-4xl mx-auto text-right text-sm text-gray-500">
          Last Updated: March 7, 2026 | Effective: March 7, 2026
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12">
          
          <div className="prose prose-blue max-w-none">
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <p className="text-blue-800 font-medium">
                By accessing or using NextID.pk, you agree to be bound by these Terms of Service. 
                If you do not agree to all the terms and conditions, you may not access the website or use our services.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              Welcome to NextID.pk (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). These Terms of Service (&quot;Terms&quot;) govern your use of our website 
              located at nextid.pk (the &quot;Site&quot;) and any related services provided by NextID.pk.
            </p>
            <p className="text-gray-700 mb-6">
              By accessing or using the Site, you confirm that you have read, understood, and agree to be bound by these Terms. 
              If you are using the Site on behalf of an organization, you represent and warrant that you have the authority to 
              bind that organization to these Terms.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Eligibility</h2>
            <p className="text-gray-700 mb-4">
              By using our Site, you represent and warrant that:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li>You are at least 13 years of age</li>
              <li>If you are between 13 and 18, you have parental or guardian consent to use the Site</li>
              <li>You have the full power and authority to enter into these Terms</li>
              <li>You are not located in a country that is subject to a U.S. government embargo</li>
              <li>You will comply with all applicable laws and regulations</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Account Registration</h2>
            <p className="text-gray-700 mb-4">
              To access certain features of our Site, you may need to create an account. When you register, you agree to:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your information to keep it accurate</li>
              <li>Keep your password secure and confidential</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
            <p className="text-gray-700 mb-6">
              We reserve the right to suspend or terminate your account if any information provided proves to be inaccurate or incomplete.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Conduct</h2>
            <p className="text-gray-700 mb-4">
              When using our Site, you agree not to:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the rights of others</li>
              <li>Upload or transmit viruses or malicious code</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with the proper functioning of the Site</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Post false, misleading, or deceptive information</li>
              <li>Use the Site for any illegal purpose</li>
              <li>Scrape or collect user data without consent</li>
              <li>Impersonate any person or entity</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Content and Intellectual Property</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">5.1 Our Content</h3>
            <p className="text-gray-700 mb-4">
              The Site and its original content, features, and functionality are owned by NextID.pk and are protected by 
              international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
            <p className="text-gray-700 mb-4">
              Our content includes, but is not limited to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Text, graphics, logos, and images</li>
              <li>Software and code</li>
              <li>Educational information and resources</li>
              <li>Admission and result data</li>
              <li>User interface design</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">5.2 User Content</h3>
            <p className="text-gray-700 mb-4">
              By posting, uploading, or submitting content to our Site, you grant us a non-exclusive, royalty-free, 
              perpetual, irrevocable, and fully sublicensable right to use, reproduce, modify, adapt, publish, translate, 
              create derivative works from, distribute, and display such content throughout the world in any media.
            </p>
            <p className="text-gray-700 mb-6">
              You represent and warrant that you own or have the necessary licenses, rights, consents, and permissions to 
              publish the content you submit.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Third-Party Links</h2>
            <p className="text-gray-700 mb-4">
              Our Site may contain links to third-party websites, including educational institutions, boards, and other resources. 
              These links are provided for your convenience only.
            </p>
            <p className="text-gray-700 mb-6">
              We have no control over and assume no responsibility for the content, privacy policies, or practices of any 
              third-party websites. We do not endorse or make any representations about third-party websites. Your use of 
              third-party websites is at your own risk and subject to their terms and conditions.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Accuracy of Information</h2>
            <p className="text-gray-700 mb-4">
              We strive to provide accurate and up-to-date information on our Site, including admission dates, results, 
              and educational resources. However:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li>Information may change without notice</li>
              <li>We do not warrant the accuracy, completeness, or reliability of any information</li>
              <li>You should verify critical information with official sources</li>
              <li>We are not responsible for any decisions made based on our content</li>
              <li>Educational institutions may change their policies independently</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Disclaimer of Warranties</h2>
            <p className="text-gray-700 mb-4">
              THE SITE AND ALL CONTENT, MATERIALS, INFORMATION, SOFTWARE, FACILITIES, AND SERVICES PROVIDED ON THE SITE ARE 
              PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
            </p>
            <p className="text-gray-700 mb-6">
              TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING IMPLIED 
              WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT 
              THE SITE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE FROM VIRUSES OR OTHER HARMFUL COMPONENTS.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL NEXTID.PK, ITS AFFILIATES, DIRECTORS, 
              EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY 
              DAMAGES, INCLUDING WITHOUT LIMITATION DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES, 
              ARISING OUT OF OR RELATING TO THE USE OF, OR INABILITY TO USE, THE SITE.
            </p>
            <p className="text-gray-700 mb-6">
              OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATING TO THESE TERMS OR YOUR USE OF THE SITE SHALL 
              NOT EXCEED THE AMOUNT YOU PAID US, IF ANY, DURING THE TWELVE MONTHS PRIOR TO THE EVENT GIVING RISE TO THE LIABILITY.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Indemnification</h2>
            <p className="text-gray-700 mb-6">
              You agree to defend, indemnify, and hold harmless NextID.pk and its employees, contractors, and agents from and 
              against any and all claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including 
              but not limited to attorney&apos;s fees) arising from: (a) your use of and access to the Site; (b) your violation of 
              any term of these Terms; (c) your violation of any third-party right, including without limitation any copyright, 
              property, or privacy right; or (d) any claim that your content caused damage to a third party.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Termination</h2>
            <p className="text-gray-700 mb-4">
              We may terminate or suspend your account and bar access to the Site immediately, without prior notice or liability, 
              under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
            <p className="text-gray-700 mb-6">
              Upon termination, your right to use the Site will immediately cease. All provisions of the Terms which by their 
              nature should survive termination shall survive termination, including, without limitation, ownership provisions, 
              warranty disclaimers, indemnity, and limitations of liability.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Governing Law</h2>
            <p className="text-gray-700 mb-6">
              These Terms shall be governed and construed in accordance with the laws of Pakistan, without regard to its 
              conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered 
              a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, 
              the remaining provisions of these Terms will remain in effect.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is 
              material, we will try to provide at least 30 days&apos; notice prior to any new terms taking effect. What constitutes 
              a material change will be determined at our sole discretion.
            </p>
            <p className="text-gray-700 mb-6">
              By continuing to access or use our Site after those revisions become effective, you agree to be bound by the 
              revised terms. If you do not agree to the new terms, please stop using the Site.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <p className="text-gray-700 mb-2">
                <strong>Email:</strong> <a href="mailto:legal@nextid.pk" className="text-blue-600 hover:underline">legal@nextid.pk</a>
              </p>
              <p className="text-gray-700 mb-2">
                <strong>Address:</strong> Office #2, Street No#2, Madena Town, Ahatta, Taxila Rawalpindi, Punjab 47000 Pakistan
              </p>
              <p className="text-gray-700">
                <strong>Phone:</strong> <a href="tel:+923425527329" className="text-blue-600 hover:underline">+92 342 5527329</a>
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-bold text-green-800 mb-2">By Using Our Website</h3>
              <p className="text-green-700">
                By accessing or using NextID.pk, you acknowledge that you have read, understood, and agree to be bound by 
                these Terms of Service. Thank you for being part of our community.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-t border-gray-200 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto flex flex-wrap gap-4 justify-center">
            <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
            <span className="text-gray-300">•</span>
            <Link href="/faqs" className="text-blue-600 hover:underline">FAQs</Link>
            <span className="text-gray-300">•</span>
            <Link href="/contact" className="text-blue-600 hover:underline">Contact Us</Link>
            <span className="text-gray-300">•</span>
            <Link href="/about" className="text-blue-600 hover:underline">About Us</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
