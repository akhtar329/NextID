// app/admin/redirects/RedirectForm.tsx
'use client';

import { useState } from 'react';

export default function RedirectForm() {
  const [formData, setFormData] = useState({
    fromPath: '',
    toPath: '',
    statusCode: 301
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const res = await fetch('/api/admin/redirects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (res.ok) {
      window.location.reload();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Old URL (From Path)</label>
        <input
          type="text"
          value={formData.fromPath}
          onChange={(e) => setFormData({...formData, fromPath: e.target.value})}
          placeholder="/old-page"
          required
        />
        <small>Example: /engineering-bs-program</small>
      </div>
      
      <div>
        <label>New URL (To Path)</label>
        <input
          type="text"
          value={formData.toPath}
          onChange={(e) => setFormData({...formData, toPath: e.target.value})}
          placeholder="/new-page"
          required
        />
      </div>
      
      <div>
        <label>Redirect Type</label>
        <select
          value={formData.statusCode}
          onChange={(e) => setFormData({...formData, statusCode: parseInt(e.target.value)})}
        >
          <option value={301}>301 Permanent</option>
          <option value={302}>302 Temporary</option>
        </select>
      </div>
      
      <button type="submit">Add Redirect</button>
    </form>
  );
}