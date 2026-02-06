import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "px-6 py-3 rounded-lg font-bold transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg font-retro text-sm tracking-wide";
  
  const variants = {
    primary: "bg-quest-primary text-quest-dark hover:bg-blue-400 border-b-4 border-blue-600 active:border-b-0 active:translate-y-1",
    secondary: "bg-quest-card text-gray-200 hover:bg-gray-700 border-b-4 border-gray-900 active:border-b-0 active:translate-y-1",
    accent: "bg-quest-accent text-quest-dark hover:bg-purple-300 border-b-4 border-purple-600 active:border-b-0 active:translate-y-1",
    danger: "bg-quest-danger text-white hover:bg-red-400 border-b-4 border-red-700 active:border-b-0 active:translate-y-1",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;