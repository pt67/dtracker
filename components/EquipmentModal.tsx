import React, { useState, useEffect } from 'react';
import { Equipment, EquipmentStatus } from '../types';
import { X } from 'lucide-react';

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'issue' | 'edit';
  equipment: Equipment;
  onSave: (id: string, data: Partial<Equipment>) => Promise<void>;
}

const EquipmentModal: React.FC<EquipmentModalProps> = ({ isOpen, onClose, mode, equipment, onSave }) => {
  const [formData, setFormData] = useState<Partial<Equipment>>({});
  const [loading, setLoading] = useState(false);

  // Helper to safely convert any date string to YYYY-MM-DD for input fields
  const safeDateToInput = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return ''; // Return empty if invalid date
    try {
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  useEffect(() => {
    if (equipment) {
      setFormData({
        status: equipment.status,
        issueDate: safeDateToInput(equipment.issueDate),
        dueDate: safeDateToInput(equipment.dueDate),
        empId: equipment.empId,
        assigneeName: equipment.assigneeName,
        location: equipment.location,
        remarks: equipment.remarks,
        name: equipment.name, // Allow name edit in 'edit' mode
      });
    }
  }, [equipment, mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Logic specific to mode
    let updates = { ...formData };
    if (mode === 'issue') {
      updates.status = EquipmentStatus.ASSIGNED;
    }
    
    // Ensure dates are ISO. If user cleared the date, send empty string.
    if (updates.issueDate) {
       const d = new Date(updates.issueDate as string);
       if (!isNaN(d.getTime())) updates.issueDate = d.toISOString();
    }
    if (updates.dueDate) {
       const d = new Date(updates.dueDate as string);
       if (!isNaN(d.getTime())) updates.dueDate = d.toISOString();
    }

    await onSave(equipment.id, updates);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">
            {mode === 'issue' ? 'Issue Equipment' : 'Edit Equipment Details'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {mode === 'edit' && (
             <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  {Object.values(EquipmentStatus).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Equipment Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
               </div>
             </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Issue Date</label>
              <input 
                type="date" 
                name="issueDate" 
                value={formData.issueDate as string || ''} 
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
              <input 
                type="date" 
                name="dueDate" 
                value={formData.dueDate as string || ''} 
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Employee ID</label>
              <input 
                type="text" 
                name="empId" 
                value={formData.empId || ''} 
                onChange={handleChange}
                placeholder="e.g. EMP123"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assignee Name</label>
              <input 
                type="text" 
                name="assigneeName" 
                value={formData.assigneeName || ''} 
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
            <input 
              type="text" 
              name="location" 
              value={formData.location || ''} 
              onChange={handleChange}
              placeholder="e.g. Building A, Floor 2"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
            <textarea 
              name="remarks" 
              value={formData.remarks || ''} 
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 bg-primary text-white hover:bg-blue-600 rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EquipmentModal;