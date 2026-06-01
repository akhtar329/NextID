// app/component/sections/Home/NewsletterWidget.tsx

'use client';

import { useState } from 'react';

export default function NewsletterWidget() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus('loading');
    
    // Replace with your actual API endpoint
    try {
      const response = await fetch('/api/public/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        setStatus('success');
        setEmail('');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };
  
  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-5 text-white">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">📧</span>
        <h3 className="text-lg font-bold">Stay Updated</h3>
      </div>
      <p className="text-blue-100 text-sm mb-4">
        Get admission alerts, results, and educational news
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
          required
          disabled={status === 'loading'}
        />
        
        <button 
          type="submit"
          disabled={status === 'loading'}
          className="w-full bg-white text-blue-600 font-semibold py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? 'Subscribing...' : 
           status === 'success' ? '✓ Subscribed!' : 
           status === 'error' ? 'Failed. Try again!' : 'Subscribe Now'}
        </button>
      </form>
      
      <p className="text-xs text-blue-200 mt-3 text-center">
        No spam. Unsubscribe anytime.
      </p>
    </div>
  );
}