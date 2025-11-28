import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  colorClass: string;
  onClick?: () => void;
  subtext?: string;
  actionButton?: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, colorClass, onClick, subtext, actionButton }) => {
  return (
    <div 
      className={`bg-white rounded-xl shadow-sm p-6 border border-slate-100 transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-200' : ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
          {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colorClass}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {actionButton && (
        <div className="mt-4 pt-4 border-t border-slate-50">
          {actionButton}
        </div>
      )}
    </div>
  );
};

export default StatsCard;
