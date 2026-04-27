// app/(public)/contact/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';

 

export const metadata: Metadata = {
  title: 'Contact NextID.pk – Get Admissions Help & Educational Guidance in Pakistan',
  description: 'Reach out to NextID.pk for admissions, results, and educational guidance across Pakistan. Contact our support team today.',
  keywords: 'contact us, education support, admissions help, Pakistan education, NextID.pk help',
  alternates: {
    canonical: 'https://www.nextid.pk/contact',
  },
  openGraph: {
    title: 'Contact NextID.pk - Education Portal',
    description: 'Get in touch with our team for guidance on admissions, results, and educational updates.',
    images: ['/images/contact-og.jpg'],
  },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-blue-600">Home</Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900 font-medium">Contact Us</span>
          </div>
        </div>
      </div>

      <section className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white py-16 relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact NextID.pk</h1>
          <p className="text-xl text-blue-200 max-w-2xl mx-auto">
            Have questions about admissions, results, or any educational query? Reach out to our dedicated team today.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          
          <div className="space-y-8">
            <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-xl">
              <h2 className="text-2xl font-bold mb-6">Quick Connect</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-5 text-center rounded-lg hover:shadow-md transition">
                  <div className="text-3xl mb-2 text-blue-600">📧</div>
                  <h3 className="font-semibold text-gray-800">Email Us</h3>
                  <a href="mailto:info@nextid.pk" className="text-sm text-blue-600 hover:underline break-all">
                    info@nextid.pk
                  </a>
                  <p className="text-xs text-gray-500 mt-2">24/7 Support</p>
                </div>
                <div className="bg-green-50 p-5 text-center rounded-lg hover:shadow-md transition">
                  <div className="text-3xl mb-2 text-green-600">📞</div>
                  <h3 className="font-semibold text-gray-800">Call Us</h3>
                  <a href="tel:+923425537329" className="text-sm text-green-600 hover:underline">
                    +92 342-5537329
                  </a>
                  <p className="text-xs text-gray-500 mt-2">Mon-Fri, 9am-6pm</p>
                </div>
                <div className="bg-green-100 p-5 text-center rounded-lg hover:shadow-md transition">
                  <div className="text-3xl mb-2 text-green-700">💬</div>
                  <h3 className="font-semibold text-gray-800">WhatsApp</h3>
                  <a href="https://wa.me/923425537329" target="_blank" rel="noopener noreferrer" className="text-sm text-green-700 hover:underline">
                    +92 342-5537329
                  </a>
                  <p className="text-xs text-gray-500 mt-2">Instant Response</p>
                </div>
                <div className="bg-purple-50 p-5 text-center rounded-lg hover:shadow-md transition">
                  <div className="text-3xl mb-2 text-purple-600">💭</div>
                  <h3 className="font-semibold text-gray-800">Live Chat</h3>
                  <button className="text-sm text-purple-600 hover:underline">Start Chat</button>
                  <p className="text-xs text-gray-500 mt-2">Online Now</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-xl">
              <h2 className="text-2xl font-bold mb-4">Visit Our Office</h2>
              <p className="text-gray-600">
                Office #2, Street No#2, Madena Town, Ahatta, Taxila, Rawalpindi, Punjab 47000, Pakistan
              </p>
              <p className="mt-2 text-gray-600">Working Hours: Mon-Fri 9:00-18:00, Sat 10:00-14:00, Sun Closed</p>
            </div>

            <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-xl">
              <h2 className="text-2xl font-bold mb-4">About NextID.pk</h2>
              <p className="text-gray-700 mb-3">
                NextID.pk is Pakistan's education portal offering latest admissions, results, date sheets, and educational updates. Students from all provinces contact us for guidance and support.
              </p>
              <p className="text-gray-700">
                Contact us for personalized guidance on admissions, eligibility, and academic resources. We aim to provide reliable, accurate, and timely information to support students' educational journey.
              </p>
            </div>
          </div>

          <div className="bg-white shadow-sm border border-gray-200 p-8 rounded-xl">
            <h2 className="text-2xl font-bold mb-2">Send us a Message</h2>
            <p className="text-gray-600 mb-6">We'll respond within 24 hours</p>
            <form className="space-y-6">
              <input type="text" placeholder="Full Name*" required className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500" />
              <input type="email" placeholder="Email*" required className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500" />
              <input type="tel" placeholder="Phone (Optional)" className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500" />
              <select required className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select Subject</option>
                <option value="admissions">Admissions Inquiry</option>
                <option value="results">Results Question</option>
                <option value="technical">Technical Support</option>
                <option value="feedback">Feedback</option>
              </select>
              <textarea placeholder="Message*" rows={5} required className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
              <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition transform hover:scale-105">Send Message</button>
            </form>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 border-t border-gray-200">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-bold mb-6 text-center">Find Us on Map</h2>
          <div className="w-full h-[400px] rounded-xl overflow-hidden shadow-lg bg-gray-200">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d414.4181053735181!2d72.82173696205135!3d33.8034129507704!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMzPCsDQ4JzEyLjEiTiA3MsKwNDknMTkuNyJF!5e0!3m2!1sen!2s!4v1772900151455!5m2!1sen!2s"
              width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" title="NextID.pk Office"
            ></iframe>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="bg-white border p-6 rounded-lg shadow-sm">
              <h3 className="font-bold mb-2">How quickly do you respond?</h3>
              <p>We respond within 24 hours on business days.</p>
            </div>
            <div className="bg-white border p-6 rounded-lg shadow-sm">
              <h3 className="font-bold mb-2">Do you provide admissions guidance?</h3>
              <p>Yes, we guide students through admission processes of various institutions in Pakistan.</p>
            </div>
            <div className="bg-white border p-6 rounded-lg shadow-sm">
              <h3 className="font-bold mb-2">Is your service free?</h3>
              <p>Basic guidance is free, premium support may have fees.</p>
            </div>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "url": "https://www.nextid.pk/contact",
            "name": "Contact NextID.pk",
            "description": "Reach out to NextID.pk for admissions, results, and educational queries across Pakistan"
          })
        }}
      />
    </main>
  );
}
