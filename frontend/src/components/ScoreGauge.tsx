import React, { useEffect, useRef } from 'react';

interface ScoreGaugeProps {
  score: number;
  size?: number;
}

function getScoreLabel(score: number) {
  if (score < 450) return { label: 'Poor', color: '#EF4444' };
  if (score < 600) return { label: 'Fair', color: '#F59E0B' };
  if (score < 750) return { label: 'Good', color: '#3B82F6' };
  return { label: 'Excellent', color: '#55DD4A' };
}

export default function ScoreGauge({ score, size = 200 }: ScoreGaugeProps) {
  const { label, color } = getScoreLabel(score);
  const radius = (size / 2) - 16;
  const circumference = Math.PI * radius; // half circle
  const pct = (score - 300) / 600; // 0 to 1
  const arcLength = pct * circumference;
  const strokeDashoffset = circumference - arcLength;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 24} viewBox={`0 0 ${size} ${size / 2 + 24}`}>
        {/* Background arc */}
        <path
          d={`M ${16} ${center} A ${radius} ${radius} 0 0 1 ${size - 16} ${center}`}
          fill="none"
          stroke="#F4F1E8"
          strokeWidth={12}
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d={`M ${16} ${center} A ${radius} ${radius} 0 0 1 ${size - 16} ${center}`}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={0}
          style={{ transition: 'stroke-dasharray 1.5s ease-out, stroke 0.5s ease' }}
          filter={`drop-shadow(0 0 8px ${color}50)`}
        />
        {/* Score number */}
        <text
          x={center}
          y={center - 4}
          textAnchor="middle"
          fill="#122315"
          fontSize={size * 0.2}
          fontWeight="900"
          fontFamily="'Plus Jakarta Sans', sans-serif"
        >
          {score}
        </text>
        {/* Label */}
        <text
          x={center}
          y={center + 20}
          textAnchor="middle"
          fill={color}
          fontSize="14"
          fontWeight="700"
          fontFamily="'Plus Jakarta Sans', sans-serif"
        >
          {label}
        </text>
        {/* Range labels */}
        <text x={16} y={center + 20} fill="#566053" fontSize="10" fontFamily="'Plus Jakarta Sans', sans-serif">300</text>
        <text x={size - 16} y={center + 20} fill="#566053" fontSize="10" textAnchor="end" fontFamily="'Plus Jakarta Sans', sans-serif">900</text>
      </svg>
    </div>
  );
}
