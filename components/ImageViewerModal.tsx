import React from 'react';

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ isOpen, onClose, imageSrc }) => {
  if (!isOpen || !imageSrc) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 transition-colors"
            aria-label="Zavřít"
        >
            &times;
        </button>
      <div 
        className="max-w-4xl max-h-[90vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <img src={imageSrc} alt="Náhled přílohy" className="w-auto h-auto max-w-full max-h-[90vh] rounded-lg shadow-2xl" />
      </div>
    </div>
  );
};