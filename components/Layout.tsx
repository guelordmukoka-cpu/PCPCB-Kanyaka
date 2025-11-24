
import React from 'react';
import { User, UserRole } from '../types';
import { 
  Truck, 
  CreditCard, 
  ScanLine, 
  LayoutDashboard, 
  LogOut, 
  History, 
  FileCheck,
  ShieldAlert,
  Menu,
  X,
  FileText
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentView, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    // CG, CGA, CS
    { 
      id: 'dashboard', 
      label: 'Dashboard Global', 
      icon: LayoutDashboard, 
      roles: [UserRole.CG, UserRole.CGA, UserRole.CS] 
    },
    // OPS (Saisie + Doc + Paiement integrated)
    { 
      id: 'register', 
      label: 'Saisie, Docs & Caisse', 
      icon: FileText, 
      roles: [UserRole.OPS] 
    },
    // AS (Scanner)
    { 
      id: 'scanner', 
      label: 'Scanner ZBV (CD-36)', 
      icon: ScanLine, 
      roles: [UserRole.AS] 
    },
    // CS (Validation)
    { 
      id: 'validation', 
      label: 'Validation (CD-35)', 
      icon: FileCheck, 
      roles: [UserRole.CS] 
    },
    // CG, CGA, CS
    { 
      id: 'history', 
      label: 'Historique & Rapports', 
      icon: History, 
      roles: [UserRole.CG, UserRole.CGA, UserRole.CS] 
    },
    // CG, CGA
    { 
      id: 'audit', 
      label: 'Audit Système', 
      icon: ShieldAlert, 
      roles: [UserRole.CG, UserRole.CGA] 
    },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(user.role));

  const NavContent = () => (
    <>
      <div className="flex items-center gap-3 px-6 py-6 border-b border-pcpcb-dark/20">
        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-pcpcb-green font-bold text-xl shadow-lg">
          P
        </div>
        <div>
          <h1 className="text-white font-bold text-lg tracking-wide">PCPCB</h1>
          <p className="text-pcpcb-light text-xs opacity-80">Site Kanyaka</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {filteredNav.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onNavigate(item.id);
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentView === item.id
                ? 'bg-white/10 text-white shadow-md font-medium border-l-4 border-white'
                : 'text-pcpcb-light hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-pcpcb-dark/20">
        <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-black/10 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs uppercase">
            {user.role}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user.name}</p>
            <p className="text-pcpcb-light text-[10px] truncate opacity-80 uppercase tracking-wider">{user.role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-4 py-2 text-red-200 hover:text-white hover:bg-red-500/20 rounded-md transition-colors text-sm"
        >
          <LogOut size={16} />
          <span>Déconnexion</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-pcpcb-green shadow-xl z-20">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-pcpcb-green h-16 flex items-center justify-between px-4 z-30 shadow-md">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-pcpcb-green font-bold">P</div>
            <span className="text-white font-bold">PCPCB Kanyaka</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-white">
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            className="absolute left-0 top-0 bottom-0 w-72 bg-pcpcb-green flex flex-col shadow-2xl animate-slide-in"
            onClick={e => e.stopPropagation()}
          >
             <div className="flex justify-end p-4">
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-white">
                    <X size={24} />
                </button>
             </div>
             <NavContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 mt-16 md:mt-0">
          <div className="max-w-7xl mx-auto animate-fade-in pb-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
