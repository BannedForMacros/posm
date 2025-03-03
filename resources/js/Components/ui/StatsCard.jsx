import React from 'react';

const StatsCard = ({ title, value, icon: Icon, trend, description }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        {Icon && (
          <div className="bg-orange-100 p-3 rounded-lg">
            <Icon className="w-6 h-6 text-orange-600" />
          </div>
        )}
      </div>
      {(trend || description) && (
        <div className="mt-4 flex items-center">
          {trend && (
            <span className={`text-sm font-medium ${
              trend > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
          {description && (
            <span className="text-sm text-gray-500 ml-2">{description}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatsCard;