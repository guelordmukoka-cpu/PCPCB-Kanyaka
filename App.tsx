
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Login } from './views/Login';
import { Dashboard } from './views/Dashboard';
import { Registration } from './views/Registration';
import { PaymentView, ScannerView, ValidationView } from './views/Operations';
import { HistoryView } from './views/History';
import { User, Truck, UserRole } from './types';
import { TruckService } from './services/mockData';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch data on load and on interactions
  const refreshData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await TruckService.getTrucks();
      setTrucks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshData();
      const interval = setInterval(refreshData, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    
    // Automatic Redirection based on Role (Strict Workflow)
    switch (loggedInUser.role) {
      case UserRole.OPS:
        setCurrentView('register');
        break;
      case UserRole.AS:
        setCurrentView('scanner');
        break;
      case UserRole.CS:
        setCurrentView('dashboard'); // CS starts at Dashboard for site overview
        break;
      case UserRole.CG:
      case UserRole.CGA:
        setCurrentView('dashboard');
        break;
      default:
        setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setTrucks([]);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Strict View Guard
  // Ensures a user cannot manually force a view they don't have access to
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        if ([UserRole.CG, UserRole.CGA, UserRole.CS].includes(user.role)) {
            return <Dashboard trucks={trucks} user={user} />;
        }
        return <div className="p-10 text-center text-red-500">Accès non autorisé au Dashboard.</div>;

      case 'register':
        if (user.role === UserRole.OPS) {
            // Updated to pass trucks and refreshData for the integrated payment view
            return <Registration user={user} trucks={trucks} onRefresh={refreshData} />;
        }
        return <div className="p-10 text-center text-red-500">Accès réservé aux OPS.</div>;

      // 'payment' route is removed from navigation but kept as fallback if needed, 
      // though Registration now handles it.
      case 'payment':
        if (user.role === UserRole.OPS) {
            return <PaymentView trucks={trucks} user={user} refresh={refreshData} />;
        }
        return <div className="p-10 text-center text-red-500">Accès réservé aux OPS.</div>;

      case 'scanner':
        if (user.role === UserRole.AS) {
            return <ScannerView trucks={trucks} user={user} refresh={refreshData} />;
        }
        return <div className="p-10 text-center text-red-500">Accès réservé aux AS.</div>;

      case 'validation':
        if (user.role === UserRole.CS) {
            return <ValidationView trucks={trucks} user={user} refresh={refreshData} />;
        }
        return <div className="p-10 text-center text-red-500">Accès réservé au Chef de Site.</div>;

      case 'history':
        if ([UserRole.CG, UserRole.CGA, UserRole.CS].includes(user.role)) {
            return <HistoryView trucks={trucks} />;
        }
        return <div className="p-10 text-center text-red-500">Accès non autorisé.</div>;

      case 'audit':
        if ([UserRole.CG, UserRole.CGA].includes(user.role)) {
            return <div className="p-8 text-center text-gray-500 font-medium bg-white rounded-lg border border-dashed">
                Module Audit Système (Logs Complets & Intégrité Données) <br/>
                <span className="text-sm text-gray-400">Accessible uniquement à la Coordination Générale</span>
            </div>;
        }
        return <div className="p-10 text-center text-red-500">Accès non autorisé.</div>;

      default:
        return <div>Vue introuvable</div>;
    }
  };

  return (
    <Layout user={user} onLogout={handleLogout} currentView={currentView} onNavigate={setCurrentView}>
      {loading && (
        <div className="fixed top-4 right-4 bg-white px-3 py-1 rounded-full shadow-lg border border-gray-100 text-xs text-pcpcb-green font-bold animate-pulse z-50 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-pcpcb-green"></div>
          Sync Kanyaka...
        </div>
      )}
      {renderView()}
    </Layout>
  );
}
