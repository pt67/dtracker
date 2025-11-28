import React from 'react';
import { Equipment } from '../types';
import { X, Calendar, User, MapPin } from 'lucide-react';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment | null;
}

const QrModal: React.FC<QrModalProps> = ({ isOpen, onClose, equipment }) => {
  if (!isOpen || !equipment) return null;

  // Generate QR code URL using a public API for demonstration
  // In a real app, use a library like 'qrcode.react'
  const qrData = JSON.stringify({
    id: equipment.id,
    sn: equipment.serialNumber,
    assignedTo: equipment.assigneeName
  });
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;

  // Safe date calculation
  let daysRemaining = 0;
  let dateValid = false;
  if (equipment.dueDate) {
     const d = new Date(equipment.dueDate);
     if (!isNaN(d.getTime())) {
        dateValid = true;
        daysRemaining = Math.ceil((d.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
     }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-2 flex justify-end">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>
        
        <div className="px-6 pb-8 text-center">
          <h3 className="text-xl font-bold text-slate-800 mb-1">{equipment.name}</h3>
          <p className="text-sm text-slate-500 font-mono mb-6">{equipment.serialNumber}</p>
          
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-white border-2 border-slate-100 rounded-xl shadow-sm">
                <img src={qrUrl} alt="QR Code" className="w-48 h-48 object-contain" />
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 space-y-3 text-left">
            <div className="flex items-start gap-3">
               <User className="w-5 h-5 text-slate-400 mt-0.5" />
               <div>
                 <p className="text-xs text-slate-400 font-medium uppercase">Assigned To</p>
                 <p className="text-sm font-semibold text-slate-700">{equipment.assigneeName || 'Unassigned'}</p>
                 {equipment.empId && <p className="text-xs text-slate-500">{equipment.empId}</p>}
               </div>
            </div>

            <div className="flex items-start gap-3">
               <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
               <div>
                 <p className="text-xs text-slate-400 font-medium uppercase">Location</p>
                 <p className="text-sm font-semibold text-slate-700">{equipment.location || 'N/A'}</p>
               </div>
            </div>

            <div className="flex items-start gap-3">
               <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
               <div>
                 <p className="text-xs text-slate-400 font-medium uppercase">Validity</p>
                 <p className="text-sm font-semibold text-slate-700">
                   {dateValid 
                      ? (daysRemaining > 0 ? `${daysRemaining} Days Remaining` : 'Expired')
                      : 'No Date'}
                 </p>
                 <p className="text-xs text-slate-500">Due: {dateValid ? new Date(equipment.dueDate).toLocaleDateString() : '-'}</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QrModal;