'use client';

import { X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';

interface QRDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  courseName: string;
}

export function QRDisplayModal({ isOpen, onClose, token, courseName }: QRDisplayModalProps) {
  const [qrValue, setQrValue] = useState('');

  useEffect(() => {
    if (isOpen && token) {
      // Build a secure URL for the QR code to represent
      const baseUrl = window.location.origin;
      // We pass the session token as the session param, which is how it was implemented in attendance page before
      // Ideally we would pass session ID, but token is safer if it's uniquely queryable. Let's stick with token= or session=token
      setQrValue(`${baseUrl}/attend?session=${token}`);
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 flex items-center justify-center animate-in zoom-in-95 duration-300 w-full max-w-sm">
        <div className="bg-background border border-border/50 rounded-3xl shadow-[0_20px_60px_-15px_oklch(0.65_0.26_285/0.3)] overflow-hidden w-full relative p-8 flex flex-col items-center">
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>

          <h2 className="text-2xl font-black font-outfit mb-2 text-center">Scan to Attend</h2>
          <p className="text-muted-foreground text-sm mb-8 text-center font-medium">
            {courseName}
          </p>

          <div className="p-4 bg-white rounded-2xl shadow-xl">
            {qrValue ? (
              <QRCodeSVG 
                value={qrValue} 
                size={240} 
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"H"}
                includeMargin={false}
              />
            ) : (
              <div className="w-[240px] h-[240px] flex items-center justify-center bg-gray-100 rounded-xl">
                <span className="text-gray-400">Loading...</span>
              </div>
            )}
          </div>

          <p className="mt-8 text-xs text-muted-foreground/70 text-center max-w-[250px]">
            Keep this screen visible to the class. Students must use the scanner in their LMS portal.
          </p>
        </div>
      </div>
    </>
  );
}
