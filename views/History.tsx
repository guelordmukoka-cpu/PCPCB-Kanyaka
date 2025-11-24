
import React, { useState } from 'react';
import { Card, StatusBadge, Button } from '../components/Widgets';
import { Truck } from '../types';
import { Download, Search, Filter } from 'lucide-react';

export const HistoryView: React.FC<{ trucks: Truck[] }> = ({ trucks }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredTrucks = trucks.filter(t => {
    const matchesSearch = t.plateNumber.includes(searchTerm.toUpperCase()) || t.driverName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || t.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleExport = () => {
    // Mock CSV Export
    const headers = ["ID", "Plaque", "Chauffeur", "Compagnie", "Cargaison", "Ticket", "Statut", "Date Enreg."];
    const rows = filteredTrucks.map(t => [t.id, t.plateNumber, t.driverName, t.company, t.cargoType, t.ticketNumber || '', t.status, t.registeredAt]);
    
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rapport_pcpcb_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Historique & Rapports</h2>
        <Button onClick={handleExport} variant="outline">
          <Download size={18} /> Exporter CSV/Excel
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher plaque, chauffeur..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pcpcb-green outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative w-full md:w-64">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pcpcb-green outline-none bg-white appearance-none"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="ALL">Tous les statuts</option>
              <option value="ENREGISTRÉ">Enregistré (Attente Paiement)</option>
              <option value="PAYÉ">Payé (Attente Scan)</option>
              <option value="SCANNÉ">Scanné (Attente Valid)</option>
              <option value="TERMINÉ - OK">Terminé OK</option>
              <option value="SUSPICION">Suspicion</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Plaque</th>
                <th className="p-4">Cargaison</th>
                <th className="p-4">Ticket</th>
                <th className="p-4">Statut</th>
                <th className="p-4">Validé Par</th>
                <th className="p-4 text-right">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTrucks.map(truck => (
                <tr key={truck.id} className="hover:bg-gray-50 group">
                  <td className="p-4 text-gray-500 whitespace-nowrap">{new Date(truck.registeredAt).toLocaleDateString()}</td>
                  <td className="p-4 font-bold text-gray-800">{truck.plateNumber}</td>
                  <td className="p-4">{truck.cargoType}</td>
                  <td className="p-4 font-mono text-gray-500">{truck.ticketNumber || '-'}</td>
                  <td className="p-4"><StatusBadge status={truck.status} /></td>
                  <td className="p-4 text-gray-500">{truck.processedBy || '-'}</td>
                  <td className="p-4 text-right">
                    <button className="text-pcpcb-green hover:underline font-medium">Voir Rapport PDF</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTrucks.length === 0 && (
             <div className="p-8 text-center text-gray-400">Aucun résultat trouvé.</div>
          )}
        </div>
      </Card>
    </div>
  );
};
