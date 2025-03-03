import React from 'react';

export const Input = React.forwardRef(({ error, label, className = '', ...props }, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <input
                {...props}
                ref={ref}
                className={`
                    w-full px-4 py-2 rounded-lg
                    border border-gray-300
                    text-gray-900 
                    placeholder:text-gray-400
                    focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                    transition duration-200
                    ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
                    ${className}
                `}
            />
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
});