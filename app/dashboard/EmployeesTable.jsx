"use client"
import { useState, useEffect } from 'react';
import { db } from '@/app/firebase/config';
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';

const EmployeesTable = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "employees"), (snapshot) => {
      const empData = [];
      snapshot.forEach((doc) => {
        empData.push({ id: doc.id, ...doc.data() });
      });
      setEmployees(empData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`هل أنت متأكد من حذف بيانات الموظف: ${name}؟\nهذا الإجراء لا يمكن التراجع عنه.`)) {
      try {
        await deleteDoc(doc(db, "employees", id));
      } catch (error) {
        console.error("Error deleting employee:", error);
        alert("حدث خطأ أثناء الحذف.");
      }
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      await updateDoc(doc(db, "employees", id), {
        status: newStatus
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-500 animate-pulse">جاري تحميل بيانات الموظفين...</div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
      <div className="p-5 sm:p-6 border-b border-gray-50 flex justify-between items-center">
        <h4 className="font-bold text-slate-800 text-base sm:text-lg">Employees Managment({employees.length})</h4>
      </div>
      
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left min-w-[700px]"> 
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold">ID</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold">Name & Email</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold">Department</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold">RFID Tag</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold">Status</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
            {employees.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-400">لا يوجد موظفين مسجلين حالياً.</td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 sm:px-6 py-3 sm:py-4 font-mono text-gray-500 text-xs">{emp.employeeId}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <p className="font-bold text-slate-700">{emp.name}</p>
                    <p className="text-gray-400 text-xs">{emp.email}</p>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-600">{emp.department}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 font-mono text-xs text-primary bg-primary/5 rounded px-2">{emp.rfidTag}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      emp.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {emp.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-center space-x-2 space-x-reverse">
                    <button 
                      onClick={() => toggleStatus(emp.id, emp.status)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-all"
                    >
                      {emp.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                      onClick={() => handleDelete(emp.id, emp.name)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-500 hover:text-white text-red-600 rounded-lg text-xs font-medium transition-all"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeesTable;