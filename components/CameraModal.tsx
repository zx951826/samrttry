import React, { useRef, useEffect, useState } from 'react';
import { XIcon } from './Icons';

interface CameraModalProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' } // Prefer back camera on mobile
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera access denied:", err);
        alert("無法存取相機，請檢查權限設定。");
        onClose();
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
            onCapture(file);
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-gray-900 rounded-2xl border border-cyan-500/30 overflow-hidden shadow-2xl shadow-cyan-500/20">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h3 className="text-cyan-400 font-tech uppercase tracking-widest text-sm">Live Feed // Capture</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <XIcon />
          </button>
        </div>

        {/* Viewfinder */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
          />
          {/* HUD Overlay */}
          <div className="absolute inset-4 border-2 border-cyan-500/30 rounded-lg pointer-events-none">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-12 h-12 border border-white/20 rounded-full flex items-center justify-center">
                  <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
               </div>
            </div>
          </div>
        </div>
        
        <canvas ref={canvasRef} className="hidden" />

        {/* Controls */}
        <div className="p-6 flex justify-center bg-gray-900">
          <button 
            onClick={handleCapture}
            className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 border-2 border-cyan-500 hover:bg-cyan-500/10 transition-all duration-300"
          >
            <div className="w-12 h-12 bg-cyan-400 rounded-full group-hover:scale-90 transition-transform duration-200"></div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraModal;