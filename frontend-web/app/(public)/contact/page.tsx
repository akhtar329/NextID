// app/(public)/contact/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact Us | NextID.pk - Education Portal Pakistan',
  description: 'Get in touch with NextID.pk team. Have questions about admissions, results, or any educational queries? Contact us now for prompt assistance.',
  keywords: 'contact us, help, support, education help, Pakistan education, help desk',
  alternates: {
    canonical: 'https://nextid.pk/contact',
  },
  openGraph: {
    title: 'Contact NextID.pk - Education Portal',
    description: 'Reach out to our team for any education-related queries in Pakistan',
    images: ['/images/contact-og.jpg'],
  },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-blue-600">Home</Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900 font-medium">Contact Us</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white relative overflow-hidden py-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-400 rounded-full mix-blend-overlay filter blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Get in Touch</h1>
            <p className="text-xl text-blue-200">
              Have questions about admissions, results, or any educational matter? 
              Our team is here to help you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          
          {/* Left Column - Contact Info */}
          <div className="space-y-8">
            
            {/* Quick Contact Cards */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Connect</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div className="bg-blue-50 rounded-lg p-5 text-center hover:shadow-md transition group">
                  <div className="text-3xl mb-2 text-blue-600 group-hover:scale-110 transition-transform">📧</div>
                  <h3 className="font-semibold text-gray-800">Email Us</h3>
                  <a href="mailto:info@nextid.pk" className="text-sm text-blue-600 hover:underline break-all">
                    info@nextid.pk
                  </a>
                  <p className="text-xs text-gray-500 mt-2">24/7 Support</p>
                </div>

                {/* Phone */}
                <div className="bg-green-50 rounded-lg p-5 text-center hover:shadow-md transition group">
                  <div className="text-3xl mb-2 text-green-600 group-hover:scale-110 transition-transform">📞</div>
                  <h3 className="font-semibold text-gray-800">Call Us</h3>
                  <a href="tel:+921234567890" className="text-sm text-green-600 hover:underline">
                    +92 342-5537329
                  </a>
                  <p className="text-xs text-gray-500 mt-2">Mon-Fri, 9am-6pm</p>
                </div>

                {/* WhatsApp */}
                <div className="bg-green-100 rounded-lg p-5 text-center hover:shadow-md transition group">
                  <div className="text-3xl mb-2 text-green-700 group-hover:scale-110 transition-transform">💬</div>
                  <h3 className="font-semibold text-gray-800">WhatsApp</h3>
                  <a href="https://wa.me/921234567890" target="_blank" rel="noopener" className="text-sm text-green-700 hover:underline">
                    +92 342-5537329
                  </a>
                  <p className="text-xs text-gray-500 mt-2">Instant Response</p>
                </div>

                {/* Live Chat */}
                <div className="bg-purple-50 rounded-lg p-5 text-center hover:shadow-md transition group">
                  <div className="text-3xl mb-2 text-purple-600 group-hover:scale-110 transition-transform">💭</div>
                  <h3 className="font-semibold text-gray-800">Live Chat</h3>
                  <button className="text-sm text-purple-600 hover:underline">
                    Start Chat
                  </button>
                  <p className="text-xs text-gray-500 mt-2">Online Now</p>
                </div>
              </div>
            </div>

            {/* Office Address */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Visit Our Office</h2>
              
              <div className="flex items-start gap-4 mb-6">
                <div className="text-2xl text-blue-600">📍</div>
                <div>
                  <h3 className="font-semibold text-gray-800">Head Office</h3>
                  <p className="text-gray-600 mt-1">
                    Office #2, Street No#2<br />
                    Madena Town, Ahatta, Taxila<br />
                    Rawalpindi, Punjab 47000<br />
                    Pakistan
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="text-2xl text-green-600">🕒</div>
                <div>
                  <h3 className="font-semibold text-gray-800">Working Hours</h3>
                  <div className="text-gray-600 mt-1 space-y-1">
                    <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                    <p>Saturday: 10:00 AM - 2:00 PM</p>
                    <p>Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Follow Us</h2>
              
              <div className="flex gap-4">
                <a href="https://facebook.com/nextidpk" target="_blank" rel="noopener" 
                   className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition transform hover:scale-110">
                  f
                </a>
                <a href="https://twitter.com/nextidpk" target="_blank" rel="noopener"
                   className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition transform hover:scale-110">
                  𝕏
                </a>
                <a href="https://linkedin.com/company/nextidpk" target="_blank" rel="noopener"
                   className="w-12 h-12 bg-blue-700 text-white rounded-full flex items-center justify-center hover:bg-blue-800 transition transform hover:scale-110">
                  in
                </a>
                <a href="https://youtube.com/@nextidpk" target="_blank" rel="noopener"
                   className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition transform hover:scale-110">
                  ▶
                </a>
              </div>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Send us a Message</h2>
            <p className="text-gray-600 mb-6">We'll get back to you within 24 hours</p>

            <form className="space-y-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="you@example.com"
                />
              </div>

              {/* Phone (Optional) */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="+92 XXX XXXXXXX"
                />
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                >
                  <option value="">Select a subject</option>
                  <option value="admissions">Admissions Inquiry</option>
                  <option value="results">Results Question</option>
                  <option value="technical">Technical Support</option>
                  <option value="feedback">Feedback/Suggestion</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
                  placeholder="How can we help you?"
                ></textarea>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition transform hover:scale-105 shadow-md"
                >
                  Send Message
                </button>
              </div>

              {/* Privacy Note */}
              <p className="text-xs text-gray-500 text-center">
                By submitting this form, you agree to our 
                <Link href="/privacy" className="text-blue-600 hover:underline mx-1">Privacy Policy</Link>
                and
                <Link href="/terms" className="text-blue-600 hover:underline mx-1">Terms of Service</Link>
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Map Section */}
<section className="bg-white py-12 border-t border-gray-200">
  <div className="container mx-auto px-4">
    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Find Us on Map</h2>
    <div className="max-w-4xl mx-auto h-[400px] bg-gray-200 rounded-xl overflow-hidden shadow-lg">
      {/* ✅ Updated Google Maps Embed Code */}
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d414.4181053735181!2d72.82173696205135!3d33.8034129507704!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMzPCsDQ4JzEyLjEiTiA3MsKwNDknMTkuNyJF!5e0!3m2!1sen!2s!4v1772900151455!5m2!1sen!2s"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="NextID.pk Office Location - Taxila"
        className="w-full h-full"
      ></iframe>
    </div>
    
    {/* Optional: Address text below map */}
    <p className="text-center text-gray-600 mt-4 text-sm">
      <span className="font-medium">📍 Our Office:</span> Taxila, Punjab, Pakistan
      <br />
      <span className="text-xs text-gray-400">33°48'12.1"N 72°49'19.7"E</span>
    </p>
  </div>
</section>

      {/* FAQ Section */}
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">How quickly do you respond?</h3>
              <p className="text-gray-600">We aim to respond to all inquiries within 24 hours during business days.</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Do you provide admissions guidance?</h3>
              <p className="text-gray-600">Yes! Our team can help guide you through the admission process for various institutions.</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Is your service free?</h3>
              <p className="text-gray-600">Basic information and guidance are free. Premium services may have associated fees.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}