import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle, Loader2 } from 'lucide-react';

const AIProgressOverlay = ({ isOpen }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Analyzing transcript content...',
    'Extracting key discussion points...',
    'Finding actionable decisions...',
    'Generating structured meeting summary...',
    'Identifying ownership & due dates...'
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(11, 15, 23, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1.5rem'
    }}>
      <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2rem', textAlign: 'center', borderColor: 'var(--accent-primary)' }}>
        <div style={{
          display: 'inline-flex',
          padding: '1rem',
          borderRadius: '50%',
          backgroundColor: 'var(--accent-light)',
          color: 'var(--accent-primary)',
          marginBottom: '1.25rem'
        }}>
          <Sparkles size={36} className="animate-pulse" />
        </div>

        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>AI Meeting Intelligence</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
          Processing your meeting transcript with large language model intelligence...
        </p>

        {/* Progress steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left' }}>
          {steps.map((stepText, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isCurrent ? 'var(--accent-light)' : 'transparent',
                  color: isDone ? 'var(--success)' : isCurrent ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontWeight: isCurrent ? '600' : '400',
                  fontSize: '0.9rem',
                  transition: 'all 0.3s ease'
                }}
              >
                {isDone ? (
                  <CheckCircle size={18} style={{ color: 'var(--success)' }} />
                ) : isCurrent ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--border-color)' }} />
                )}
                <span>{stepText}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AIProgressOverlay;
