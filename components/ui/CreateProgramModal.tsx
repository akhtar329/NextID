// components/ui/CreateProgramModal.tsx

"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

type CreateProgramModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newOffering: { id: number; programName: string; degreeName: string }) => void;
  instituteId: number;
  isDarkMode: boolean;
};

type Degree = {
  id: number;
  name: string;
  fullForm: string | null;
};

export default function CreateProgramModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  instituteId, 
  isDarkMode 
}: CreateProgramModalProps) {
  const [loading, setLoading] = useState(false);
  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [loadingDegrees, setLoadingDegrees] = useState(false);
  const [formData, setFormData] = useState({
    programName: "",
    degreeId: "",
    duration: "",
    feeRange: "",
    specificEligibility: "",
  });

  useEffect(() => {
    if (isOpen) {
      fetchDegrees();
    }
  }, [isOpen]);

  const fetchDegrees = async () => {
    setLoadingDegrees(true);
    try {
      const res = await fetch("/api/admin/degrees");
      const data = await res.json();
      if (data.success) {
        setDegrees(data.degrees || []);
      }
    } catch (error) {
      console.error("Error fetching degrees:", error);
    } finally {
      setLoadingDegrees(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.programName || !formData.degreeId) {
      toast.error("Program name and degree are required");
      return;
    }
    
    setLoading(true);
    toast.loading("Creating program...", { id: "create-program" });
    
    try {
      const res = await fetch("/api/admin/program-offerings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programName: formData.programName,
          degreeId: parseInt(formData.degreeId),
          instituteId: instituteId,
          duration: formData.duration || null,
          feeRange: formData.feeRange || null,
          specificEligibility: formData.specificEligibility || null,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to create program");
      }
      
      toast.success("Program created successfully!", { id: "create-program", duration: 2000 });
      
      const selectedDegree = degrees.find(d => d.id === parseInt(formData.degreeId));
      
      onSuccess({
        id: data.offering.id,
        programName: formData.programName,
        degreeName: selectedDegree?.name || "New Program",
      });
      
      setFormData({
        programName: "",
        degreeId: "",
        duration: "",
        feeRange: "",
        specificEligibility: "",
      });
      
      onClose();
    } catch (error) {
      console.error("Error creating program:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create program", { id: "create-program" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative rounded-lg shadow-xl w-full max-w-md p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Add New Program
          </h2>
          <button
            onClick={onClose}
            className={`${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Program Name *
            </label>
            <input
              type="text"
              name="programName"
              value={formData.programName}
              onChange={handleChange}
              placeholder="e.g., BS Computer Science"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              required
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Degree *
            </label>
            {loadingDegrees ? (
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading degrees...</div>
            ) : (
              <select
                name="degreeId"
                value={formData.degreeId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              >
                <option value="">Select Degree</option>
                {degrees.map((degree) => (
                  <option key={degree.id} value={degree.id}>
                    {degree.name} {degree.fullForm ? `(${degree.fullForm})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Duration
            </label>
            <input
              type="text"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              placeholder="e.g., 4 Years"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Fee Range
            </label>
            <input
              type="text"
              name="feeRange"
              value={formData.feeRange}
              onChange={handleChange}
              placeholder="e.g., PKR 500,000 - 800,000"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Specific Eligibility (Optional)
            </label>
            <textarea
              name="specificEligibility"
              value={formData.specificEligibility}
              onChange={handleChange}
              rows={2}
              placeholder="Any specific requirements for this program"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-md ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Program"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}