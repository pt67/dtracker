import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { Equipment } from './types';
import Dashboard from './components/Dashboard';
import EquipmentList from './components/EquipmentList';
import { LayoutDashboard } from 'lucide-react';

// Main App Component
const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'list'>('dashboard');
  const [data, setData] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [listFilter, setListFilter] = useState<Partial<Equipment> | undefined>(undefined);

  const fetchData = async () => {
    // Silent update if not initial load
    if (data.length === 0) setLoading(true);
    const items = await db.getAll();
    setData(items);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleNavigate = (targetView: 'dashboard' | 'list', filter?: Partial<Equipment>) => {
    setListFilter(filter);
    setView(targetView);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => setView('dashboard')}>
              <div className="bg-primary rounded-lg p-2 mr-3">
                 <LayoutDashboard className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">Dtracker</h1>
                <p className="text-xs text-slate-500">Equipment Management System</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* data example for download */}
              <div className="hidden md:flex flex-col ml-auto text-right">
                <a 
                  href="./csvjson.json" 
                  className="text-sm text-blue-600 hover:underline"
                >
                  Download Sample Data
                </a>
              </div>
            </div>

            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                    AD
                 </div>
                 <div className="hidden md:block text-sm">
                    <p className="font-medium text-slate-700">Admin User</p>
                    <p className="text-xs text-slate-500">IT Department</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {view === 'dashboard' && (
              <Dashboard 
                data={data} 
                onNavigate={handleNavigate} 
              />
            )}
            
            {view === 'list' && (
              <EquipmentList 
                initialData={data} 
                onBack={() => setView('dashboard')}
                initialFilter={listFilter}
                onDataChange={fetchData}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
