// app/hooks/useBulkUpload.ts
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface BulkItem {
  name: string;
  slug: string;
  displayOrder: number;
  status: boolean;
  [key: string]: any; // For additional fields
}

interface UseBulkUploadProps {
  apiEndpoint: string;
  redirectPath: string;
  itemName: string;
  generateSlug: (text: string) => string;
  customParse?: (text: string) => BulkItem[];
}

export function useBulkUpload({
  apiEndpoint,
  redirectPath,
  itemName,
  generateSlug,
  customParse
}: UseBulkUploadProps) {
  const router = useRouter();
  const [bulkData, setBulkData] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);

  // Default CSV parser
  const defaultParseCSV = (text: string): BulkItem[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const firstLine = lines[0].toLowerCase();
    const hasHeaders = firstLine.includes('name') || firstLine.includes('displayorder') || 
                      firstLine.includes('slug') || firstLine.includes('status');
    
    let startIndex = 0;
    let headers: string[] = [];
    
    if (hasHeaders) {
      headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\r/g, ''));
      startIndex = 1;
    } else {
      headers = ['name', 'displayorder', 'slug', 'status'];
    }
    
    const items: BulkItem[] = [];
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      if (line.startsWith('<') || line.includes('</')) {
        console.warn(`Skipping line ${i + 1}: HTML content detected`);
        continue;
      }
      
      const values = line.split(',').map(v => v.trim().replace(/\r/g, ''));
      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      
      const name = obj.name || obj['category name'] || '';
      const displayOrder = parseInt(obj.displayorder || obj.display_order || '0') || 0;
      const slug = obj.slug || generateSlug(name);
      const status = obj.status === 'false' || obj.status === '0' ? false : true;
      
      if (name) {
        items.push({
          name,
          slug,
          displayOrder,
          status,
          ...obj // Include any additional fields
        });
      }
    }
    
    return items;
  };

  // Manual data parser
  const defaultParseManual = (text: string): BulkItem[] => {
    return text.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const cleanLine = line.replace(/["']/g, '');
        const parts = cleanLine.split(',').map(s => s.trim());
        
        if (parts.length >= 2) {
          const name = parts[0];
          const displayOrder = parseInt(parts[1]) || 0;
          const slug = parts.length >= 3 ? parts[2] : generateSlug(name);
          const status = parts.length >= 4 ? parts[3].toLowerCase() !== 'false' : true;
          
          // Build additional fields
          const additional: Record<string, any> = {};
          if (parts.length > 4) {
            additional.duration = parts[4];
          }
          if (parts.length > 5) {
            additional.overview = parts[5];
          }
          
          return {
            name,
            slug,
            displayOrder,
            status,
            ...additional
          };
        }
        return null;
      })
      .filter((item): item is BulkItem => item !== null && item.name !== '');
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileExt !== 'csv') {
        toast.error("Only CSV files are allowed");
        e.target.value = '';
        return;
      }
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  // Clear file
  const clearFile = () => {
    setFile(null);
    setFileName("");
  };

  // Download sample CSV
  const downloadSample = (sampleData: string[][]) => {
    const headers = ['name', 'displayOrder', 'slug', 'status'];
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `${itemName}-sample.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success(`Sample ${itemName} CSV downloaded`);
  };

  // Submit bulk upload
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bulkData && !file) {
      toast.error(`Please enter data or upload a file`);
      return;
    }

    setLoading(true);
    
    try {
      let items: BulkItem[] = [];
      
      if (file) {
        const text = await file.text();
        console.log(`📄 File content:`, text.substring(0, 200) + '...');
        items = customParse ? customParse(text) : defaultParseCSV(text);
      } else if (bulkData) {
        console.log(`📝 Manual data:`, bulkData.substring(0, 200) + '...');
        items = defaultParseManual(bulkData);
      }

      if (items.length === 0) {
        toast.error(`No valid ${itemName} found. Please check your format.`);
        setLoading(false);
        return;
      }

      console.log(`📦 Sending ${items.length} ${itemName} to API:`, items);
      
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [itemName]: items }),
      });

      console.log(`📥 Response status:`, res.status);
      
      const text = await res.text();
      console.log(`📥 Raw response:`, text);

      if (!text) {
        throw new Error("Empty response from server");
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("❌ JSON Parse Error:", parseError);
        throw new Error(`Invalid JSON response from server`);
      }

      console.log(`📥 Parsed response:`, data);

      if (!res.ok) {
        throw new Error(data.error || data.message || `HTTP ${res.status}: ${data.details?.join(', ') || 'Failed to upload'}`);
      }

      if (data.success) {
        toast.success(data.message || `${data.count} ${itemName} created successfully`);
        router.push(redirectPath);
      } else {
        throw new Error(data.error || `Failed to create ${itemName}`);
      }

    } catch (err) {
      console.error("🔥 Bulk upload error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to process bulk upload");
    } finally {
      setLoading(false);
    }
  };

  // Clear all
  const clearAll = () => {
    setBulkData("");
    setFile(null);
    setFileName("");
  };

  return {
    bulkData,
    setBulkData,
    file,
    fileName,
    loading,
    setLoading,
    handleFileChange,
    clearFile,
    downloadSample,
    handleBulkSubmit,
    clearAll
  };
}