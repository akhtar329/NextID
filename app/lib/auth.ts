// Simple authentication utilities
// app/lib/auth.ts
import nodemailer from 'nodemailer';

export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('authToken');
  const user = localStorage.getItem('userData');
  return !!(token && user);
};

export const getUserData = () => {
  if (typeof window === 'undefined') return null;
  try {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};

export const login = (token: string, userData: any) => {
  localStorage.setItem('authToken', token);
  localStorage.setItem('userData', JSON.stringify(userData));
};

export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  sessionStorage.clear();

  // Clear cookies
  document.cookie.split(";").forEach(cookie => {
    const name = cookie.split("=")[0].trim();
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });
};

// Function to send password reset email
export async function sendResetEmail(email: string, link: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"NextID" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Reset Your Password',
    html: `<p>Click <a href="${link}">here</a> to reset your password. This link will expire in 1 hour.</p>`,
  });
}