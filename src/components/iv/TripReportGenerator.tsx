'use client';

import React, { useState, useRef } from 'react';
import { X, FileText, Image as ImageIcon, Map as MapIcon, Activity, Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface TripReportGeneratorProps {
  tripId: string;
  tripName?: string;
  onClose: () => void;
  students: any[];
  sosEvents: any[];
  breaches: any[];
}

export default function TripReportGenerator({ tripId, tripName = "Field Trip", onClose, students, sosEvents, breaches }: TripReportGeneratorProps) {
  const [includeMap, setIncludeMap] = useState(true);
  const [includeAnalytics, setIncludeAnalytics] = useState(true);
  const [includeGallery, setIncludeGallery] = useState(true);
  const [includeIncidents, setIncludeIncidents] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  const generatePDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    toast.info('Generating PDF Report... This may take a moment.');

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      // Calculate how many pages we need based on the image height
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add subsequent pages if the content is long
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`Trip-Report-${tripName.replace(/\s+/g, '-')}.pdf`);
      toast.success('PDF Report Generated Successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[5000] bg-background/95 backdrop-blur-xl flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Controls */}
      <div className="w-full md:w-80 bg-card border-r border-border p-6 flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-bold text-2xl tracking-tight">Report Builder</h2>
          <button onClick={onClose} className="p-2 bg-muted rounded-full hover:bg-muted/80">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 flex-1">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Include Sections</h3>
            
            <label className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border cursor-pointer hover:bg-muted/60 transition-colors mb-2">
              <div className="flex items-center gap-3">
                <MapIcon size={18} className="text-blue-500" />
                <span className="font-medium text-sm">Map Snapshot</span>
              </div>
              <input type="checkbox" checked={includeMap} onChange={(e) => setIncludeMap(e.target.checked)} className="w-4 h-4 rounded border-border" />
            </label>

            <label className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border cursor-pointer hover:bg-muted/60 transition-colors mb-2">
              <div className="flex items-center gap-3">
                <Activity size={18} className="text-emerald-500" />
                <span className="font-medium text-sm">Health Analytics</span>
              </div>
              <input type="checkbox" checked={includeAnalytics} onChange={(e) => setIncludeAnalytics(e.target.checked)} className="w-4 h-4 rounded border-border" />
            </label>

            <label className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border cursor-pointer hover:bg-muted/60 transition-colors mb-2">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-destructive" />
                <span className="font-medium text-sm">Incident Log (SOS)</span>
              </div>
              <input type="checkbox" checked={includeIncidents} onChange={(e) => setIncludeIncidents(e.target.checked)} className="w-4 h-4 rounded border-border" />
            </label>

            <label className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border cursor-pointer hover:bg-muted/60 transition-colors mb-2">
              <div className="flex items-center gap-3">
                <ImageIcon size={18} className="text-purple-500" />
                <span className="font-medium text-sm">Photo Gallery Highlights</span>
              </div>
              <input type="checkbox" checked={includeGallery} onChange={(e) => setIncludeGallery(e.target.checked)} className="w-4 h-4 rounded border-border" />
            </label>
          </div>
        </div>

        <button 
          onClick={generatePDF} 
          disabled={isGenerating}
          className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-black tracking-wider flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-all mt-6 shadow-lg shadow-primary/20"
        >
          {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
          {isGenerating ? 'GENERATING...' : 'EXPORT TO PDF'}
        </button>
      </div>

      {/* Preview Area */}
      <div className="flex-1 bg-muted/20 p-4 md:p-8 overflow-y-auto flex justify-center">
        {/* Render container to be captured by html2canvas */}
        <div 
          ref={reportRef} 
          className="bg-white text-black w-[800px] max-w-full rounded-none shadow-2xl p-12 min-h-[1123px] shrink-0 origin-top"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {/* Header */}
          <div className="border-b-4 border-black pb-6 mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">{tripName}</h1>
              <p className="text-gray-500 text-lg font-medium">Post-Trip Executive Summary Report</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-800">{new Date().toLocaleDateString()}</p>
              <p className="text-sm text-gray-500">ID: {tripId.split('-')[0].toUpperCase()}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-6 mb-12">
            <div className="bg-gray-100 p-6 rounded-2xl">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Total Students</p>
              <p className="text-4xl font-black">{students.length}</p>
            </div>
            <div className="bg-gray-100 p-6 rounded-2xl">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">SOS Incidents</p>
              <p className="text-4xl font-black">{sosEvents.length}</p>
            </div>
            <div className="bg-gray-100 p-6 rounded-2xl">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Security Breaches</p>
              <p className="text-4xl font-black">{breaches.length}</p>
            </div>
          </div>

          {/* Sections based on toggles */}
          {includeAnalytics && (
            <div className="mb-12">
              <h3 className="text-2xl font-bold mb-4 border-b border-gray-200 pb-2 flex items-center gap-3">
                <Activity size={24} className="text-gray-400" /> Device Telemetry & Health
              </h3>
              <p className="text-gray-600 mb-4">Summary of student device connectivity and battery status at the end of the trip.</p>
              <div className="grid grid-cols-2 gap-4">
                {students.slice(0, 10).map((s, i) => (
                  <div key={i} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                    <span className="font-medium">{s.profiles?.full_name}</span>
                    <div className="flex gap-4">
                      <span className={`font-bold ${s.battery && s.battery > 20 ? 'text-green-600' : 'text-red-600'}`}>
                        {s.battery}% Battery
                      </span>
                      <span className={`text-sm ${s.is_online ? 'text-green-600' : 'text-gray-400'}`}>
                        {s.is_online ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {students.length > 10 && (
                <p className="text-gray-400 text-sm mt-3 italic">+ {students.length - 10} more students tracked.</p>
              )}
            </div>
          )}

          {includeIncidents && (
            <div className="mb-12">
              <h3 className="text-2xl font-bold mb-4 border-b border-gray-200 pb-2 flex items-center gap-3">
                <FileText size={24} className="text-gray-400" /> Incident Log
              </h3>
              {sosEvents.length > 0 ? (
                <div className="space-y-4">
                  {sosEvents.map((e, i) => {
                    const student = students.find(s => s.user_id === e.student_id);
                    return (
                      <div key={i} className="p-4 bg-red-50 border border-red-100 rounded-xl flex justify-between">
                        <div>
                          <p className="font-bold text-red-800">SOS Triggered</p>
                          <p className="text-sm text-red-600">By {student?.profiles?.full_name || 'Unknown'}</p>
                        </div>
                        <p className="text-sm font-medium text-red-500">
                          {new Date(e.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 bg-gray-50 rounded-xl text-center text-gray-500 italic">
                  No SOS incidents were recorded during this trip.
                </div>
              )}
            </div>
          )}

          <div className="mt-16 text-center text-sm text-gray-400 pt-8 border-t border-gray-200">
            <p>Generated automatically by Kings LMS Advanced IV Tracker System</p>
          </div>
        </div>
      </div>
    </div>
  );
}
