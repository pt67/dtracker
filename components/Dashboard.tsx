import React, { useMemo } from 'react';
import { Equipment, EquipmentStatus, EquipmentType } from '../types';
import StatsCard from './StatsCard';
import { 
  PieChart, 
  AlertTriangle, 
  Wrench, 
  Activity, 
  Layers,
  Bell,
  Upload
} from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DashboardProps {
  data: Equipment[];
  onNavigate: (view: 'list', filter?: Partial<Equipment>) => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

const Dashboard: React.FC<DashboardProps> = ({ data, onNavigate }) => {
  
  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    let expired = 0;
    let breakdown = 0;
    let maintenance = 0;
    const byType: Record<string, number> = {};

    data.forEach(item => {
      // Robust Case-Insensitive Matching
      const type = item.type ? String(item.type).trim() : 'Other';
      const status = item.status ? String(item.status).toLowerCase().trim() : '';

      // Normalize type key for chart consistency
      // We capitalize first letter for display
      const displayType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
      byType[displayType] = (byType[displayType] || 0) + 1;

      // Status counts (case insensitive check)
      if (status === EquipmentStatus.BREAKDOWN.toLowerCase()) breakdown++;
      if (status === EquipmentStatus.MAINTENANCE.toLowerCase()) maintenance++;

      // Expiration logic
      if (item.dueDate) {
        const due = new Date(item.dueDate);
        // Only count if valid date
        if (!isNaN(due.getTime()) && due <= thirtyDaysFromNow) {
          expired++;
        }
      }
    });

    return {
      expired,
      breakdown,
      maintenance,
      byType,
      total: data.length
    };
  }, [data]);

  const chartData: { name: string; value: number }[] = Object.entries(stats.byType).map(([name, value]) => ({ name, value: value as number }));

  const handleSendAlarm = (e: React.MouseEvent) => {
    e.stopPropagation();
    // In a real app, this would call a backend service
    alert(`Sending email alerts to users of ${stats.expired} expiring equipment items...`);
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 animate-fade-in">
        <div className="p-6 bg-slate-100 rounded-full">
           <Layers className="w-12 h-12 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-700">No Equipment Data Found</h2>
        <p className="text-slate-500 max-w-md">Your database is empty. Please navigate to the Equipment List to import data or add items manually.</p>
        <button 
          onClick={() => onNavigate('list')}
          className="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Upload size={18} />
          Go to Equipment List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
           <p className="text-slate-500">Overview of equipment status and inventory.</p>
        </div>
        <button 
          onClick={() => onNavigate('list')}
          className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Layers size={16} />
          All Equipment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Equipment Breakdown by Type Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-1 row-span-2">
          <h3 className="font-semibold text-slate-700 mb-4">Equipment Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-4">
            <span className="text-3xl font-bold text-slate-800">{stats.total}</span>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Total Items</p>
          </div>
        </div>

        {/* Breakdown Stats */}
        <StatsCard 
          title="Breakdown" 
          value={stats.breakdown} 
          icon={Activity} 
          colorClass="bg-red-500"
          onClick={() => onNavigate('list', { status: EquipmentStatus.BREAKDOWN })}
          subtext="Click to view list"
        />

        {/* Maintenance Stats */}
        <StatsCard 
          title="Under Maintenance" 
          value={stats.maintenance} 
          icon={Wrench} 
          colorClass="bg-amber-500"
          onClick={() => onNavigate('list', { status: EquipmentStatus.MAINTENANCE })}
          subtext="Click to view list"
        />

        {/* Expiring Stats */}
        <StatsCard 
          title="Expiring Soon (<30 Days)" 
          value={stats.expired} 
          icon={AlertTriangle} 
          colorClass="bg-orange-500"
          onClick={() => {
            // Filter logic for dates is complex to pass as simple object, 
            // handling via special key in parent or just showing all for now
            onNavigate('list'); 
            // In a real router, we'd pass ?filter=expiring
          }}
          actionButton={
            <button 
              onClick={handleSendAlarm}
              className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <Bell size={16} />
              Trigger Alarm
            </button>
          }
        />
      </div>

      {/* Quick Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-xl border border-slate-100 col-span-3">
            <h3 className="font-semibold text-slate-700 mb-4">Inventory Quick View</h3>
            <div className="overflow-x-auto">
               <table className="min-w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-medium">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Type</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3 rounded-r-lg">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...chartData].sort((a,b) => b.value - a.value).map((item) => (
                      <tr key={item.name} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-700">{item.name}</td>
                        <td className="px-4 py-3">{item.value}</td>
                        <td className="px-4 py-3 text-slate-500">
                          {stats.total > 0 ? ((item.value / stats.total) * 100).toFixed(1) : '0.0'}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;