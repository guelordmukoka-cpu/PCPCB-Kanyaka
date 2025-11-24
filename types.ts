
export enum UserRole {
  OPS = 'OPS', // Opérateur de Saisie (CD-24/25, Paiement)
  CS = 'CS',   // Chef de Site (Validation, CD-35, Perf)
  AS = 'AS',   // Opérateur Système (Scanner ZBV, CD-36)
  CG = 'CG',   // Coordonnateur Général (Dashboard, Finance, Audit)
  CGA = 'CGA', // Coordonnateur Général Adjoint (Dashboard, Ops, Tech)
}

export enum TruckStatus {
  REGISTERED = 'ENREGISTRÉ', // En attente paiement
  PAID = 'PAYÉ', // Prêt pour scan
  SCANNED = 'SCANNÉ', // En attente validation
  VALIDATED_OK = 'TERMINÉ - OK',
  SUSPICION = 'SUSPICION',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Truck {
  id: string;
  plateNumber: string;
  driverName: string;
  company: string;
  cargoType: 'Cuivre' | 'Cobalt' | 'Autre';
  status: TruckStatus;
  registeredAt: string; // ISO Date
  paidAt?: string;
  ticketNumber?: string; // Nouveau champ pour le numéro de reçu
  scannedAt?: string;
  scanImageUrl?: string;
  pdfUrl?: string;
  validatedAt?: string;
  suspicionComment?: string;
  processedBy?: string; // ID of last agent
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  userId: string;
  userName: string;
}

export interface DashboardStats {
  totalTrucks: number;
  revenue: number; // 100 USD per truck
  suspicions: number;
  pendingScan: number;
}
