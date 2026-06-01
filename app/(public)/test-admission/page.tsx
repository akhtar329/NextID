// app/test-admission/page.tsx
import AdmissionSection from "@/components/sections/Home/AdmissionSection";

export default function TestAdmissionPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test: Admission Section Only</h1>
      <AdmissionSection />
    </div>
  );
}