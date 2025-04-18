'use client';

import { useState, useCallback, useEffect } from 'react';
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
  const [fileSelected, setFileSelected] = useState<boolean>(false);
  const [showIOSButtons, setShowIOSButtons] = useState<boolean>(false);

  // Check if we're on iOS
  useEffect(() => {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    setShowIOSButtons(isIOS);
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = (file: File) => {
    try {
      // Get file extension and mime type
      const fileName = file.name.toLowerCase();
      const fileExt = fileName.split('.').pop() || '';
      const fileType = file.type.toLowerCase();
      
      console.log("Processing file:", { 
        name: fileName, 
        type: fileType, 
        size: file.size,
        lastModified: new Date(file.lastModified).toISOString()
      });
      
      // For debugging on mobile
      document.getElementById('debug-info')?.remove();
      const debugDiv = document.createElement('div');
      debugDiv.id = 'debug-info';
      debugDiv.style.display = 'none';
      debugDiv.textContent = JSON.stringify({ 
        name: fileName, 
        type: fileType, 
        size: file.size,
        lastModified: new Date(file.lastModified).toISOString()
      });
      document.body.appendChild(debugDiv);
      
      // Check if file is an image or PDF
      const imageTypes = ['jpg', 'jpeg', 'png', 'heif', 'heic', 'webp', 'bmp', 'gif', 'tiff', 'tif', 'raw', 'img', 'svg'];
      const isPDF = fileExt === 'pdf' || fileType === 'application/pdf';
      const isImage = imageTypes.includes(fileExt) || fileType.startsWith('image/');
      
      // iOS sometimes uses a generic content type, so we check if it looks like an image from size
      const looksLikeImage = file.size > 0 && file.size < 20 * 1024 * 1024; // Less than 20MB is likely an image/pdf
      
      // Special case for blank file type on iOS
      const isIOSImage = /iPhone|iPad|iPod/i.test(navigator.userAgent) && 
                       (fileType === '' || fileType === 'application/octet-stream') && 
                       looksLikeImage;
      
      if (!isImage && !isPDF && !looksLikeImage && !isIOSImage) {
        setError('يرجى تحميل ملف صورة (JPG, PNG, HEIC, الخ) أو PDF');
        setFileSelected(false);
        return;
      }
      
      setFile(file);
      setError(null);
      setFileSelected(true);

      // Focus on the process button after a short delay to ensure the DOM has updated
      setTimeout(() => {
        const processButton = document.getElementById('process-button');
        if (processButton) {
          processButton.focus();
          // Also scroll to it on mobile
          if (window.innerWidth < 768) {
            processButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 300);
    } catch (err) {
      console.error("Error processing file:", err);
      setError(`خطأ في معالجة الملف: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`);
      setFileSelected(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      console.log("File selection event triggered", e.target.files);
      
      if (e.target.files && e.target.files.length > 0) {
        const selectedFile = e.target.files[0];
        console.log("File selected:", selectedFile.name, selectedFile.type, selectedFile.size);
        
        // Some mobile browsers clear the input immediately, so make a copy of the file
        const fileObj = new File(
          [selectedFile], 
          selectedFile.name, 
          { type: selectedFile.type }
        );
        
        // Clear the file input value to allow selecting the same file again
        e.target.value = '';
        
        // Process the file
        handleFile(fileObj);
      } else {
        console.log("No file selected or file selection cancelled");
      }
    } catch (err) {
      console.error("Error handling file selection:", err);
      setError(`خطأ في اختيار الملف: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`);
    }
  };

  const resetFile = () => {
    setFile(null);
    setFileSelected(false);
    setError(null);
    // Clear the file input value
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const processImage = async () => {
    if (!file) {
      setError('يرجى تحميل ملف أولاً');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Check if this might be a HEIC file from iOS that wasn't properly detected
      let fileToSend = file;
      const fileName = file.name.toLowerCase();
      
      // If filename doesn't have an extension but comes from iOS, add .heic extension to help the backend
      if ((!fileName.includes('.') || file.type === '') && /iphone|ipad|ipod/i.test(navigator.userAgent)) {
        // Create a new file object with .heic extension
        const newFileName = `${fileName}.heic`;
        fileToSend = new File([file], newFileName, { type: file.type || 'image/heic' });
        console.log("Renamed file for iOS compatibility:", newFileName);
      }
      
      const formData = new FormData();
      formData.append("file", fileToSend);

      // Use the appropriate backend URL based on environment
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? "http://localhost:8000/api/ocr"
        : "https://arabic-ocr-backend-staging-09589497d137.herokuapp.com/api/ocr";

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
            <p className="text-[var(--apple-secondary-text)] font-['Baloo_Bhaijaan_2']">يمكنك تحميل ملفات بصيغة JPG, PNG, HEIC, PDF وأي صيغة صور أخرى</p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <div 
              className={`file-upload-area border-2 border-dashed rounded-xl p-8 text-center cursor-pointer ${
                dragActive ? 'border-[var(--apple-blue)] bg-[rgba(0,113,227,0.05)]' : 
                fileSelected ? 'border-green-500 bg-[rgba(0,200,0,0.05)]' : 'border-[var(--apple-border)]'
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
                {fileSelected ? (
                  <div className="text-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <UploadIcon />
                )}
                <p className="text-lg text-[var(--apple-text)] font-['Baloo_Bhaijaan_2']">
                  {file 
                    ? `تم اختيار: ${file.name}` 
                    : 'اسحب وأفلت الملف هنا أو انقر للتحميل'}
                </p>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept="image/*,.pdf,.heif,.heic"
                  onChange={handleFileChange}
                  onClick={(e) => {
                    // On iOS, clear the value when clicking to allow reselection
                    const target = e.target as HTMLInputElement;
                    target.value = '';
                    console.log("File input clicked, value cleared");
                  }}
                />
                
                {/* Special inputs for iOS */}
                {showIOSButtons && !fileSelected && (
                  <div className="grid grid-cols-2 gap-3 w-full mb-2">
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.capture = 'environment';
                        input.onchange = (e) => {
                          const target = e.target as HTMLInputElement;
                          if (target.files?.[0]) {
                            handleFile(target.files[0]);
                          }
                        };
                        input.click();
                      }}
                      className="btn-apple-secondary py-3 text-sm"
                    >
                      التقط صورة
                    </button>
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const target = e.target as HTMLInputElement;
                          if (target.files?.[0]) {
                            handleFile(target.files[0]);
                          }
                        };
                        input.click();
                      }}
                      className="btn-apple-secondary py-3 text-sm"
                    >
                      اختر من المعرض
                    </button>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <label
                    htmlFor="file-upload"
                    className="btn-apple-secondary inline-block w-full md:w-auto px-6 py-3"
                  >
                    {file ? 'تغيير الملف' : 'اختر ملفاً'}
                  </label>
                  {file && (
                    <button
                      onClick={resetFile}
                      className="btn-apple-secondary bg-red-50 text-red-600 border-red-200 hover:bg-red-100 inline-block w-full md:w-auto px-6 py-3 flex items-center justify-center gap-2"
                      aria-label="إزالة الملف المحدد"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      إزالة
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {fileSelected && (
              <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>تم اختيار الملف بنجاح: {file?.name}</span>
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="mt-6 text-center">
              <button
                id="process-button"
                onClick={processImage}
                disabled={loading || !file}
                className={`btn-apple ${
                  loading || !file ? 'opacity-50 cursor-not-allowed' : ''
                } focus:ring-4 focus:ring-[var(--apple-blue)]/30 transition-all`}
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
                <a href="mailto:ocr@asamy.net" className="text-white hover:underline block mt-1">
                  ocr@asamy.net
                </a>
              </p>
              <div className="mt-4 flex items-center">
                <a href="https://www.linkedin.com/in/ahmedssamy/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>© 2025 asamy.net. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
