import React from 'react';
import { TruckStatus } from '../types';

interface CardProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}
  >
    {children}
  </div>
);

export const StatusBadge = ({ status }: { status: TruckStatus }) => {
  const styles = {
    [TruckStatus.REGISTERED]: 'bg-gray-100 text-gray-700 border-gray-200',
    [TruckStatus.PAID]: 'bg-blue-50 text-blue-700 border-blue-200',
    [TruckStatus.SCANNED]: 'bg-purple-50 text-purple-700 border-purple-200',
    [TruckStatus.VALIDATED_OK]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    [TruckStatus.SUSPICION]: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
      {status}
    </span>
  );
};

export const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
  <Card className="flex items-center gap-4">
    <div className={`p-3 rounded-full ${colorClass} bg-opacity-10 text-opacity-100`}>
      <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
    </div>
    <div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
  </Card>
);

export const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '',
  disabled = false,
  type = 'button'
}: any) => {
  const variants = {
    primary: 'bg-pcpcb-green hover:bg-pcpcb-dark text-white shadow-sm',
    secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
    outline: 'bg-transparent border border-pcpcb-green text-pcpcb-green hover:bg-pcpcb-light'
  };

  return (
    <button 
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant as keyof typeof variants]} ${className}`}
    >
      {children}
    </button>
  );
};