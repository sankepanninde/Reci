import React from 'react';

export default function GlassCard({ children, className = '' }) {
  return (
    <div className={`glass-card rounded-xl ${className}`}>
      {children}
    </div>
  );
}