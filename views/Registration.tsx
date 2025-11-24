
import React, { useState, useRef } from 'react';
import { Card, Button, StatusBadge } from '../components/Widgets';
import { TruckService } from '../services/mockData';
import { CheckCircle, FileText, ClipboardList, Upload, DollarSign, X } from 'lucide-react';
import { Truck, TruckStatus } from '../types';

interface RegistrationProps {
    user: any;
    trucks: Truck[];
    onRefresh: () => void;
}

export const Registration: React.FC<RegistrationProps> = ({ user, trucks, onRefresh }) => {
  const [formData, setFormData] = useState({
    plateNumber: '',
    driverName: '',
    company: '',
    cargoType: 'Cuivre'
  });
  
  const initialChecklist = {
      douane: false,
      ordreMission: false,
      preuvePaiement: false,
      identiteChauffeur: false
  };

  const [checklist, setChecklist] = useState(initialChecklist);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Payment States
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const pendingPaymentTrucks = trucks.filter(t => t.status === TruckStatus.REGISTERED);

  // Helper pour envoyer les données à Formspree
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

  const handlePaymentSubmit = async () => {
    if (!selectedTruckId || !ticketNumber.trim()) {
        alert("Veuillez entrer un numéro de ticket.");
        return;
    }

    try {
        const truck = trucks.find(t => t.id === selectedTruckId);

        // Envoi Formspree
        sendToFormspree({
            _subject: `PCPCB - Paiement Encaissé : ${truck?.plateNumber || 'Inconnu'}`,
            type_action: 'PAIEMENT_CAISSE',
            ticket_number: ticketNumber,
            plate_number: truck?.plateNumber || 'Inconnu',
            agent_paiement: user.email,
            date: new Date().toLocaleDateString('fr-FR')
        });

        await TruckService.confirmPayment(selectedTruckId, ticketNumber, user);
        setTicketNumber('');
        setSelectedTruckId(null);
        onRefresh();
    } catch (e) {
        alert("Erreur lors du paiement");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Envoi Formspree
      sendToFormspree({
          _subject: `PCPCB - Nouvel Enregistrement : ${formData.plateNumber}`,
          type_action: 'ENREGISTREMENT_CD24',
          plate_number: formData.plateNumber,
          driver_name: formData.driverName,
          company: formData.company,
          cargo_type: formData.cargoType,
          agent_saisie: user.email,
          check_douane: checklist.douane ? 'OUI' : 'NON',
          check_ordre_mission: checklist.ordreMission ? 'OUI' : 'NON',
          check_preuve_paiement: checklist.preuvePaiement ? 'OUI' : 'NON',
          check_identite: checklist.identiteChauffeur ? 'OUI' : 'NON'
      });

      // @ts-ignore
      await TruckService.registerTruck({
        ...formData,
        // In real app, we would upload pdfFile and get URL
        pdfUrl: pdfFile ? 'doc.pdf' : undefined 
      }, user);
      
      setSuccessMsg(`Camion ${formData.plateNumber} enregistré. Dossier CD-24/25 créé.`);
      
      // Reset Form
      setFormData({ plateNumber: '', driverName: '', company: '', cargoType: 'Cuivre' });
      // Reset Checklist
      setChecklist(initialChecklist);
      // Reset PDF
      setPdfFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      onRefresh();
      
      setTimeout(() => {
        setSuccessMsg('');
      }, 3000);
    } catch (error) {
      alert("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Espace Opérateur Saisie (OPS)</h2>
            <p className="text-gray-500">Enregistrement (CD-24), Documents (CD-25) & Caisse</p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-100 border border-emerald-200 text-emerald-800 p-4 rounded-lg mb-6 flex items-center gap-2 animate-fade-in shadow-sm">
          <CheckCircle size={20} />
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Registration Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
                <div className="border-b border-gray-100 pb-4 mb-4 flex items-center gap-2">
                    <FileText className="text-pcpcb-green" size={20}/>
                    <h3 className="font-bold text-gray-700">Fiche de Saisie (CD-24)</h3>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Plaque Camion</label>
                    <input
                        required
                        type="text"
                        placeholder="ex: 1234-AB-19"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pcpcb-green focus:border-transparent outline-none uppercase font-mono text-lg"
                        value={formData.plateNumber}
                        onChange={e => setFormData({...formData, plateNumber: e.target.value.toUpperCase()})}
                    />
                    </div>
                    <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Chauffeur</label>
                    <input
                        required
                        type="text"
                        placeholder="Nom complet"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pcpcb-green focus:border-transparent outline-none"
                        value={formData.driverName}
                        onChange={e => setFormData({...formData, driverName: e.target.value})}
                    />
                    </div>
                    <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Compagnie / Transitaire</label>
                    <input
                        required
                        type="text"
                        placeholder="Entreprise"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pcpcb-green focus:border-transparent outline-none"
                        value={formData.company}
                        onChange={e => setFormData({...formData, company: e.target.value})}
                    />
                    </div>
                    <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nature Cargaison</label>
                    <select
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pcpcb-green focus:border-transparent outline-none bg-white"
                        value={formData.cargoType}
                        onChange={e => setFormData({...formData, cargoType: e.target.value})}
                    >
                        <option value="Cuivre">Cuivre</option>
                        <option value="Cobalt">Cobalt</option>
                        <option value="Autre">Autre</option>
                    </select>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* Checklist */}
                     <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-2 mb-3 text-blue-800">
                            <ClipboardList size={18} />
                            <h4 className="font-bold text-sm">Checklist Doc (CD-25)</h4>
                        </div>
                        <ul className="space-y-2 text-sm text-blue-900">
                            <li className="flex items-center gap-2">
                                <input type="checkbox" checked={checklist.douane} onChange={e => setChecklist({...checklist, douane: e.target.checked})} className="rounded text-pcpcb-green cursor-pointer" id="chk1" /> 
                                <label htmlFor="chk1" className="cursor-pointer">Document de douane</label>
                            </li>
                            <li className="flex items-center gap-2">
                                <input type="checkbox" checked={checklist.ordreMission} onChange={e => setChecklist({...checklist, ordreMission: e.target.checked})} className="rounded text-pcpcb-green cursor-pointer" id="chk2" /> 
                                <label htmlFor="chk2" className="cursor-pointer">Ordre de mission</label>
                            </li>
                            <li className="flex items-center gap-2">
                                <input type="checkbox" checked={checklist.preuvePaiement} onChange={e => setChecklist({...checklist, preuvePaiement: e.target.checked})} className="rounded text-pcpcb-green cursor-pointer" id="chk3" /> 
                                <label htmlFor="chk3" className="cursor-pointer">Preuve paiement</label>
                            </li>
                            <li className="flex items-center gap-2">
                                <input type="checkbox" checked={checklist.identiteChauffeur} onChange={e => setChecklist({...checklist, identiteChauffeur: e.target.checked})} className="rounded text-pcpcb-green cursor-pointer" id="chk4" /> 
                                <label htmlFor="chk4" className="cursor-pointer">Identité chauffeur</label>
                            </li>
                        </ul>
                     </div>

                     {/* Upload & Submit */}
                     <div className="flex flex-col gap-4">
                        <div className="flex-1">
                             <label className="block w-full border border-dashed border-gray-300 rounded-lg p-3 text-center cursor-pointer hover:bg-gray-50 transition-colors h-full flex flex-col items-center justify-center">
                                <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={e => setPdfFile(e.target.files ? e.target.files[0] : null)} />
                                <Upload size={20} className="text-gray-400 mb-1" />
                                <span className="text-xs text-gray-500 font-medium">{pdfFile ? pdfFile.name : "Joindre Dossier PDF (Optionnel)"}</span>
                             </label>
                        </div>
                        <Button type="submit" disabled={loading} className="w-full py-3 shadow-md">
                            {loading ? 'Traitement...' : 'Enregistrer & Créer Dossier'}
                        </Button>
                     </div>
                </div>
                </form>
            </Card>
          </div>

          {/* Right Column: Payment Validation */}
          <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-4 border-b pb-2">
                      <div className="flex items-center gap-2 text-gray-800">
                          <DollarSign className="text-pcpcb-green" size={20} />
                          <h3 className="font-bold">Caisse / Paiement</h3>
                      </div>
                      <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-bold">{pendingPaymentTrucks.length} en attente</span>
                  </div>

                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                      {pendingPaymentTrucks.length === 0 ? (
                          <div className="text-center py-8 text-gray-400 text-sm">
                              Aucun camion en attente de paiement.
                          </div>
                      ) : (
                          pendingPaymentTrucks.map(truck => (
                              <div key={truck.id} className={`border rounded-lg p-3 transition-all ${selectedTruckId === truck.id ? 'border-pcpcb-green bg-green-50 shadow-md' : 'border-gray-200 hover:shadow-md bg-gray-50'}`}>
                                  <div className="flex justify-between items-start mb-2">
                                      <span className="font-mono font-bold text-gray-900">{truck.plateNumber}</span>
                                      <span className="text-xs text-gray-500">{new Date(truck.registeredAt).toLocaleTimeString()}</span>
                                  </div>
                                  
                                  {selectedTruckId === truck.id ? (
                                      <div className="animate-fade-in space-y-2 mt-2">
                                          <div className="text-xs text-gray-600 mb-1">Saisir numéro du ticket :</div>
                                          <input 
                                            autoFocus
                                            type="text" 
                                            placeholder="N° Ticket / Bordereau"
                                            className="w-full px-2 py-2 border border-pcpcb-green rounded text-sm focus:outline-none"
                                            value={ticketNumber}
                                            onChange={e => setTicketNumber(e.target.value)}
                                          />
                                          <div className="flex gap-2">
                                              <Button onClick={handlePaymentSubmit} className="flex-1 py-1.5 text-xs bg-pcpcb-green hover:bg-pcpcb-dark">
                                                  Valider
                                              </Button>
                                              <button 
                                                onClick={() => {setSelectedTruckId(null); setTicketNumber('');}}
                                                className="px-2 bg-gray-200 text-gray-600 rounded text-xs hover:bg-gray-300"
                                              >
                                                  <X size={16} />
                                              </button>
                                          </div>
                                      </div>
                                  ) : (
                                      <>
                                          <div className="text-xs text-gray-600 mb-3">
                                              {truck.company} • {truck.cargoType}
                                          </div>
                                          <div className="flex items-center justify-between">
                                              <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded border border-amber-200">
                                                  En attente paiement
                                              </span>
                                              <Button onClick={() => setSelectedTruckId(truck.id)} className="py-1.5 px-3 text-xs bg-blue-600 hover:bg-blue-700">
                                                  Encaisser
                                              </Button>
                                          </div>
                                      </>
                                  )}
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};
