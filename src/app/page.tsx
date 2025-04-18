'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

// Toast notification component
const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      {message}
    </div>
  );
};

// Progress bar component
const ProgressBar = ({ progress }: { progress: number }) => {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 overflow-hidden">
      <div 
        className="bg-[var(--apple-blue)] h-2.5 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};

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
  const [dominantLanguage, setDominantLanguage] = useState<"arabic" | "english" | "mixed">("arabic");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [fileSelected, setFileSelected] = useState<boolean>(false);
  const [showIOSButtons, setShowIOSButtons] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const progressIntervalRef = useRef<number | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [showProgress, setShowProgress] = useState<boolean>(false);
  
  // Clear progress interval when component unmounts
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current !== null) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, []);
  
  // Check if we're on iOS
  useEffect(() => {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    setShowIOSButtons(isIOS);
  }, []);

  const showToastNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

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

  // Function to simulate progress for better UX
  const simulateProgress = () => {
    // Clear any existing interval
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
    }
    
    // Simulate progress between 0-95% (final 5% when response received)
    progressIntervalRef.current = window.setInterval(() => {
      setProgress(prev => {
        const increment = Math.random() * 5;
        const newProgress = prev + increment;
        return newProgress < 95 ? newProgress : 95;
      });
    }, 500);
    
    return progressIntervalRef.current;
  };

  const processImage = async () => {
    try {
      // Reset states
      setImageURL(null);
      setExtractedText('');
      setLoading(true);
      setError('');
      setShowProgress(true);
      setProgress(0);
      
      // Validate file
      if (!file) {
        setError('Please select an image file');
        setLoading(false);
        setShowProgress(false);
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/heic', 'image/heif', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image file (JPEG, PNG, HEIC, HEIF) or PDF');
        setLoading(false);
        setShowProgress(false);
        return;
      }
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      
      // Detect if we're in development or production
      const backendUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:8000'
        : 'https://arabic-ocr-backend-staging-09589497d137.herokuapp.com';
      
      // Add mixed language processing option to ensure both Arabic and English are properly handled
      formData.append('mixed_language', 'true');
      
      // Add language hints to improve accuracy
      formData.append('languages', 'ara+eng');
      
      // Start the progress simulation
      const progressInterval = simulateProgress();
      
      // Send the file to the backend
      const response = await fetch(`${backendUrl}/api/ocr`, {
        method: 'POST',
        body: formData,
      });
      
      // Clear the progress simulation
      clearInterval(progressInterval);
      setProgress(100);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check if we have results
      if (data.text) {
        // Set extracted text, properly handling mixed language content
        setExtractedText(data.text);
        
        // If an image was processed, display it
        if (data.image_url) {
          setImageURL(data.image_url);
        } else {
          // For files like PDFs where we don't get an image back
          // Create a temporary URL for the uploaded file to display
          const objectUrl = URL.createObjectURL(file);
          setImageURL(objectUrl);
        }
      } else {
        setError('No text could be extracted from this image');
      }
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to process the image. Please try again.');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setShowProgress(false);
      }, 500); // Keep progress bar visible briefly after completion
    }
  };

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement | HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);
  
  // Handle drop event
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement | HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

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
      <section id="upload" className="py-16 bg-gradient-to-b from-[var(--apple-bg)] to-[var(--apple-gray)]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-10">
              <h1 className="text-4xl md:text-5xl font-bold text-[var(--apple-text)] mb-4 font-['Baloo_Bhaijaan_2']">تحويل الصور العربية إلى نص</h1>
              <p className="text-xl text-[var(--apple-secondary-text)] font-['Baloo_Bhaijaan_2']">استخرج النص العربي من الصور بدقة عالية باستخدام تقنية OCR المتقدمة</p>
            </div>
            
            <form 
              className="mt-8" 
              onSubmit={(e) => e.preventDefault()}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <div 
                className={`border-2 border-dashed rounded-lg p-10 transition-colors ${
                  dragActive ? "border-blue-500 bg-blue-50" : "border-[var(--apple-border)] bg-[var(--apple-bg-secondary)]"
                }`}
              >
                <div className="flex flex-col items-center justify-center">
                  <img src="/upload-icon.svg" alt="Upload" className="w-16 h-16 mb-4" />
                  <p className="text-lg text-[var(--apple-secondary-text)] mb-4 font-['Baloo_Bhaijaan_2']">
                    اسحب وأفلت الصورة هنا أو انقر للاختيار
                  </p>
                  <label className="btn-apple-primary cursor-pointer">
                    اختيار صورة
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="text-sm text-[var(--apple-secondary-text)] mt-4 font-['Baloo_Bhaijaan_2']">
                    الصيغ المدعومة: PNG، JPEG، GIF
                  </p>
                </div>
              </div>
            </form>
            
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
              {loading && (
                <div className="mb-4">
                  <p className="text-[var(--apple-secondary-text)] mb-2">جارِ المعالجة...</p>
                  <ProgressBar progress={progress} />
                </div>
              )}
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
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold text-[var(--apple-text)] font-['Baloo_Bhaijaan_2']">النتيجة</h3>
                  <div className="text-sm text-[var(--apple-secondary-text)]">
                    {dominantLanguage === "arabic" ? (
                      <span>تم اكتشاف: اللغة العربية</span>
                    ) : dominantLanguage === "english" ? (
                      <span>تم اكتشاف: اللغة الإنجليزية</span>
                    ) : (
                      <span>لغة مختلطة</span>
                    )}
                  </div>
                </div>
                <div className="text-[var(--apple-text)] whitespace-pre-wrap" style={{ lineHeight: "1.8" }}>
                  {result.split('\n').map((line, index) => {
                    // Count Arabic and English characters in the line
                    const arabicChars = (line.match(/[\u0600-\u06FF]/g) || []).length;
                    const englishChars = (line.match(/[a-zA-Z]/g) || []).length;
                    
                    // Determine the dominant language for this line
                    const lineDir = arabicChars > englishChars ? "rtl" : "ltr";
                    const lineLang = arabicChars > englishChars ? "ar" : "en";
                    
                    return (
                      <p 
                        key={index} 
                        dir={lineDir}
                        lang={lineLang}
                        className={`mixed-text mb-2 ${lineDir === "rtl" ? "text-right" : "text-left"}`}
                        style={{
                          fontFamily: lineDir === "rtl" ? "var(--arabic-font)" : "var(--english-font)"
                        }}
                      >
                        {/* Split by words to apply proper font styling */}
                        {line.split(' ').map((word, wordIndex) => {
                          // Detect if word is primarily Arabic or English
                          const isArabicWord = (word.match(/[\u0600-\u06FF]/g) || []).length > 
                                             (word.match(/[a-zA-Z]/g) || []).length;
                          
                          return (
                            <span 
                              key={wordIndex}
                              lang={isArabicWord ? "ar" : "en"}
                              className="inline-block"
                              style={{
                                fontFamily: isArabicWord ? "var(--arabic-font)" : "var(--english-font)",
                                direction: isArabicWord ? "rtl" : "ltr",
                                marginLeft: "0.25em",
                                marginRight: "0.25em"
                              }}
                            >
                              {word}
                            </span>
                          );
                        })}
                      </p>
                    );
                  })}
                </div>
              </div>
              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result);
                    showToastNotification('تم نسخ النص بنجاح');
                  }}
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

      {/* Toast notification */}
      {showToast && (
        <Toast 
          message={toastMessage} 
          onClose={() => setShowToast(false)} 
        />
      )}
    </main>
  );
}
