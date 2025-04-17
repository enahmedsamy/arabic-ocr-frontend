'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import Image from 'next/image';

// Icons
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const FeatureIcon = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4 bg-blue-50 rounded-lg inline-flex items-center justify-center">
    <div className="text-blue-600 text-2xl">{children}</div>
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
    if (file.type !== 'image/jpeg' && file.type !== 'image/png' && file.type !== 'application/pdf') {
      setError('يرجى تحميل ملف بصيغة JPG أو PNG أو PDF فقط');
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

    try {
      const response = await fetch("https://arabic-ocr-backend-488cadce3027.herokuapp.com/api/ocr", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("OCR processing failed");
      }
      
      const data = await response.json();
      setResult(data.pages[0].text);
    } catch (err) {
      setError('حدث خطأ أثناء معالجة الملف. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen font-arabic">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="font-bold text-2xl text-blue-600">تحليل النصوص العربية</div>
          <nav>
            <ul className="flex gap-6">
              <li><a href="#features" className="text-gray-600 hover:text-blue-600">المميزات</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600">كيفية الاستخدام</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600">اتصل بنا</a></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-l from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl font-bold mb-4 leading-tight">
                  استخراج النصوص العربية من الصور بدقة عالية وسرعة فائقة
                </h1>
                <p className="text-gray-600 mb-8 text-lg">
                  حوّل الصور والمستندات الممسوحة ضوئياً إلى نصوص رقمية قابلة للتحرير والبحث بسهولة تامة
                </p>
                <a href="#upload" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block">
                  ابدأ الآن مجاناً
                </a>
              </motion.div>
            </div>
            <div className="order-first md:order-last">
              <div className="rounded-lg shadow-lg overflow-hidden bg-white p-4">
                <Image 
                  src="/images/arabic-ocr-demo.png" 
                  alt="OCR Demo" 
                  width={600} 
                  height={400}
                  className="rounded"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upload Section */}
      <section id="upload" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">قم بتحميل صورة للبدء</h2>
            <p className="text-gray-600">يمكنك تحميل ملفات بصيغة JPG, PNG أو PDF</p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDragEnd={() => setDragActive(false)}
              onDrop={handleFileDrop}
            >
              <div className="flex flex-col items-center justify-center gap-4">
                <UploadIcon />
                <p className="text-lg">
                  {file 
                    ? `تم اختيار: ${file.name}` 
                    : 'اسحب وأفلت الملف هنا أو انقر للتحميل'}
                </p>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="file-upload"
                  className="bg-white border border-blue-600 text-blue-600 px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-50"
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
                className={`bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors ${
                  loading || !file ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
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
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold mb-6">النص المستخرج:</h3>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <pre className="whitespace-pre-wrap text-right font-arabic">{result}</pre>
              </div>
              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={() => navigator.clipboard.writeText(result)}
                  className="bg-white border border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50"
                >
                  نسخ النص
                </button>
                <button
                  onClick={() => setResult(null)}
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
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
            <h2 className="text-3xl font-bold mb-4">مميزات النظام</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              نظام متطور للتعرف الضوئي على النصوص العربية مع العديد من المزايا الفريدة
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              className="p-6 bg-white rounded-lg shadow-sm border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <FeatureIcon>🔍</FeatureIcon>
              <h3 className="text-xl font-bold mt-4 mb-2">دقة عالية</h3>
              <p className="text-gray-600">
                تعرف دقيق على النصوص العربية بمختلف الخطوط والأحجام مع معدل دقة يتجاوز 98%
              </p>
            </motion.div>
            
            <motion.div 
              className="p-6 bg-white rounded-lg shadow-sm border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <FeatureIcon>⚡</FeatureIcon>
              <h3 className="text-xl font-bold mt-4 mb-2">سرعة فائقة</h3>
              <p className="text-gray-600">
                معالجة سريعة للصور والملفات بفضل خوارزميات متطورة وبنية تحتية قوية
              </p>
            </motion.div>
            
            <motion.div 
              className="p-6 bg-white rounded-lg shadow-sm border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <FeatureIcon>🔒</FeatureIcon>
              <h3 className="text-xl font-bold mt-4 mb-2">خصوصية وأمان</h3>
              <p className="text-gray-600">
                حماية كاملة لبياناتك، لا يتم تخزين الملفات والنصوص المستخرجة بعد انتهاء المعالجة
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Secondary CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">جرب النظام الآن مجاناً</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            استخدم نظامنا للتعرف الضوئي على النصوص العربية واستمتع بالدقة والسرعة
          </p>
          <a href="#upload" className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg hover:bg-gray-100 transition-colors inline-block">
            ابدأ الآن
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">تحليل النصوص العربية</h3>
              <p className="text-gray-400">
                نظام متطور للتعرف الضوئي على النصوص العربية بدقة عالية وسرعة فائقة
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">روابط سريعة</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">الرئيسية</a></li>
                <li><a href="#features" className="text-gray-400 hover:text-white">المميزات</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">كيفية الاستخدام</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">اتصل بنا</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">تواصل معنا</h3>
              <p className="text-gray-400 mb-2">البريد الإلكتروني: info@arabic-ocr.com</p>
              <div className="flex gap-4 mt-4 justify-end md:justify-start">
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
            <p>© 2023 تحليل النصوص العربية. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
