
import { Truck, TruckStatus, User, UserRole, AuditLog } from '../types';

// Mock Users based on specific email patterns
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Guelord Mukoka', email: 'guelord.mukoka@pcpcbrdc.com', role: UserRole.CG },
  { id: 'u2', name: 'Pierre Esaki', email: 'pierre.esaki@pcpcbrdc.com', role: UserRole.CGA },
  { id: 'u3', name: 'Jean Dupont', email: 'jean.dupont-ops@pcpcbrdc.com', role: UserRole.OPS },
  { id: 'u4', name: 'Marie Chef', email: 'marie.chef-cs@pcpcbrdc.com', role: UserRole.CS },
  { id: 'u5', name: 'Paul System', email: 'paul.system-as@pcpcbrdc.com', role: UserRole.AS },
];

// Initial Trucks Data
const INITIAL_TRUCKS: Truck[] = [
  {
    id: 't1',
    plateNumber: '1234-AB-19',
    driverName: 'Musa Kabwe',
    company: 'LogiTrans',
    cargoType: 'Cuivre',
    status: TruckStatus.VALIDATED_OK,
    registeredAt: new Date(Date.now() - 86400000).toISOString(),
    paidAt: new Date(Date.now() - 80000000).toISOString(),
    ticketNumber: 'TK-88291',
    scannedAt: new Date(Date.now() - 78000000).toISOString(),
    validatedAt: new Date(Date.now() - 77000000).toISOString(),
    scanImageUrl: 'https://picsum.photos/400/300',
    processedBy: 'Marie Chef'
  },
  {
    id: 't2',
    plateNumber: '9988-CD-20',
    driverName: 'John Doe',
    company: 'FastCargo',
    cargoType: 'Cobalt',
    status: TruckStatus.PAID, // Ready for scan
    registeredAt: new Date().toISOString(),
    paidAt: new Date().toISOString(),
    ticketNumber: 'TK-99100',
  },
  {
    id: 't3',
    plateNumber: '5544-EF-21',
    driverName: 'Ali Hassan',
    company: 'TransNord',
    cargoType: 'Cuivre',
    status: TruckStatus.REGISTERED, // Needs payment
    registeredAt: new Date().toISOString(),
  }
];

// In-memory "Database"
let trucksStore = [...INITIAL_TRUCKS];
let auditStore: AuditLog[] = [];

// Helper to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const TruckService = {
  getTrucks: async (): Promise<Truck[]> => {
    await delay(300);
    return [...trucksStore];
  },

  getById: async (id: string): Promise<Truck | undefined> => {
    await delay(200);
    return trucksStore.find(t => t.id === id);
  },

  registerTruck: async (data: Omit<Truck, 'id' | 'status' | 'registeredAt'>, user: User): Promise<Truck> => {
    await delay(500);
    const newTruck: Truck = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      status: TruckStatus.REGISTERED,
      registeredAt: new Date().toISOString(),
      processedBy: user.name
    };
    trucksStore = [newTruck, ...trucksStore];
    addAuditLog(`CD-24 Saisie camion ${newTruck.plateNumber}`, user);
    return newTruck;
  },

  confirmPayment: async (id: string, ticketNumber: string, user: User): Promise<void> => {
    await delay(400);
    trucksStore = trucksStore.map(t => 
      t.id === id ? { 
        ...t, 
        status: TruckStatus.PAID, 
        paidAt: new Date().toISOString(),
        ticketNumber: ticketNumber
      } : t
    );
    addAuditLog(`Paiement 100$ confirmé (Ticket: ${ticketNumber}) pour camion ${id}`, user);
  },

  submitScan: async (id: string, imageUrl: string, user: User): Promise<void> => {
    await delay(800);
    trucksStore = trucksStore.map(t => 
      t.id === id ? { 
        ...t, 
        status: TruckStatus.SCANNED, 
        scannedAt: new Date().toISOString(), 
        scanImageUrl: imageUrl,
        processedBy: user.name
      } : t
    );
    addAuditLog(`CD-36 Scan ZBV effectué pour camion ${id}`, user);
  },

  // New Method for AS to Scan AND Validate (Close)
  scanAndValidate: async (id: string, imageUrl: string, status: TruckStatus, comment: string, user: User): Promise<void> => {
    await delay(800);
    trucksStore = trucksStore.map(t => 
      t.id === id ? { 
        ...t, 
        status: status, 
        scannedAt: new Date().toISOString(), 
        validatedAt: new Date().toISOString(), // Closing time
        scanImageUrl: imageUrl,
        suspicionComment: comment,
        processedBy: user.name
      } : t
    );
    addAuditLog(`Scan ZBV & Clôture dossier (${status}) pour camion ${id}`, user);
  },

  validateScan: async (id: string, status: TruckStatus.VALIDATED_OK | TruckStatus.SUSPICION, comment: string, user: User): Promise<void> => {
    await delay(400);
    trucksStore = trucksStore.map(t => 
      t.id === id ? { 
        ...t, 
        status: status, 
        validatedAt: new Date().toISOString(), 
        suspicionComment: comment,
        processedBy: user.name
      } : t
    );
    addAuditLog(`CD-35 Validation ${status} pour camion ${id}`, user);
  }
};

const addAuditLog = (action: string, user: User) => {
  const log: AuditLog = {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    action,
    details: `Effectué par ${user.name} (${user.role})`,
    userId: user.id,
    userName: user.name
  };
  auditStore = [log, ...auditStore];
};

export const AuditService = {
  getLogs: async (): Promise<AuditLog[]> => {
    await delay(200);
    return [...auditStore];
  }
};
