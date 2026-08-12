import React from 'react';
import './SkeletonLoader.css';

export function CardSkeleton({ count = 4 }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="skeleton-card">
          <div className="flex items-center justify-between">
            <div className="skeleton-box" style={{ width: 36, height: 36, borderRadius: 8 }} />
            <div className="skeleton-box" style={{ width: 24, height: 16 }} />
          </div>
          <div className="skeleton-box" style={{ width: '45%', height: 28, marginTop: 8 }} />
          <div className="skeleton-box" style={{ width: '65%', height: 14 }} />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="skeleton-table-wrapper">
      <div className="skeleton-table-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 16 }}>
        <div className="skeleton-box" style={{ width: '30%', height: 16 }} />
        <div className="skeleton-box" style={{ width: '20%', height: 16 }} />
        <div className="skeleton-box" style={{ width: '25%', height: 16 }} />
        <div className="skeleton-box" style={{ width: '15%', height: 16 }} />
      </div>
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="skeleton-table-row">
          <div className="skeleton-box" style={{ width: '30%', height: 18 }} />
          <div className="skeleton-box" style={{ width: '20%', height: 18 }} />
          <div className="skeleton-box" style={{ width: '25%', height: 18 }} />
          <div className="skeleton-box" style={{ width: '15%', height: 18 }} />
        </div>
      ))}
    </div>
  );
}

export function ExamQuestionSkeleton() {
  return (
    <div className="skeleton-question-container">
      <div className="flex items-center justify-between">
        <div className="skeleton-box" style={{ width: '20%', height: 20 }} />
        <div className="skeleton-box" style={{ width: '15%', height: 20 }} />
      </div>
      <div className="skeleton-box" style={{ width: '90%', height: 24, marginTop: 8 }} />
      <div className="skeleton-box" style={{ width: '70%', height: 24 }} />

      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="skeleton-box" style={{ width: '100%', height: 48, borderRadius: 10 }} />
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24 }}>
      <div className="flex items-center justify-between">
        <div>
          <div className="skeleton-box" style={{ width: 220, height: 28 }} />
          <div className="skeleton-box" style={{ width: 340, height: 14, marginTop: 8 }} />
        </div>
        <div className="skeleton-box" style={{ width: 120, height: 36, borderRadius: 8 }} />
      </div>
      <CardSkeleton count={4} />
      <TableSkeleton rows={6} />
    </div>
  );
}

export default DashboardSkeleton;
