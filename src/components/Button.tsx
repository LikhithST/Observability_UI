import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const Button = ({ children, ...props }: ButtonProps) => {
  return (
    <button
      className="px-4 py-2 bg-bosch-blue text-bosch-white rounded-md hover:bg-bosch-blue-45 focus:outline-none focus:ring-2 focus:ring-bosch-blue-60 focus:ring-opacity-50 transition-colors"
      {...props}
    >
      {children}
    </button>
  );
};