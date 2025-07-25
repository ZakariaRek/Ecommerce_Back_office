// src/components/Analytics/ChartComponents.tsx
import React, { useRef, useEffect, useState } from 'react';

// Chart data interfaces
interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  metadata?: Record<string, any>;
}

interface LineChartProps {
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  color?: string;
  showGrid?: boolean;
  showDots?: boolean;
  animate?: boolean;
  title?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
}

interface BarChartProps {
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  color?: string;
  horizontal?: boolean;
  showValues?: boolean;
  animate?: boolean;
  title?: string;
}

interface PieChartProps {
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  showLabels?: boolean;
  showPercentages?: boolean;
  animate?: boolean;
  title?: string;
}

interface DonutChartProps extends PieChartProps {
  innerRadius?: number;
  centerText?: string;
}

// Advanced Line Chart Component
export const AdvancedLineChart: React.FC<LineChartProps> = ({
  data,
  width = 600,
  height = 300,
  color = '#667eea',
  showGrid = true,
  showDots = true,
  animate = true,
  title,
  yAxisLabel,
  xAxisLabel
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    if (animate) {
      let start: number;
      const duration = 1500;

      const animateChart = (timestamp: number) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        setAnimationProgress(progress);

        if (progress < 1) {
          requestAnimationFrame(animateChart);
        }
      };

      requestAnimationFrame(animateChart);
    } else {
      setAnimationProgress(1);
    }
  }, [animate, data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Get data bounds
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const valueRange = maxValue - minValue || 1;

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;

      // Horizontal grid lines
      for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + chartWidth, y);
        ctx.stroke();
      }

      // Vertical grid lines
      for (let i = 0; i <= data.length - 1; i++) {
        const x = padding + (chartWidth / (data.length - 1)) * i;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, padding + chartHeight);
        ctx.stroke();
      }
    }

    // Draw axes
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 2;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.stroke();

    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding + chartHeight);
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.stroke();

    // Draw Y-axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= 5; i++) {
      const value = minValue + (valueRange / 5) * (5 - i);
      const y = padding + (chartHeight / 5) * i;
      ctx.fillText(value.toFixed(0), padding - 10, y);
    }

    // Draw X-axis labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    data.forEach((point, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index;
      ctx.fillText(point.label, x, padding + chartHeight + 10);
    });

    // Draw line with animation
    if (animationProgress > 0) {
      const gradient = ctx.createLinearGradient(0, padding, 0, padding + chartHeight);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color + '40');

      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Calculate animated data length
      const animatedLength = data.length * animationProgress;
      const visiblePoints = Math.floor(animatedLength);
      const partialProgress = animatedLength - visiblePoints;

      ctx.beginPath();

      for (let i = 0; i <= visiblePoints && i < data.length; i++) {
        const x = padding + (chartWidth / (data.length - 1)) * i;
        const normalizedValue = (data[i].value - minValue) / valueRange;
        const y = padding + chartHeight - (normalizedValue * chartHeight);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      // Add partial point if needed
      if (visiblePoints < data.length - 1 && partialProgress > 0) {
        const currentIndex = visiblePoints;
        const nextIndex = currentIndex + 1;
        
        const currentX = padding + (chartWidth / (data.length - 1)) * currentIndex;
        const nextX = padding + (chartWidth / (data.length - 1)) * nextIndex;
        const interpolatedX = currentX + (nextX - currentX) * partialProgress;

        const currentValue = (data[currentIndex].value - minValue) / valueRange;
        const nextValue = (data[nextIndex].value - minValue) / valueRange;
        const interpolatedValue = currentValue + (nextValue - currentValue) * partialProgress;
        
        const interpolatedY = padding + chartHeight - (interpolatedValue * chartHeight);
        ctx.lineTo(interpolatedX, interpolatedY);
      }

      ctx.stroke();

      // Draw dots
      if (showDots) {
        data.forEach((point, index) => {
          if (index <= visiblePoints) {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            const normalizedValue = (point.value - minValue) / valueRange;
            const y = padding + chartHeight - (normalizedValue * chartHeight);

            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        });
      }
    }

    // Draw title
    if (title) {
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 16px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(title, width / 2, 10);
    }

    // Draw axis labels
    if (yAxisLabel) {
      ctx.save();
      ctx.translate(15, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(yAxisLabel, 0, 0);
      ctx.restore();
    }

    if (xAxisLabel) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(xAxisLabel, width / 2, height - 5);
    }

  }, [data, width, height, color, showGrid, showDots, animationProgress, title, yAxisLabel, xAxisLabel]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="max-w-full h-auto"
      />
    </div>
  );
};

// Advanced Bar Chart Component
export const AdvancedBarChart: React.FC<BarChartProps> = ({
  data,
  width = 600,
  height = 300,
  color = '#667eea',
  horizontal = false,
  showValues = true,
  animate = true,
  title
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    if (animate) {
      let start: number;
      const duration = 1200;

      const animateChart = (timestamp: number) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        // Use easing function for smooth animation
        const eased = 1 - Math.pow(1 - progress, 3);
        setAnimationProgress(eased);

        if (progress < 1) {
          requestAnimationFrame(animateChart);
        }
      };

      requestAnimationFrame(animateChart);
    } else {
      setAnimationProgress(1);
    }
  }, [animate, data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const maxValue = Math.max(...data.map(d => d.value));
    const barSpacing = horizontal ? chartHeight / data.length : chartWidth / data.length;
    const barThickness = barSpacing * 0.7;

    // Draw title
    if (title) {
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 16px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(title, width / 2, 10);
    }

    // Draw axes
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 2;
    
    if (horizontal) {
      // Y-axis (left)
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, padding + chartHeight);
      ctx.stroke();

      // X-axis (bottom)
      ctx.beginPath();
      ctx.moveTo(padding, padding + chartHeight);
      ctx.lineTo(padding + chartWidth, padding + chartHeight);
      ctx.stroke();
    } else {
      // Y-axis (left)
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, padding + chartHeight);
      ctx.stroke();

      // X-axis (bottom)
      ctx.beginPath();
      ctx.moveTo(padding, padding + chartHeight);
      ctx.lineTo(padding + chartWidth, padding + chartHeight);
      ctx.stroke();
    }

    // Draw bars
    data.forEach((item, index) => {
      const barColor = item.color || color;
      const normalizedValue = (item.value / maxValue) * animationProgress;

      if (horizontal) {
        const barWidth = (normalizedValue * chartWidth);
        const y = padding + index * barSpacing + (barSpacing - barThickness) / 2;

        // Draw bar with gradient
        const gradient = ctx.createLinearGradient(padding, 0, padding + barWidth, 0);
        gradient.addColorStop(0, barColor);
        gradient.addColorStop(1, barColor + 'CC');

        ctx.fillStyle = gradient;
        ctx.fillRect(padding, y, barWidth, barThickness);

        // Draw label
        ctx.fillStyle = '#374151';
        ctx.font = '12px Inter, system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.label, padding - 10, y + barThickness / 2);

        // Draw value
        if (showValues) {
          ctx.fillStyle = '#111827';
          ctx.textAlign = 'left';
          ctx.fillText(item.value.toLocaleString(), padding + barWidth + 5, y + barThickness / 2);
        }
      } else {
        const barHeight = normalizedValue * chartHeight;
        const x = padding + index * barSpacing + (barSpacing - barThickness) / 2;
        const y = padding + chartHeight - barHeight;

        // Draw bar with gradient
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, barColor);
        gradient.addColorStop(1, barColor + 'CC');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barThickness, barHeight);

        // Draw label
        ctx.fillStyle = '#374151';
        ctx.font = '12px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // Rotate text if label is long
        if (item.label.length > 8) {
          ctx.save();
          ctx.translate(x + barThickness / 2, padding + chartHeight + 15);
          ctx.rotate(-Math.PI / 4);
          ctx.fillText(item.label, 0, 0);
          ctx.restore();
        } else {
          ctx.fillText(item.label, x + barThickness / 2, padding + chartHeight + 10);
        }

        // Draw value
        if (showValues) {
          ctx.fillStyle = '#111827';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(item.value.toLocaleString(), x + barThickness / 2, y - 5);
        }
      }
    });

  }, [data, width, height, color, horizontal, showValues, animationProgress, title]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="max-w-full h-auto"
      />
    </div>
  );
};

// Advanced Donut Chart Component
export const AdvancedDonutChart: React.FC<DonutChartProps> = ({
  data,
  width = 300,
  height = 300,
  showLabels = true,
  showPercentages = true,
  animate = true,
  title,
  innerRadius = 0.6,
  centerText
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const colors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c', 
    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
    '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'
  ];

  useEffect(() => {
    if (animate) {
      let start: number;
      const duration = 1500;

      const animateChart = (timestamp: number) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setAnimationProgress(eased);

        if (progress < 1) {
          requestAnimationFrame(animateChart);
        }
      };

      requestAnimationFrame(animateChart);
    } else {
      setAnimationProgress(1);
    }
  }, [animate, data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    const innerR = radius * innerRadius;

    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -Math.PI / 2; // Start from top

    // Draw title
    if (title) {
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 16px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(title, centerX, 10);
    }

    // Draw segments
    data.forEach((item, index) => {
      const segmentAngle = (item.value / total) * 2 * Math.PI * animationProgress;
      const color = item.color || colors[index % colors.length];
      
      // Expand segment if hovered
      const isHovered = hoveredIndex === index;
      const expansionOffset = isHovered ? 10 : 0;
      const segmentCenterAngle = currentAngle + segmentAngle / 2;
      const offsetX = Math.cos(segmentCenterAngle) * expansionOffset;
      const offsetY = Math.sin(segmentCenterAngle) * expansionOffset;

      // Create gradient for 3D effect
      const gradient = ctx.createRadialGradient(
        centerX + offsetX, centerY + offsetY, innerR,
        centerX + offsetX, centerY + offsetY, radius
      );
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color + 'DD');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX + offsetX, centerY + offsetY, radius, currentAngle, currentAngle + segmentAngle);
      ctx.arc(centerX + offsetX, centerY + offsetY, innerR, currentAngle + segmentAngle, currentAngle, true);
      ctx.closePath();
      ctx.fill();

      // Draw border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw labels
      if (showLabels && segmentAngle > 0.1) { // Only show label if segment is large enough
        const labelAngle = currentAngle + segmentAngle / 2;
        const labelRadius = radius * 0.75;
        const labelX = centerX + Math.cos(labelAngle) * labelRadius;
        const labelY = centerY + Math.sin(labelAngle) * labelRadius;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (showPercentages) {
          const percentage = ((item.value / total) * 100).toFixed(1);
          ctx.fillText(`${percentage}%`, labelX, labelY);
        } else {
          ctx.fillText(item.label, labelX, labelY);
        }
      }

      currentAngle += segmentAngle;
    });

    // Draw center text
    if (centerText) {
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 18px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(centerText, centerX, centerY);
    }

  }, [data, width, height, animationProgress, hoveredIndex, showLabels, showPercentages, title, innerRadius, centerText]);

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    const innerR = radius * innerRadius;

    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    
    if (distance >= innerR && distance <= radius) {
      const angle = Math.atan2(y - centerY, x - centerX) + Math.PI / 2;
      const normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;
      
      const total = data.reduce((sum, item) => sum + item.value, 0);
      let currentAngle = 0;
      
      for (let i = 0; i < data.length; i++) {
        const segmentAngle = (data[i].value / total) * 2 * Math.PI;
        if (normalizedAngle >= currentAngle && normalizedAngle <= currentAngle + segmentAngle) {
          setHoveredIndex(i);
          return;
        }
        currentAngle += segmentAngle;
      }
    }
    
    setHoveredIndex(null);
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="max-w-full h-auto cursor-pointer"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIndex(null)}
      />
      
      {/* Legend */}
      {showLabels && (
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {data.map((item, index) => (
            <div 
              key={index} 
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color || colors[index % colors.length] }}
              />
              <span className="text-gray-700 dark:text-gray-300 truncate">
                {item.label}
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-auto">
                {item.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Real-time Metric Display Component
export const RealTimeMetric: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon?: string;
  color?: string;
  format?: 'currency' | 'percentage' | 'number';
}> = ({ title, value, change, icon, color = 'blue', format = 'number' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    setIsAnimating(true);
    
    let start: number;
    const duration = 1000;
    const startValue = displayValue;
    const endValue = numericValue;

    const animateValue = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * eased;
      
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animateValue);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animateValue);
  }, [value]);

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return val.toLocaleString();
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border-l-4 border-${color}-500 shadow-lg hover:shadow-xl transition-all duration-300`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className={`text-3xl font-bold text-${color}-600 dark:text-${color}-400 ${isAnimating ? 'transition-all duration-300' : ''}`}>
            {formatValue(displayValue)}
          </p>
          {change !== undefined && (
            <p className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center mt-1`}>
              <span className="mr-1">
                {change >= 0 ? '↗️' : '↘️'}
              </span>
              {Math.abs(change).toFixed(1)}%
            </p>
          )}
        </div>
        {icon && (
          <div className={`text-4xl opacity-80`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};