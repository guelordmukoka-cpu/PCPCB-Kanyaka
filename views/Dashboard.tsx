
import React, { useMemo } from 'react';
import { Truck, TruckStatus, User, UserRole } from '../types';
import { StatCard, Card } from '../components/Widgets';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Truck as TruckIcon, AlertTriangle, Wallet, Users, Activity, Clock } from 'lucide-react';

interface DashboardProps {
  trucks: Truck[];
  user: User;
}

const COLORS = ['#1EB980', '#3B82F6', '#F59E0B', '#EF4444', '#6366F1'];

export const Dashboard: React.FC<DashboardProps> = ({ trucks, user }) => {
  const isFinance = user.role === UserRole.CG;
  const isOps = user.role === UserRole.CGA || user.role === UserRole.CG || user.role === UserRole.CS;

  // Calculate Stats
  const stats = useMemo(() => {
    // Calculate Average Processing Time (Registered -> Validated)
    const completedTrucks = trucks.filter(t => t.validatedAt && t.registeredAt);
    let avgTimeMinutes = 0;
    
    if (completedTrucks.length > 0) {
      const totalDuration = completedTrucks.reduce((acc, t) => {
        const start = new Date(t.registeredAt).getTime();
        const end = new Date(t.validatedAt!).getTime();
        return acc + (end - start);
      }, 0);
      avgTimeMinutes = Math.floor((totalDuration / completedTrucks.length) / 60000); // ms to minutes
    }
    
    // Format nicely
    const avgTimeString = avgTimeMinutes > 60 
      ? `${Math.floor(avgTimeMinutes / 60)}h ${avgTimeMinutes % 60}m` 
      : `${avgTimeMinutes} min`;

    return {
      total: trucks.length,
      revenue: trucks.filter(t => t.status !== TruckStatus.REGISTERED).length * 100,
      suspicions: trucks.filter(t => t.status === TruckStatus.SUSPICION).length,
      today: trucks.filter(t => new Date(t.registeredAt).toDateString() === new Date().toDateString()).length,
      waitingScan: trucks.filter(t => t.status === TruckStatus.PAID).length,
      avgTime: avgTimeString
    };
  }, [trucks]);

  // Data for Charts
  const statusData = useMemo(() => {
    const counts = trucks.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [trucks]);

  const agentPerformance = useMemo(() => {
     // Mock agent performance data
     return [
         { name: 'Jean OPS', value: 12 },
         { name: 'Paul AS', value: 8 },
         { name: 'Marie CS', value: 5 },
     ]
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">
                {user.role === UserRole.CG ? 'Dashboard Général & Financier' : 
                 user.role === UserRole.CS ? 'Supervision Site & Opérations' : 'Tableau de Bord'}
            </h2>
            <p className="text-gray-500">
                Vue {user.role === UserRole.CG ? 'Stratégique' : 'Opérationnelle'} - {new Date().toLocaleDateString()}
            </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-sm font-medium text-gray-600">
            Utilisateur connecté: <span className="text-pcpcb-green font-bold">{user.email}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Camions" value={stats.total} icon={TruckIcon} colorClass="bg-blue-500 text-blue-500" />
        {isFinance && (
            <StatCard title="Recettes (USD)" value={`$${stats.revenue.toLocaleString()}`} icon={Wallet} colorClass="bg-emerald-500 text-emerald-500" />
        )}
        <StatCard title="Temps Moyen Traitement" value={stats.avgTime} icon={Clock} colorClass="bg-orange-500 text-orange-500" />
        <StatCard title="Suspicions" value={stats.suspicions} icon={AlertTriangle} colorClass="bg-red-500 text-red-500" />
      </div>

      {/* CS View: Agent Performance */}
      {user.role === UserRole.CS && (
        <Card className="bg-gray-800 text-white">
            <div className="flex items-center gap-2 mb-4">
                <Users size={20} className="text-pcpcb-green" />
                <h3 className="font-bold text-lg">Performance Équipe (Temps Réel)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {agentPerformance.map((agent, i) => (
                    <div key={i} className="bg-white/10 p-4 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="text-gray-300 text-sm">{agent.name}</p>
                            <p className="text-xs text-gray-400">En ligne</p>
                        </div>
                        <div className="text-2xl font-bold text-pcpcb-green">{agent.value} <span className="text-xs text-white/50">ops/h</span></div>
                    </div>
                ))}
            </div>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-80">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Flux des Camions</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} interval={0} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: '#f3f4f6' }} />
              <Bar dataKey="value" fill="#1EB980" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Derniers Mouvements</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
              <tr>
                <th className="p-3 font-medium">Plaque</th>
                <th className="p-3 font-medium">Chauffeur</th>
                <th className="p-3 font-medium">Statut</th>
                <th className="p-3 font-medium">Opérateur</th>
                <th className="p-3 font-medium">Heure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {trucks.slice(0, 5).map(truck => (
                <tr key={truck.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 font-medium text-gray-900">{truck.plateNumber}</td>
                  <td className="p-3">{truck.driverName}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      truck.status === TruckStatus.SUSPICION ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {truck.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs">{truck.processedBy || 'Système'}</td>
                  <td className="p-3 text-gray-500">
                    {new Date(truck.registeredAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
