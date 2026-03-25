import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button, Badge } from '../ui/Common';
import { useToast } from '../../context/ToastContext';
import { useSettings, type AlertThreshold } from '../../context/SettingsContext';

export function AccountTab() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [name, setName] = useState('Demo User');
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(name);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [pwError, setPwError]     = useState('');

  const { emergencyFund, setEmergencyFund } = useSettings();
  const [efTarget,    setEfTarget]    = useState(emergencyFund.target);
  const [efThreshold, setEfThreshold] = useState<AlertThreshold>(emergencyFund.threshold);

  const EF_LOW  = 450000;
  const EF_HIGH = 900000;

  function handleSaveEF() {
    setEmergencyFund({ target: efTarget, threshold: efThreshold });
    showToast('Emergency fund settings saved.');
  }

  function handleSaveName() {
    setName(tempName.trim() || name);
    setEditingName(false);
    showToast('Display name updated.');
  }

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    if (newPw.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
    showToast('Password updated successfully.');
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
  }

  function handleLogOut() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('isPro');
    navigate('/login');
  }

  return (
    <div className="space-y-8">

      {/* ── Emergency Fund ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-green-400" />
          <h3 className="text-base font-black text-white">Emergency Fund</h3>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          Set your emergency fund target. CaliComp will alert you if your cash balance
          approaches or dips below this amount.
        </p>
        <div className="space-y-4 max-w-sm">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
              Emergency Fund Target
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">₹</span>
              <input
                type="number"
                value={efTarget}
                min={0}
                onChange={e => setEfTarget(Number(e.target.value) || 0)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-7 pr-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-600 transition-colors"
              />
            </div>
            <p className="text-[10px] text-gray-600 mt-1">
              Recommended: 3–6 months of expenses (₹{EF_LOW.toLocaleString('en-IN')} – ₹{EF_HIGH.toLocaleString('en-IN')})
            </p>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
              Alert Threshold
            </label>
            <select
              value={efThreshold}
              onChange={e => setEfThreshold(e.target.value as AlertThreshold)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-600 transition-colors"
            >
              <option value="within10pct">When balance is within 10% of fund</option>
              <option value="equals">When balance equals fund</option>
              <option value="below">When balance dips below fund</option>
            </select>
          </div>
          <Button variant="primary" className="text-xs px-4 py-2" onClick={handleSaveEF}>
            Save Emergency Fund
          </Button>
        </div>
      </div>

      <div className="border-t border-gray-800" />

      <div>
        <h3 className="text-base font-black text-white mb-1">Account</h3>
        <p className="text-xs text-gray-500">Manage your profile details and authentication.</p>
      </div>

      {/* Profile info */}
      <div className="space-y-5">
        <div className="flex items-center gap-5 pb-5 border-b border-gray-800">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xl font-black text-white shrink-0">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="bg-gray-900 border border-blue-600 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none"
                />
                <Button variant="primary" className="text-xs px-3 py-1.5" onClick={handleSaveName}>Save</Button>
                <Button variant="outline" className="text-xs px-3 py-1.5" onClick={() => { setEditingName(false); setTempName(name); }}>Cancel</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-white">{name}</p>
                <button onClick={() => setEditingName(true)} className="text-[10px] text-blue-400 hover:text-blue-300 font-bold">Edit</button>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-0.5">demo@calicomp.in</p>
          </div>
          <Badge variant="info">Admin</Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Email</label>
            <input
              readOnly
              value="demo@calicomp.in"
              className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-500 cursor-not-allowed"
            />
            <p className="text-[9px] text-gray-600 mt-1">Email cannot be changed in demo mode.</p>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Role</label>
            <input
              readOnly
              value="Admin"
              className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="pt-4 border-t border-gray-800">
        <h4 className="text-sm font-bold text-gray-100 mb-4">Change Password</h4>
        <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm">
          {[
            { label: 'Current Password', value: currentPw, onChange: setCurrentPw },
            { label: 'New Password',     value: newPw,     onChange: setNewPw     },
            { label: 'Confirm New Password', value: confirmPw, onChange: setConfirmPw },
          ].map(({ label, value, onChange }) => (
            <div key={label}>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 pr-9 text-xs text-gray-200 focus:outline-none focus:border-blue-600 transition-colors"
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500">
                  {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
          {pwError && <p className="text-xs text-red-400">{pwError}</p>}
          <Button type="submit" variant="primary" className="text-xs px-4 py-2">Update Password</Button>
        </form>
      </div>

      {/* Log out */}
      <div className="pt-4 border-t border-gray-800">
        <h4 className="text-sm font-bold text-gray-100 mb-2">Session</h4>
        <p className="text-xs text-gray-500 mb-4">Signing out clears your local session. Your data is retained.</p>
        <Button
          variant="outline"
          className="flex items-center gap-2 text-red-400 border-red-900/50 hover:border-red-700"
          onClick={handleLogOut}
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
