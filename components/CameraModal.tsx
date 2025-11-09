import React, { useState } from 'react';
import { Modal } from './Modal';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageSrc: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
    // This is a placeholder for camera functionality.
    // In a real implementation, you would use a library like 'react-webcam'
    // to access the camera and capture an image.
    const [isCameraActive, setIsCameraActive] = useState(false);

    const handleStartCamera = () => {
        // In a real app, you would initialize the camera here.
        alert("Camera functionality is not implemented in this demo.");
        setIsCameraActive(true);
    }
    
    const handleCapture = () => {
        // In a real app, you'd capture a frame and call onCapture.
        alert("Capture functionality is not implemented in this demo.");
        const fakeImageSrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
        onCapture(fakeImageSrc);
        onClose();
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Skenovat účtenku">
            <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-full h-64 bg-slate-900 rounded-lg flex items-center justify-center text-gray-500">
                    {isCameraActive ? "Camera feed would be here" : "Camera is off"}
                </div>
                {!isCameraActive ? (
                    <button onClick={handleStartCamera} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                        Spustit kameru
                    </button>
                ) : (
                    <button onClick={handleCapture} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors">
                        Vyfotit
                    </button>
                )}
            </div>
        </Modal>
    );
};
