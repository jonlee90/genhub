'use client';

import { Box, Upload, FileText, Zap, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export interface Empty3DStateProps {
  onUploadClick?: () => void;
  className?: string;
}

export function Empty3DState({ onUploadClick, className }: Empty3DStateProps) {
  console.log('[Empty3DState] Rendering');

  const features = [
    {
      icon: Box,
      title: '3D BIM Coordination',
      description: 'Navigate your building model in real-time',
    },
    {
      icon: Zap,
      title: 'Smart Annotations',
      description: 'Pin issues, tasks, and notes directly on the model',
    },
    {
      icon: CheckCircle2,
      title: 'Real-time Collaboration',
      description: 'Share visual context with your team',
    },
  ];

  return (
    <Card
      className={cn(
        'border-2 border-gray-200 shadow-construction overflow-hidden',
        'bg-white relative',
        className
      )}
    >
      {/* Blueprint background pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #001B51 1px, transparent 1px),
            linear-gradient(to bottom, #001B51 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Technical corner markers */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#001B51] opacity-20" />
      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#001B51] opacity-20" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#001B51] opacity-20" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#001B51] opacity-20" />

      <div className="relative z-10 p-8 md:p-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="relative">
              {/* Pulsing rings */}
              <div className="absolute inset-0 bg-[#001B51] opacity-10 rounded-2xl animate-ping" />
              <div className="absolute inset-0 bg-[#001B51] opacity-20 rounded-2xl animate-pulse" />

              {/* Icon container */}
              <div className="relative p-6 bg-gradient-to-br from-[#001B51] to-[#002666] rounded-2xl border-4 border-white shadow-2xl">
                <Box className="w-12 h-12 text-white" strokeWidth={2} />
              </div>
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-gray-900 mb-3">
            3D Spatial Coordination
          </h2>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your BIM/IFC model to unlock spatial coordination, visual issue tracking, and
            real-time collaboration
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className={cn(
                'p-4 rounded-lg border-2 border-gray-200 bg-gray-50/50',
                'hover:border-[#001B51] hover:bg-blue-50/30 transition-all',
                'group'
              )}
            >
              <div className="p-2 bg-white border-2 border-gray-200 rounded-lg w-fit mb-3 group-hover:border-[#001B51] group-hover:bg-[#001B51] transition-all">
                <Icon className="w-5 h-5 text-gray-700 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-bold text-sm text-gray-900 uppercase tracking-tight mb-1">
                {title}
              </h3>
              <p className="text-xs text-gray-600">{description}</p>
            </div>
          ))}
        </div>

        {/* Upload CTA */}
        <div className="text-center">
          <button
            onClick={onUploadClick}
            className={cn(
              'inline-flex items-center gap-3 px-8 py-4 rounded-lg',
              'bg-[#001B51] text-white font-bold uppercase tracking-wide',
              'hover:bg-[#002666] hover:shadow-lg transition-all duration-200',
              'border-4 border-[#001B51] hover:border-[#003388]',
              'group'
            )}
          >
            <Upload className="w-6 h-6 group-hover:scale-110 transition-transform" />
            Upload IFC Model
          </button>

          <div className="mt-4 flex items-center justify-center gap-3 text-xs text-gray-500">
            <FileText className="w-4 h-4" />
            <span className="font-mono">Supports .IFC • Max 500MB</span>
          </div>
        </div>

        {/* Technical annotation */}
        <div className="mt-8 pt-6 border-t-2 border-gray-100">
          <div className="flex items-center justify-center gap-4 text-xs font-mono text-gray-400 uppercase tracking-wider">
            <span>BIM/IFC Compatible</span>
            <span>•</span>
            <span>WebGL Accelerated</span>
            <span>•</span>
            <span>LOD Optimization</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
