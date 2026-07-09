"use client"
import { useState, useEffect } from 'react';
import { db } from '@/app/firebase/config';
import { doc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';

const AddEmployeeModal = ({ isOpen, onClose }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [rfidTag, setRfidTag] = useState('');
  
  const [isScanning, setIsScanning] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });


  useEffect(() => {
    if (!isScanning) return;

    const docRef = doc(db, "system_settings", "hardware_status");
    updateDoc(docRef, { isPairingMode: true, pendingTag: "" });

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.pendingTag) {
          setRfidTag(data.pendingTag);
          setIsScanning(false);
          setMessage({ text: 'Card number successfully captured!', type: 'success' });
          updateDoc(docRef, { isPairingMode: false, pendingTag: "" });
        }
      }
    });

    return () => {
      unsubscribe();
      updateDoc(docRef, { isPairingMode: false });
    };
  }, [isScanning]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId || !name || !email || !department || !rfidTag) {
      setMessage({ text: 'Please fill all required fields', type: 'error' });
      return;
    }

    setSubmitLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await setDoc(doc(db, "employees", employeeId), {
        employeeId,
        name,
        email,
        department,
        rfidTag,
        status: "active",
        createdAt: new Date().toISOString()
      });

      setMessage({ text: 'New employee successfully registered!', type: 'success' });
      
      setEmployeeId('');
      setName('');
      setEmail('');
      setDepartment('');
      setRfidTag('');
      
      setTimeout(() => {
        onClose();
        setMessage({ text: '', type: '' });
      }, 1500);

    } catch (error) {
      console.error("Error adding employee:", error);
      setMessage({ text: 'An error occurred while saving, please try again', type: 'error' });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-3">
          <h3 className="text-lg font-bold text-slate-800">Add New Employee</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-slate-600 text-xl">✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Employee ID</label>
            <input 
              type="text" placeholder="Example: EMP-2026-01" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all text-left"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
            <input 
              type="text" placeholder="Employee's full name" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Email Address</label>
            <input 
              type="email" placeholder="example@company.com" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all text-left"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Department / Management</label>
            <select 
              value={department} onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all"
            >
              <option value="">Choose a department...</option>
              <option value="Engineering">Engineering</option>
              <option value="UI/UX Design">UI/UX Design</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Management">Management</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">RFID Card Number (UID)</label>
            <div className="flex gap-2">
              <input 
                type="text" placeholder="Scan the card or type it here" value={rfidTag} onChange={(e) => setRfidTag(e.target.value)}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all text-left font-mono"
              />
              <button
                type="button"
                onClick={() => setIsScanning(true)}
                disabled={isScanning}
                className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all ${
                  isScanning 
                    ? 'bg-purple-50 border-purple-200 text-purple-600 animate-pulse' 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {isScanning ? 'Waiting for card...' : 'Read with RFID'}
              </button>
            </div>
          </div>

          {/* Messages */}
          {message.text && (
            <div className={`p-3 rounded-xl text-xs text-center border ${
              message.type === 'success' ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'
            }`}>
              {message.text}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-50">
            <button 
              type="submit" disabled={submitLoading}
              className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-xl text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {submitLoading ? 'Saving...' : 'Save Data'}
            </button>
            <button 
              type="button" onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm transition-all"
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddEmployeeModal;