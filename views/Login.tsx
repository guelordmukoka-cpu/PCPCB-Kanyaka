
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Lock, Mail, AlertCircle } from 'lucide-react';

export const Login: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const determineRole = (email: string): UserRole | null => {
    const lowerEmail = email.toLowerCase();
    
    // Strict match for Coords
    if (lowerEmail === 'guelord.mukoka@pcpcbrdc.com') return UserRole.CG;
    if (lowerEmail === 'pierre.esaki@pcpcbrdc.com') return UserRole.CGA;

    // Pattern match for others
    if (lowerEmail.includes('-ops@pcpcbrdc.com')) return UserRole.OPS;
    if (lowerEmail.includes('-cs@pcpcbrdc.com')) return UserRole.CS;
    if (lowerEmail.includes('-as@pcpcbrdc.com')) return UserRole.AS;

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.endsWith('@pcpcbrdc.com')) {
      setError("Accès strictement restreint au domaine @pcpcbrdc.com");
      return;
    }

    const role = determineRole(email);

    if (!role) {
      setError("Format d'email non reconnu pour un rôle système valide.");
      return;
    }

    // Determine Name from email for demo purposes
    let name = "Utilisateur";
    if (role === UserRole.CG) name = "Guelord Mukoka";
    else if (role === UserRole.CGA) name = "Pierre Esaki";
    else {
      const prefix = email.split('@')[0];
      name = prefix.split('-')[0].replace('.', ' '); // "jean.dupont" -> "jean dupont"
      name = name.charAt(0).toUpperCase() + name.slice(1);
    }

    const user: User = {
      id: Math.random().toString(36),
      name: name,
      email: email,
      role: role
    };

    onLogin(user);
  };

  const demoLogin = (email: string) => {
    setEmail(email);
    setPassword('1234');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pcpcb-dark to-emerald-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-block bg-pcpcb-green px-6 py-4 rounded-2xl mx-auto shadow-lg mb-4">
            <span className="text-3xl font-extrabold text-white tracking-widest">PCPCB</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Kanyaka Truck System</h1>
          <p className="text-gray-500 mt-2 text-sm">Portail de Gestion Scannage Export</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm flex items-start gap-3 border border-red-100">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email Professionnel</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pcpcb-green outline-none transition-all font-mono text-sm"
                placeholder="prenom.nom-role@pcpcbrdc.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-400">Domaine autorisé: @pcpcbrdc.com</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pcpcb-green outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-pcpcb-green hover:bg-pcpcb-dark text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Connexion Sécurisée
          </button>
        </form>

        {/* DEMO LINKS */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-center text-gray-400 mb-3 font-semibold uppercase tracking-wider">Accès Rapide (Démo)</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => demoLogin('guelord.mukoka@pcpcbrdc.com')} className="text-xs bg-gray-50 hover:bg-gray-100 p-2 rounded text-left border border-gray-200">
              <span className="font-bold block text-gray-700">CG</span> Guelord Mukoka
            </button>
            <button onClick={() => demoLogin('pierre.esaki@pcpcbrdc.com')} className="text-xs bg-gray-50 hover:bg-gray-100 p-2 rounded text-left border border-gray-200">
              <span className="font-bold block text-gray-700">CGA</span> Pierre Esaki
            </button>
            <button onClick={() => demoLogin('marie.chef-cs@pcpcbrdc.com')} className="text-xs bg-gray-50 hover:bg-gray-100 p-2 rounded text-left border border-gray-200">
              <span className="font-bold block text-gray-700">CS</span> Chef de Site
            </button>
            <button onClick={() => demoLogin('jean.dupont-ops@pcpcbrdc.com')} className="text-xs bg-gray-50 hover:bg-gray-100 p-2 rounded text-left border border-gray-200">
              <span className="font-bold block text-gray-700">OPS</span> Op. Saisie
            </button>
             <button onClick={() => demoLogin('paul.system-as@pcpcbrdc.com')} className="col-span-2 text-xs bg-gray-50 hover:bg-gray-100 p-2 rounded text-center border border-gray-200">
              <span className="font-bold text-gray-700">AS</span> Opérateur Système (Scanner)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
