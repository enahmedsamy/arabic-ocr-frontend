'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

// Icons
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[var(--apple-blue)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const FeatureIcon = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4 bg-[var(--apple-gray)] rounded-lg inline-flex items-center justify-center">
    <div className="text-[var(--apple-blue)] text-2xl">{children}</div>
  </div>
);

export default function Home() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = (file: File) => {
    // Get file extension
    const fileName = file.name.toLowerCase();
    const fileExt = fileName.split('.').pop() || '';
    
    // Check if file is an image or PDF
    const imageTypes = ['jpg', 'jpeg', 'png', 'heif', 'heic', 'webp', 'bmp', 'gif', 'tiff', 'tif', 'raw', 'img', 'svg'];
    const isPDF = fileExt === 'pdf';
    const isImage = imageTypes.includes(fileExt) || file.type.startsWith('image/');
    
    if (!isImage && !isPDF) {
      setError('يرجى تحميل ملف صورة (JPG, PNG, HEIC, الخ) أو PDF');
      return;
    }
    
    setFile(file);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const processImage = async () => {
    if (!file) {
      setError('يرجى تحميل ملف أولاً');
      return;
    }

    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append("file", file);

    // Use the appropriate backend URL based on environment
    const apiUrl = process.env.NODE_ENV === 'development' 
      ? "http://localhost:8000/api/ocr"
      : "https://arabic-ocr-backend-staging-09589497d137.herokuapp.com/api/ocr";

    try {
      console.log("Sending request to:", apiUrl);
      
      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
        // CORS settings
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        },
        // Explicitly don't send credentials for wildcard CORS to work
        credentials: 'omit'
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error("Server error:", response.status, errorText);
        throw new Error(`OCR processing failed: ${response.status} ${errorText}`);
      }
      
      const data = await response.json().catch(err => {
        console.error("Failed to parse JSON response:", err);
        throw new Error("Failed to parse server response");
      });
      
      console.log("OCR response:", data);
      
      // Check if there are pages in the response
      if (data.pages && data.pages.length > 0) {
        setResult(data.pages[0].text);
      } else {
        setError('لم يتم العثور على نص في الملف المُحمّل');
      }
    } catch (err) {
      console.error("Error processing image:", err);
      setError(`حدث خطأ أثناء معالجة الملف: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen font-arabic">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img 
              src="https://res.cloudinary.com/dflkfh5eu/image/upload/v1744937747/miojbqeic83x8zhtjytd.png" 
              alt="Arabic Books OCR" 
              className="h-10 w-auto"
            />
            <div className="font-bold text-xl text-[var(--apple-blue)] font-['Baloo_Bhaijaan_2']">
              Arabic Books OCR
            </div>
          </div>
          <nav className="hidden md:block">
            <ul className="flex gap-6">
              <li><a href="#features" className="text-[var(--apple-text)] hover:text-[var(--apple-blue)]">المميزات</a></li>
              <li><a href="#upload" className="text-[var(--apple-text)] hover:text-[var(--apple-blue)]">استخراج النص</a></li>
              <li><a href="#" className="text-[var(--apple-text)] hover:text-[var(--apple-blue)]">اتصل بنا</a></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero Section - Apple Style, no image */}
      <section className="py-20 bg-[var(--apple-light-gray)]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-[var(--apple-text)] font-['Baloo_Bhaijaan_2']">
                استخراج النصوص من الكتب العربية
              </h1>
              <p className="text-[var(--apple-secondary-text)] mb-8 text-lg max-w-2xl mx-auto font-['Baloo_Bhaijaan_2']">
                حوّل الكتب والمستندات الممسوحة ضوئياً إلى نصوص رقمية قابلة للتحرير والبحث بسهولة تامة
              </p>
              <a 
                href="#upload" 
                className="btn-apple inline-block text-lg"
              >
                ابدأ الآن
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Upload Section */}
      <section id="upload" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-[var(--apple-text)] font-['Baloo_Bhaijaan_2']">قم بتحميل صورة للبدء</h2>
            <p className="text-[var(--apple-secondary-text)] font-['Baloo_Bhaijaan_2']">يمكنك تحميل ملفات بصيغة JPG, PNG أو PDF</p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <div 
              className={`file-upload-area border-2 border-dashed rounded-xl p-8 text-center cursor-pointer ${
                dragActive ? 'border-[var(--apple-blue)] bg-[rgba(0,113,227,0.05)]' : 'border-[var(--apple-border)]'
              }`}
              onDragOver={(e) => { 
                e.preventDefault(); 
                e.stopPropagation();
                setDragActive(true); 
              }}
              onDragLeave={() => setDragActive(false)}
              onDragEnd={() => setDragActive(false)}
              onDrop={handleFileDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
              style={{cursor: 'pointer'}}
            >
              <div className="flex flex-col items-center justify-center gap-4">
                <UploadIcon />
                <p className="text-lg text-[var(--apple-text)] font-['Baloo_Bhaijaan_2']">
                  {file 
                    ? `تم اختيار: ${file.name}` 
                    : 'اسحب وأفلت الملف هنا أو انقر للتحميل'}
                </p>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf,.heif,.heic,.webp,.bmp,.gif,.tiff,.tif,.raw,.img,.svg"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="file-upload"
                  className="btn-apple-secondary inline-block"
                >
                  اختر ملفاً
                </label>
              </div>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="mt-6 text-center">
              <button
                onClick={processImage}
                disabled={loading || !file}
                className={`btn-apple ${
                  loading || !file ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'جارِ المعالجة...' : 'استخراج النص'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      {result && (
        <section className="py-12 bg-[var(--apple-gray)]">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="mt-8 border rounded-lg p-6 bg-[var(--apple-bg-secondary)]">
                <h3 className="text-2xl font-bold mb-4 text-[var(--apple-text)] font-['Baloo_Bhaijaan_2']">النتيجة</h3>
                <div className="text-[var(--apple-text)] font-['Baloo_Bhaijaan_2'] whitespace-pre-wrap">{result}</div>
              </div>
              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={() => navigator.clipboard.writeText(result)}
                  className="btn-apple-secondary"
                >
                  نسخ النص
                </button>
                <button
                  onClick={() => setResult(null)}
                  className="bg-[var(--apple-gray)] border border-[var(--apple-border)] text-[var(--apple-text)] px-4 py-2 rounded-full hover:bg-[var(--apple-border)]"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-[var(--apple-text)]">مميزات النظام</h2>
            <p className="text-[var(--apple-secondary-text)] max-w-2xl mx-auto">
              نظام متطور للتعرف الضوئي على النصوص العربية مع العديد من المزايا الفريدة
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              className="p-6 bg-white rounded-xl shadow-sm border border-[var(--apple-border)]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <FeatureIcon>📝</FeatureIcon>
              <h3 className="text-xl font-semibold mt-4 mb-2 text-[var(--apple-text)]">دعم كامل للغة العربية</h3>
              <p className="text-[var(--apple-secondary-text)]">
                تحليل دقيق للنصوص العربية مع دعم للتشكيل والخطوط المختلفة
              </p>
            </motion.div>
            
            <motion.div 
              className="p-6 bg-white rounded-xl shadow-sm border border-[var(--apple-border)]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <FeatureIcon>🔍</FeatureIcon>
              <h3 className="text-xl font-semibold mt-4 mb-2 text-[var(--apple-text)]">دقة عالية</h3>
              <p className="text-[var(--apple-secondary-text)]">
                معالجة متقدمة للصور لضمان دقة عالية في استخراج النصوص
              </p>
            </motion.div>
            
            <motion.div 
              className="p-6 bg-white rounded-xl shadow-sm border border-[var(--apple-border)]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <FeatureIcon>📱</FeatureIcon>
              <h3 className="text-xl font-semibold mt-4 mb-2 text-[var(--apple-text)]">متوافق مع جميع الأجهزة</h3>
              <p className="text-[var(--apple-secondary-text)]">
                يعمل على أجهزة الكمبيوتر والهواتف الذكية والأجهزة اللوحية
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-[var(--apple-text)] text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src="https://res.cloudinary.com/dflkfh5eu/image/upload/v1744937747/miojbqeic83x8zhtjytd.png" 
                  alt="Arabic Books OCR" 
                  className="h-10 w-auto invert" 
                />
                <h4 className="text-lg font-bold">Arabic Books OCR</h4>
              </div>
              <p className="text-gray-400">
                تطبيق متكامل لتحويل الكتب إلى نصوص قابلة للتحرير والبحث
              </p>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">روابط مفيدة</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">الصفحة الرئيسية</a></li>
                <li><a href="#features" className="text-gray-400 hover:text-white">المميزات</a></li>
                <li><a href="#upload" className="text-gray-400 hover:text-white">استخراج النص</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">تواصل معنا</h4>
              <p className="text-gray-400">
                راسلنا على البريد الإلكتروني:
                <a href="mailto:info@arabic-books-ocr.com" className="text-white hover:underline block mt-1">
                  info@arabic-books-ocr.com
                </a>
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>© {new Date().getFullYear()} Arabic Books OCR. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
