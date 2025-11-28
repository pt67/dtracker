import { Equipment, EquipmentStatus, EquipmentType } from '../types';

// Key for local storage
const STORAGE_KEY = 'dtracker_equipment_data';

// Helper to generate a random ID
const generateId = (): string => Math.random().toString(36).substr(2, 9);

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const safeDate = (val: any): string => {
   if (!val) return '';
   const d = new Date(val);
   // If it's a valid date, we attempt to standardise to ISO string for consistency
   // If it's invalid, we return the empty string to prevent crashes downstream
   if (!isNaN(d.getTime())) {
     try {
       return d.toISOString();
     } catch (e) {
       return '';
     }
   }
   return ''; 
};

// Helper to normalize strings (trim and title case for Enums)
const normalizeEnum = (val: any, fallback: string): string => {
  const str = String(val || '').trim();
  if (!str) return fallback;
  // Convert "laptop" or "LAPTOP" to "Laptop"
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const db = {
  getAll: async (): Promise<Equipment[]> => {
    await delay(300);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Return empty array instead of seeding dummy data
      return [];
    }
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse equipment data", e);
      return [];
    }
  },

  update: async (id: string, updates: Partial<Equipment>): Promise<Equipment> => {
    await delay(200);
    const stored = localStorage.getItem(STORAGE_KEY);
    const items: Equipment[] = stored ? JSON.parse(stored) : [];
    // Ensure strict string comparison
    const index = items.findIndex(item => String(item.id) === String(id));
    
    if (index === -1) throw new Error('Item not found');
    
    const updatedItem = { ...items[index], ...updates };
    items[index] = updatedItem;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return updatedItem;
  },

  add: async (item: Omit<Equipment, 'id' | 'createdAt'>): Promise<Equipment> => {
    await delay(200);
    const stored = localStorage.getItem(STORAGE_KEY);
    const items: Equipment[] = stored ? JSON.parse(stored) : [];
    
    const newItem: Equipment = {
      ...item,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    
    items.push(newItem);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return newItem;
  },

  delete: async (id: string): Promise<void> => {
    await delay(200);
    const stored = localStorage.getItem(STORAGE_KEY);
    const items: Equipment[] = stored ? JSON.parse(stored) : [];
    // Ensure strict string comparison for filtering
    const filtered = items.filter(item => String(item.id) !== String(id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  // Accepts any array and maps fields to the strict Equipment interface
  importBulk: async (newItems: any[]): Promise<void> => {
     await delay(500);
     const stored = localStorage.getItem(STORAGE_KEY);
     const currentItems: Equipment[] = stored ? JSON.parse(stored) : [];
     
     // Process imported items to ensure they have IDs and safe defaults
     // Also maps snake_case keys (common in DB dumps) to camelCase
     // STRICTLY converts to String to avoid .toLowerCase() crashes on numbers
     const processed = newItems.map(item => {
        // Map Serial Number
        const rawSerial = item.serialNumber || item.serial_number || item.SerialNumber || 'N/A';
        const serialNumber = String(rawSerial);
        
        // Map Dates (Sanitize)
        const dueDate = safeDate(item.dueDate || item.due_date);
        const issueDate = safeDate(item.issueDate || item.issue_date);
        
        // Map Employee/User info
        const empId = String(item.empId || item.emp_id || item.employee_id || '');
        
        // Handle logic where 'equipment_name' is provided separate from 'name' (person)
        // Default: internal 'name' is the Equipment Model Name.
        let nameVal = item.name || item.equipment_name || 'Unknown Equipment';
        let assigneeVal = item.assigneeName || item.assignee_name || '';

        // If 'equipment_name' exists in JSON, use it for the Equipment Name
        // and treat 'name' as the person's name if 'assigneeName' is missing.
        if (item.equipment_name) {
            nameVal = item.equipment_name;
            if (item.name && !assigneeVal) {
                assigneeVal = item.name;
            }
        }

        return {
          ...item,
          // CRITICAL: Ensure ID is a string to prevent delete/edit failures with numeric IDs in JSON
          id: item.id ? String(item.id) : generateId(),
          createdAt: item.createdAt || new Date().toISOString(),
          // Apply Mapped Fields
          serialNumber,
          dueDate,
          issueDate,
          empId,
          name: String(nameVal),
          assigneeName: String(assigneeVal),
          // Normalize Enums (fix 'laptop' -> 'Laptop', 'breakdown' -> 'Breakdown')
          status: normalizeEnum(item.status, 'Available'),
          type: normalizeEnum(item.type, 'Other'),
          // Ensure other strings are not undefined and are strings
          location: String(item.location || ''),
          remarks: String(item.remarks || ''),
          service: String(item.service || item.services || ''), // Map 'services' to 'service'
          department: String(item.department || '')
        };
     }) as Equipment[];

     const merged = [...currentItems, ...processed];
     localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  }
};