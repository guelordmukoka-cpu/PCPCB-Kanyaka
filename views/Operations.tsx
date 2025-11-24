
import React, { useState } from 'react';
import { Card, Button, StatusBadge } from '../components/Widgets';
import { Truck, TruckStatus, UserRole } from '../types';
import { TruckService } from '../services/mockData';
import { Search, DollarSign, Scan, CheckCircle, AlertTriangle, Upload, Eye, FileCheck, XCircle } from 'lucide-react';

// Helper Formspree
const sendToFormspree = (data: Record<string, string>) => {
    const formPayload = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        formPayload.append(key, value);
    });
    
    fetch("https://formspree.io/f/mldkewbw", {
        method: "POST",
        body: formPayload,
        headers: {
            'Accept': 'application/json'
        }
    }).catch(err => console.error("Erreur envoi Formspree:", err));
};

// Sub-component for Payment (Legacy/Fallback if needed, but logic moved to Registration)
export const PaymentView: React.FC<{ trucks: Truck[], user: any, refresh: () => void }> = ({ trucks, user, refresh }) => {
  const pendingTrucks = trucks.filter(t => t.status === TruckStatus.REGISTERED);
  
  const handlePayment = async (id: string) => {
    const ticket = prompt("Veuillez saisir le numéro du ticket de paiement :");
    if (ticket && ticket.trim() !== "") {
        await TruckService.confirmPayment(id, ticket, user);
        refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-2xl font-bold text-gray-800">Caisse / Paiement</h2>
            <p className="text-gray-500">Validation des frais de scan (OPS uniquement)</p>
         </div>
         <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">100 USD / Camion</div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pendingTrucks.length === 0 ? (
          <p className="text-gray-500 col-span-3 text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
              Aucun camion en attente de paiement.
          </p>
        ) : (
          pendingTrucks.map(truck => (
            <Card key={truck.id} className="hover:shadow-md transition-shadow border-l-4 border-l-amber-500">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-gray-100 p-2 rounded-lg font-mono font-bold text-lg text-gray-800">{truck.plateNumber}</div>
                <StatusBadge status={truck.status} />
              </div>
              <div className="space-y-2 text-sm text-gray-600 mb-6">
                <p><span className="font-semibold">Chauffeur:</span> {truck.driverName}</p>
                <p><span className="font-semibold">Cargaison:</span> {truck.cargoType}</p>
                <p><span className="font-semibold">Compagnie:</span> {truck.company}</p>
              </div>
              <Button onClick={() => handlePayment(truck.id)} className="w-full">
                <DollarSign size={18} /> Encaisser (Saisir Ticket)
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

// Sub-component for Scanner (AS Only)
export const ScannerView: React.FC<{ trucks: Truck[], user: any, refresh: () => void }> = ({ trucks, user, refresh }) => {
  // Only trucks that are PAID are ready for ZBV scan
  const readyForScan = trucks.filter(t => t.status === TruckStatus.PAID);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [suspicionMode, setSuspicionMode] = useState(false);
  const [comment, setComment] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleFinishScan = async (status: TruckStatus) => {
    if (!selectedTruck || !previewUrl) return;
    
    if (status === TruckStatus.SUSPICION && !comment.trim()) {
        alert("Veuillez saisir un motif pour la suspicion.");
        return;
    }

    if (!confirm(`Confirmer la clôture du dossier avec statut : ${status} ?`)) return;

    setProcessing(true);
    
    // Envoi Formspree
    sendToFormspree({
        _subject: `PCPCB - Scan ZBV ${status} : ${selectedTruck.plateNumber}`,
        type_action: 'SCAN_ZBV_VALIDATION',
        statut_final: status,
        plate_number: selectedTruck.plateNumber,
        driver_name: selectedTruck.driverName,
        agent_scanner: user.email,
        commentaire: comment || 'R.A.S.',
        ticket_paiement: selectedTruck.ticketNumber || 'N/A'
    });

    // Use the new method to scan AND validate/close in one step
    await TruckService.scanAndValidate(selectedTruck.id, previewUrl, status, comment, user);
    setProcessing(false);
    
    // Reset state
    setSelectedTruck(null);
    setImageFile(null);
    setPreviewUrl(null);
    setSuspicionMode(false);
    setComment('');
    
    refresh();
  };

  if (selectedTruck) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="secondary" onClick={() => setSelectedTruck(null)}>Retour File d'attente</Button>
          <div>
            <h2 className="text-2xl font-bold">Scanner ZBV: {selectedTruck.plateNumber}</h2>
            <p className="text-gray-500 text-sm">Opérateur Système (AS) - Clôture Dossier</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 space-y-4 h-fit">
                <h3 className="font-bold text-gray-700 border-b pb-2">Fiche Technique</h3>
                <div className="space-y-3 text-sm text-gray-600">
                    <div>
                        <span className="block text-xs text-gray-400">Chauffeur</span>
                        <span className="font-medium">{selectedTruck.driverName}</span>
                    </div>
                    <div>
                        <span className="block text-xs text-gray-400">Compagnie</span>
                        <span className="font-medium">{selectedTruck.company}</span>
                    </div>
                    <div>
                        <span className="block text-xs text-gray-400">Cargaison Déclarée</span>
                        <span className="font-medium">{selectedTruck.cargoType}</span>
                    </div>
                    <div>
                        <span className="block text-xs text-gray-400">Paiement</span>
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle size={12}/> Validé
                        </span>
                        <span className="block text-[10px] text-gray-500 mt-0.5">Ticket: {selectedTruck.ticketNumber}</span>
                    </div>
                </div>
            </Card>

            <Card className="md:col-span-2">
                <h3 className="font-bold text-gray-700 mb-4">1. Acquisition Image ZBV</h3>
                
                <div className="bg-gray-900 rounded-lg flex items-center justify-center min-h-[300px] border border-gray-700 overflow-hidden relative mb-4">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                    ) : (
                        <div className="text-center text-gray-500">
                            <Eye size={48} className="mx-auto mb-2 opacity-30" />
                            <p>En attente de l'image scanner...</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-6">
                    {!previewUrl && (
                        <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            <div className="flex flex-col items-center justify-center gap-2 text-gray-600">
                                <Upload size={32} />
                                <span className="font-medium text-lg">Charger l'image du ZBV</span>
                            </div>
                        </label>
                    )}

                    {previewUrl && (
                        <div className="animate-fade-in space-y-4">
                            <div className="flex items-center justify-between border-b pb-4 mb-4">
                                <h3 className="font-bold text-gray-700">2. Analyse & Validation Finale</h3>
                                <button onClick={() => {setImageFile(null); setPreviewUrl(null);}} className="text-sm text-red-500 hover:underline">Changer image</button>
                            </div>

                            {suspicionMode ? (
                                <div className="bg-red-50 p-4 rounded-lg border border-red-100 space-y-3">
                                    <h4 className="font-bold text-red-800 flex items-center gap-2"><AlertTriangle size={18}/> Signalement Suspicion</h4>
                                    <textarea 
                                        className="w-full p-3 border border-red-200 rounded-md text-sm focus:ring-2 focus:ring-red-500 outline-none"
                                        placeholder="Décrivez l'anomalie observée (Obligatoire)..."
                                        rows={3}
                                        value={comment}
                                        onChange={e => setComment(e.target.value)}
                                    ></textarea>
                                    <div className="flex gap-3">
                                        <Button variant="danger" disabled={processing} onClick={() => handleFinishScan(TruckStatus.SUSPICION)} className="flex-1">
                                            Confirmer Suspicion
                                        </Button>
                                        <Button variant="secondary" onClick={() => setSuspicionMode(false)}>Annuler</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        disabled={processing}
                                        onClick={() => handleFinishScan(TruckStatus.VALIDATED_OK)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                                    >
                                        <CheckCircle size={28} />
                                        <span className="text-lg">CONFORME (OK)</span>
                                        <span className="text-xs font-normal opacity-80">Clôturer le dossier</span>
                                    </button>

                                    <button 
                                        disabled={processing}
                                        onClick={() => setSuspicionMode(true)}
                                        className="bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2 transition-all"
                                    >
                                        <AlertTriangle size={28} />
                                        <span className="text-lg">SUSPICION</span>
                                        <span className="text-xs font-normal opacity-80 text-gray-500">Signaler une anomalie</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Scanner ZBV (CD-36)</h2>
        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">AS UNIQUEMENT</span>
      </div>
      
      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
        <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                <tr>
                    <th className="p-4">Priorité</th>
                    <th className="p-4">Plaque</th>
                    <th className="p-4">Chauffeur</th>
                    <th className="p-4">Ticket</th>
                    <th className="p-4 text-right">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {readyForScan.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                        <td className="p-4 text-gray-400">#{idx + 1}</td>
                        <td className="p-4 font-bold text-gray-800 font-mono text-lg">{t.plateNumber}</td>
                        <td className="p-4">{t.driverName}</td>
                        <td className="p-4 text-gray-500 font-mono">{t.ticketNumber || '-'}</td>
                        <td className="p-4 text-right">
                            <Button variant="primary" onClick={() => setSelectedTruck(t)}>
                                <Scan size={16} /> Procéder au Scan
                            </Button>
                        </td>
                    </tr>
                ))}
                {readyForScan.length === 0 && (
                    <tr>
                        <td colSpan={5} className="p-12 text-center text-gray-500">
                            <Scan size={48} className="mx-auto mb-4 opacity-20" />
                            Aucun camion en zone d'attente scanner.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};

// Sub-component for Validation (CS Only) - Legacy, now AS can close, but CS might still review
export const ValidationView: React.FC<{ trucks: Truck[], user: any, refresh: () => void }> = ({ trucks, user, refresh }) => {
    // Only trucks that have been SCANNED (but maybe not validated? In new flow AS validates. 
    // We keep this for CS to review "SCANNED" if AS didn't validate, or to review History)
    // For this app version, let's assume CS reviews logs or specific flagged items.
    // To keep simple: CS sees history or re-opens. 
    // But for now, let's show trucks that might be in 'SCANNED' state if AS didn't validate (legacy flow compatibility)
    const toValidate = trucks.filter(t => t.status === TruckStatus.SCANNED);
    const [viewingTruck, setViewingTruck] = useState<Truck | null>(null);
    const [comment, setComment] = useState('');

    const handleValidation = async (status: TruckStatus.VALIDATED_OK | TruckStatus.SUSPICION) => {
        if (!viewingTruck) return;
        if (status === TruckStatus.SUSPICION && !comment.trim()) {
            alert("Un commentaire est obligatoire pour la Main Courante (CD-35) en cas de suspicion.");
            return;
        }
        if (confirm(`Confirmer le statut final: ${status} ?`)) {
            // Envoi Formspree
            sendToFormspree({
                _subject: `PCPCB - Validation Chef de Site : ${viewingTruck.plateNumber}`,
                type_action: 'VALIDATION_CS_CD35',
                statut_final: status,
                plate_number: viewingTruck.plateNumber,
                agent_validation: user.email,
                commentaire: comment || 'R.A.S.'
            });

            await TruckService.validateScan(viewingTruck.id, status, comment, user);
            setViewingTruck(null);
            setComment('');
            refresh();
        }
    };

    if (viewingTruck) {
        return (
            <div className="max-w-6xl mx-auto space-y-6">
                <Button variant="secondary" onClick={() => setViewingTruck(null)}>Retour Liste Validation</Button>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
                    {/* Left: Image Viewer */}
                    <Card className="p-0 overflow-hidden bg-black flex items-center justify-center relative h-full">
                        <img src={viewingTruck.scanImageUrl} alt="Scan Result" className="w-full h-full object-contain" />
                        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded backdrop-blur-md">
                            Vue Rayons-X
                        </div>
                    </Card>

                    {/* Right: Controls & Info */}
                    <div className="flex flex-col gap-6 h-full overflow-y-auto">
                        <Card>
                            <h3 className="text-lg font-bold mb-4 border-b pb-2">Détails Dossier</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500 block">Plaque</span>
                                    <span className="font-mono font-bold text-lg">{viewingTruck.plateNumber}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Cargaison</span>
                                    <span className="font-medium">{viewingTruck.cargoType}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Chauffeur</span>
                                    <span className="font-medium">{viewingTruck.driverName}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Compagnie</span>
                                    <span className="font-medium">{viewingTruck.company}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Ticket Paiement</span>
                                    <span className="font-medium font-mono">{viewingTruck.ticketNumber || 'N/A'}</span>
                                </div>
                            </div>
                        </Card>
                        
                        <Card className="flex-1 flex flex-col">
                             <div className="flex items-center gap-2 mb-2 text-pcpcb-green">
                                <FileCheck size={20} />
                                <h3 className="font-bold">Main Courante (CD-35)</h3>
                             </div>
                             <p className="text-xs text-gray-500 mb-4">Consignation des observations et décision finale.</p>
                             
                             <label className="block text-sm font-medium text-gray-700 mb-2">Observation / Commentaire Suspicion</label>
                             <textarea 
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-pcpcb-green outline-none flex-1 resize-none"
                                placeholder="R.A.S. ou détails de l'anomalie détectée..."
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                             ></textarea>
                             
                             <div className="grid grid-cols-2 gap-4 mt-6">
                                <button 
                                    onClick={() => handleValidation(TruckStatus.VALIDATED_OK)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-lg flex flex-col items-center justify-center gap-1 shadow-lg hover:shadow-xl transition-all"
                                >
                                    <CheckCircle size={24} /> 
                                    <span>CONFORME (OK)</span>
                                </button>
                                <button 
                                     onClick={() => handleValidation(TruckStatus.SUSPICION)}
                                     className="bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-lg flex flex-col items-center justify-center gap-1 shadow-lg hover:shadow-xl transition-all"
                                >
                                    <AlertTriangle size={24} /> 
                                    <span>SUSPICION</span>
                                </button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-800">Validation & Agrément (CD-35)</h2>
                <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">CHEF DE SITE</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {toValidate.map(t => (
                    <Card key={t.id} className="flex flex-col group hover:ring-2 ring-pcpcb-green transition-all cursor-pointer" onClick={() => setViewingTruck(t)}>
                        <div className="relative">
                            <img src={t.scanImageUrl} className="w-full h-48 object-cover rounded-lg mb-4 bg-gray-900" alt="scan" />
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                {new Date(t.scannedAt!).toLocaleTimeString()}
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-xl font-mono">{t.plateNumber}</h3>
                            <p className="text-sm text-gray-500 mb-4">{t.driverName} • {t.cargoType}</p>
                            <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                <Scan size={12} /> Scanné par {t.processedBy}
                            </div>
                        </div>
                        <Button className="w-full justify-center mt-4">
                            Inspecter
                        </Button>
                    </Card>
                ))}
                {toValidate.length === 0 && (
                     <div className="col-span-3 text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                         <FileCheck size={48} className="mx-auto mb-4 opacity-20 text-pcpcb-green" />
                         <p className="text-gray-500 font-medium">Aucun dossier en attente de validation.</p>
                         <p className="text-sm text-gray-400">Les camions scannés apparaîtront ici.</p>
                     </div>
                )}
            </div>
        </div>
    );
};
