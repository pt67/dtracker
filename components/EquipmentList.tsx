import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Equipment, EquipmentStatus, EquipmentType } from '../types';
import { Search, Filter, Download, Upload, Trash2, Edit, UserPlus, QrCode, ArrowLeft } from 'lucide-react';
import EquipmentModal from './EquipmentModal';
import QrModal from './QrModal';
import { db } from '../services/db';

interface EquipmentListProps {
  initialData: Equipment[];
  onBack: () => void;
  initialFilter?: Partial<Equipment>;
  onDataChange: () => void;
}

const EquipmentList: React.FC<EquipmentListProps> = ({ initialData, onBack, initialFilter, onDataChange }) => {
  const [items, setItems] = useState<Equipment[]>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [filterDept, setFilterDept] = useState<string>('All');
  
  const [visibleCount, setVisibleCount] = useState(20);
  
  // Modal States
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null);
  const [modalMode, setModalMode] = useState<'issue' | 'edit'>('edit');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrItem, setQrItem] = useState<Equipment | null>(null);

  // Ref for infinite scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems(initialData);
  }, [initialData]);

  // Extract unique departments for filter dropdown
  const departments = useMemo(() => {
    const depts = new Set(initialData.map(i => i.department).filter(d => !!d && String(d).trim() !== ''));
    return Array.from(depts).sort();
  }, [initialData]);

  // Filtering Logic
  const filteredItems = useMemo(() => {
    let result = items;

    // Apply strict initial filter (e.g. from Dashboard click)
    if (initialFilter) {
      if (initialFilter.status) {
        // Case insensitive match for status
        const targetStatus = String(initialFilter.status).toLowerCase();
        result = result.filter(i => String(i.status || '').toLowerCase() === targetStatus);
      }
    }

    // Apply Search with strict null safety
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(i => {
        if (!i) return false;
        const nameStr = String(i.name || '').toLowerCase();
        const serialStr = String(i.serialNumber || '').toLowerCase();
        const assigneeStr = String(i.assigneeName || '').toLowerCase();
        const empIdStr = String(i.empId || '').toLowerCase();
        
        return nameStr.includes(lower) || 
               serialStr.includes(lower) || 
               assigneeStr.includes(lower) || 
               empIdStr.includes(lower);
      });
    }


    // Apply Department Filter (Case Insensitive)
    if (filterDept !== 'All') {
      result = result.filter(i => String(i.department || '').toLowerCase() === filterDept.toLowerCase());
    }

    return result;
  }, [items, searchTerm, filterDept, initialFilter]);

  // Infinite Scroll Handler
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        setVisibleCount(prev => Math.min(prev + 20, filteredItems.length));
      }
    }
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, [filteredItems]);


  // Actions
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this equipment? This action cannot be undone.')) {
       await db.delete(id);
       onDataChange();
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Equipment>) => {
    await db.update(id, updates);
    onDataChange();
  };

  const handleExport = () => {
    const header = ['Type', 'Service', 'Dept', 'Status', 'Name', 'Serial', 'Due Date', 'Issue Date', 'EmpID', 'Assignee', 'Location', 'Remarks'];
    const csvContent = [
      header.join(','),
      ...filteredItems.map(i => [
        i.type, i.service, i.department, i.status, i.name, i.serialNumber, 
        i.dueDate, i.issueDate, i.empId, i.assigneeName, i.location, i.remarks
      ].map(f => `"${String(f || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'equipment_list.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json'; 
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
             const json = JSON.parse(e.target?.result as string);
             if (Array.isArray(json)) {
                await db.importBulk(json);
                onDataChange();
                alert('Import successful!');
             } else {
                 alert('Invalid file format: Root must be an array.');
             }
          } catch (err) {
            alert('Invalid JSON file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const getStatusColor = (status: EquipmentStatus) => {
    // Robust status check
    const normalized = String(status || '').toLowerCase();
    switch (normalized) {
      case 'available': return 'bg-green-100 text-green-700';
      case 'assigned': return 'bg-blue-100 text-blue-700';
      case 'maintenance': return 'bg-amber-100 text-amber-700';
      case 'breakdown': return 'bg-red-100 text-red-700';
      case 'disposed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const safeRenderDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString();
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Header Toolbar */}
      <div className="p-4 border-b border-slate-100 bg-white flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
             <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-slate-800">Equipment List</h2>
          {initialFilter?.status && (
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
              Filter: {initialFilter.status}
            </span>
          )}
        </div>

        <div className="flex flex-1 items-center gap-3 justify-end flex-wrap">
          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 w-48 md:w-64"
            />
          </div>

         

          {/* Department Filter (New) */}
          <div className="relative">
             <select 
               value={filterDept}
               onChange={(e) => setFilterDept(e.target.value)}
               className="pl-3 pr-8 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none bg-white cursor-pointer max-w-[140px]"
             >
               <option value="All">All Depts</option>
               {departments.map(d => (
                 <option key={d} value={d}>{d}</option>
               ))}
             </select>
             <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>

          {/* Import/Export */}
          <button onClick={handleExport} className="hidden md:flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200 text-sm font-medium transition-colors">
            <Download size={16} /> Export
          </button>
          <button onClick={handleImportClick} className="hidden md:flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200 text-sm font-medium transition-colors">
            <Upload size={16} /> Import
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto" ref={scrollContainerRef}>
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3">Serial #</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Assigned To</th>
              <th className="px-4 py-3">Due Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.slice(0, visibleCount).map((item) => (
              <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-4 py-3 font-mono text-slate-500 cursor-pointer hover:text-primary hover:underline"
                    onClick={(e) => { e.stopPropagation(); setQrItem(item); setIsQrOpen(true); }}
                >
                  <div className="flex items-center gap-2">
                    <QrCode size={14} />
                    {item.serialNumber || '-'}
                  </div>
                </td>
                <td 
                  className="px-4 py-3 font-medium text-slate-800 cursor-pointer hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItem(item);
                    setModalMode('edit'); // Clicking name opens details edit
                    setIsModalOpen(true);
                  }}
                >
                  {item.name || 'Unnamed Equipment'}
                </td>
                <td className="px-4 py-3 text-slate-600">{item.type}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{item.department || '-'}</td>
                <td className="px-4 py-3 text-slate-600">{item.service || '-'}</td>
                <td className="px-4 py-3 text-slate-600">
                  {item.assigneeName ? (
                    <div className="flex flex-col">
                      <span>{item.assigneeName}</span>
                      <span className="text-xs text-slate-400">{item.empId}</span>
                    </div>
                  ) : '-'}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {safeRenderDate(item.dueDate)}
                </td>
                <td className="px-4 py-3 text-right">
                   <div className="flex items-center justify-end gap-2">
                      <button 
                        title="Issue/Assign"
                        onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setModalMode('issue'); setIsModalOpen(true); }}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                      >
                        <UserPlus size={16} />
                      </button>
                      <button 
                         title="Edit Details"
                         onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setModalMode('edit'); setIsModalOpen(true); }}
                         className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                         title="Delete"
                         onClick={(e) => handleDelete(e, item.id)}
                         className="p-1.5 text-red-500 hover:bg-red-100 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredItems.length === 0 && (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-4">
             <p>No equipment found matching your criteria.</p>
             {items.length === 0 && (
                <button 
                  onClick={handleImportClick}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Upload size={16} /> Import Data File
                </button>
             )}
          </div>
        )}
      </div>

      {selectedItem && (
        <EquipmentModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mode={modalMode}
          equipment={selectedItem}
          onSave={handleUpdate}
        />
      )}

      <QrModal 
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        equipment={qrItem}
      />

    </div>
  );
};

export default EquipmentList;