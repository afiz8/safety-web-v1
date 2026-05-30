import React, { useState } from 'react';
import {
  FaShareAlt,
  FaWhatsapp,
  FaTelegramPlane,
  FaEnvelope,
  FaGoogle,
  FaTimes,
  FaTwitter,
  FaFacebook,
  FaRobot   // Ganti SiChatGPT dengan FaRobot
} from 'react-icons/fa';

const ShareButton = ({ title, text, url, buttonText = "Bagikan", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const shareText = text || `Lihat laporan dari JSMS HSSE`;
  const shareUrl = url || window.location.href;
  const fullMessage = `${shareText}\n\n${shareUrl}`;
  const encodedMessage = encodeURIComponent(fullMessage);
  const encodedSubject = encodeURIComponent(title || 'Laporan JSMS HSSE');

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'JSMS HSSE Report',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share dibatalkan atau gagal', err);
      }
    } else {
      alert('Web Share API tidak didukung. Gunakan tombol lain.');
    }
    setIsOpen(false);
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    setIsOpen(false);
  };

  const shareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodedMessage}`, '_blank');
    setIsOpen(false);
  };

  const shareEmail = () => {
    window.location.href = `mailto:?subject=${encodedSubject}&body=${encodedMessage}`;
    setIsOpen(false);
  };

  const shareGmail = () => {
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${encodedSubject}&body=${encodedMessage}`, '_blank');
    setIsOpen(false);
  };

  const shareChatGPT = () => {
    const prompt = `Analisis laporan HSSE berikut:\n${fullMessage}`;
    window.open(`https://chat.openai.com/?prompt=${encodeURIComponent(prompt)}`, '_blank');
    setIsOpen(false);
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodedMessage}`, '_blank');
    setIsOpen(false);
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition"
      >
        <FaShareAlt /> {buttonText}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 border dark:border-gray-700 overflow-hidden">
          <div className="flex justify-between items-center p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <span className="text-sm font-semibold">Bagikan ke</span>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
              <FaTimes />
            </button>
          </div>
          <div className="py-1 max-h-80 overflow-y-auto">
            <button onClick={handleNativeShare} className="flex items-center gap-3 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <FaShareAlt className="text-gray-600" /> Share (Native)
            </button>
            <button onClick={shareWhatsApp} className="flex items-center gap-3 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <FaWhatsapp className="text-green-600" /> WhatsApp
            </button>
            <button onClick={shareTelegram} className="flex items-center gap-3 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <FaTelegramPlane className="text-blue-500" /> Telegram
            </button>
            <button onClick={shareEmail} className="flex items-center gap-3 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <FaEnvelope className="text-red-500" /> Email Client
            </button>
            <button onClick={shareGmail} className="flex items-center gap-3 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <FaGoogle className="text-red-500" /> Gmail Web
            </button>
            <button onClick={shareChatGPT} className="flex items-center gap-3 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <FaRobot className="text-gray-800 dark:text-white" /> ChatGPT
            </button>
            <button onClick={shareTwitter} className="flex items-center gap-3 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <FaTwitter className="text-blue-400" /> Twitter
            </button>
            <button onClick={shareFacebook} className="flex items-center gap-3 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <FaFacebook className="text-blue-600" /> Facebook
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareButton;