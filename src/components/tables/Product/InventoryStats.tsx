import React from 'react';
import { useInventoryStats } from '../../../context/InventoryContext';

export const InventoryStats: React.FC = () => {
  const { stats } = useInventoryStats();

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      color: 'blue',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      )
    },
    {
      title: 'Low Stock',
      value: stats.lowStock,
      color: 'yellow',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    },
    {
      title: 'Out of Stock',
      value: stats.outOfStock,
      color: 'red',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    },
    {
      title: 'In Stock',
      value: stats.inStock,
      color: 'green',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: {
        text: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-100 dark:bg-blue-900/30'
      },
      yellow: {
        text: 'text-yellow-600 dark:text-yellow-400',
        bg: 'bg-yellow-100 dark:bg-yellow-900/30'
      },
      red: {
        text: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-100 dark:bg-red-900/30'
      },
      green: {
        text: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-100 dark:bg-green-900/30'
      }
    };
    
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {statCards.map((card, index) => {
        const colors = getColorClasses(card.color);
        
        return (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {card.title}
                </p>
                <p className={`text-2xl font-semibold ${card.color === 'blue' ? 'text-gray-900 dark:text-white' : colors.text}`}>
                  {card.value.toLocaleString()}
                </p>
              </div>
              <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
                <div className={colors.text}>
                  {card.icon}
                </div>
              </div>
            </div>
            
            {/* Progress indicator for alerts */}
            {card.color === 'yellow' && stats.totalProducts > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>Alert Level</span>
                  <span>{((stats.lowStock / stats.totalProducts) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div 
                    className="bg-yellow-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((stats.lowStock / stats.totalProducts) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {/* Progress indicator for out of stock */}
            {card.color === 'red' && stats.totalProducts > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>Critical Level</span>
                  <span>{((stats.outOfStock / stats.totalProducts) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div 
                    className="bg-red-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((stats.outOfStock / stats.totalProducts) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};