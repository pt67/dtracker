export enum EquipmentStatus {
  AVAILABLE = 'Available',
  ASSIGNED = 'Assigned',
  MAINTENANCE = 'Maintenance',
  BREAKDOWN = 'Breakdown',
  DISPOSED = 'Disposed'
}

export enum EquipmentType {
  ANDT = 'ANDT',
  NA = 'NA',
  OCTG = 'OCTG',
  MARINE = 'MARINE',
  ACCESSORY = 'Accessory',
  OTHER = 'Other'
}

export interface Equipment {
  id: string;
  type: EquipmentType;
  service: string; // e.g., 'IT Support', 'Engineering'
  department: string;
  status: EquipmentStatus;
  name: string; // Model Name
  serialNumber: string;
  dueDate: string; // ISO Date String
  issueDate: string; // ISO Date String
  empId: string;
  assigneeName: string;
  location: string;
  remarks: string;
  createdAt: string;
}

export interface DashboardStats {
  totalByType: Record<string, number>;
  expiredCount: number;
  breakdownCount: number;
  maintenanceCount: number;
  totalCount: number;
}
