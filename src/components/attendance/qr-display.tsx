'use client';

import { X, Maximize, Minimize, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QRDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  courseName: string;
}

export function QRDisplayModal({ isOpen, onClose, token, courseName }: QRDisplayModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const qrRef = useRef<SVGSVGElement>(null);

  if (!isOpen) return null;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const qrValue = `${baseUrl}/attend?session=${token}`;

  const downloadQR = () => {
    if (!qrRef.current) return;
    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      // Add padding and white background
      canvas.width = img.width + 80;
      canvas.height = img.height + 80;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 40, 40);
        
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `KingsLMS-Attendance-${courseName.replace(/\s+/g, '-')}.png`;
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <>
      <div 
        className={cn(
          "fixed inset-0 z-50 bg-background/95 backdrop-blur-md transition-all duration-300",
          isFullscreen ? "opacity-100" : "animate-in fade-in"
        )}
        onClick={!isFullscreen ? onClose : undefined}
      />
      
      <div className={cn(
        "fixed z-50 flex items-center justify-center transition-all duration-500",
        isFullscreen 
          ? "inset-0 animate-in zoom-in-95" 
          : "inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 animate-in zoom-in-95 w-full max-w-sm"
      )}>
        <div className={cn(
          "bg-background border border-border/50 shadow-[0_20px_60px_-15px_oklch(0.65_0.26_285/0.3)] overflow-hidden relative p-8 flex flex-col items-center transition-all duration-500",
          isFullscreen ? "w-full h-full justify-center rounded-none border-none" : "w-full rounded-3xl"
        )}>
          
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-secondary"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
            <button 
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-destructive/10 hover:text-destructive"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <h2 className={cn("font-black font-outfit mb-2 text-center transition-all", isFullscreen ? "text-5xl" : "text-2xl")}>
            Scan to Attend
          </h2>
          <p className={cn("text-muted-foreground text-center font-medium transition-all", isFullscreen ? "text-xl mb-12" : "text-sm mb-8")}>
            {courseName}
          </p>

          <div className={cn("bg-white rounded-3xl shadow-2xl transition-all duration-500 flex items-center justify-center", isFullscreen ? "p-8" : "p-4")}>
            {qrValue ? (
              <QRCodeSVG 
                value={qrValue} 
                size={isFullscreen ? Math.min(window.innerHeight * 0.5, 600) : 240} 
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"H"}
                includeMargin={false}
                ref={qrRef}
              />
            ) : (
              <div className="w-[240px] h-[240px] flex items-center justify-center bg-gray-100 rounded-xl">
                <span className="text-gray-400">Loading...</span>
              </div>
            )}
          </div>

          {!isFullscreen && (
            <Button 
              onClick={downloadQR}
              variant="outline" 
              className="mt-8 rounded-xl border-border/40 hover:bg-secondary/40 h-10 px-4 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download QR
            </Button>
          )}

          <p className={cn("text-muted-foreground/70 text-center transition-all", isFullscreen ? "mt-16 text-lg max-w-md" : "mt-6 text-xs max-w-[250px]")}>
            Keep this screen visible to the class. Students must use the scanner in their LMS portal.
          </p>
        </div>
      </div>
    </>
  );
}
