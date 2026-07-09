"use client"
import { useState, useMemo } from 'react';

const AttendanceLogsTable = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // دالة مساعدة لتنسيق الوقت والتاريخ
  const formatDateTime = (isoString) => {
    if (!isoString) return { date: '--', time: '--' };
    const d = new Date(isoString);
    return {
      date: d.toLocaleDateString('ar-SY', { year: 'numeric', month: 'numeric', day: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  };

  // تصفية السجلات (Filtering) بناءً على مدخلات المشرف
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        (log.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.rfidTag?.toLowerCase().includes(searchTerm.toLowerCase()));

      const logDate = log.timestamp ? new Date(log.timestamp).toISOString().split('T')[0] : '';
      const matchesDate = dateFilter === '' || logDate === dateFilter;

      const matchesStatus = statusFilter === 'all' || log.computedStatus === statusFilter;

      return matchesSearch && matchesDate && matchesStatus;
    });
  }, [logs, searchTerm, dateFilter, statusFilter]);

  // الخوارزمية السحرية لتصدير البيانات إلى ملف Excel (CSV) بدون مكتبات خارجية
  const exportToCSV = () => {
    if (filteredLogs.length === 0) {
      alert("لا توجد بيانات لتصديرها!");
      return;
    }

    // تعريف العناوين (Headers) مع دعم الترميز العربي UTF-8
    const csvContent = [
      ["الموظف", "رقم الكرت UID", "التاريخ", "التوقيت", "الحالة"], // السطر الأول
      ...filteredLogs.map(log => {
        const { date, time } = formatDateTime(log.timestamp);
        return [
          log.employeeName || "كرت غير معرف",
          log.rfidTag,
          date,
          time,
          log.computedStatus === 'Check-in' ? "دخول" : "انصراف"
        ];
      })
    ]
    .map(e => e.map(val => `"${val}"`).join(","))
    .join("\n");

    // إنشاء رابط التحميل التلقائي للملف
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_الحضور_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-300 text-right" dir="rtl">
      
      {/* أدوات الفلترة والبحث والتصدير */}
      <div className="p-5 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto flex-1">
          {/* البحث النصي */}
          <input 
            type="text" 
            placeholder="ابحث باسم الموظف أو الـ UID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary transition-all"
          />
          
          {/* فلتر التاريخ */}
          <input 
            type="date" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary transition-all text-right"
          />

          {/* فلتر الحالة */}
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary transition-all font-sans"
          >
            <option value="all">جميع الحالات</option>
            <option value="Check-in">دخول (Check-in)</option>
            <option value="Check-out">انصراف (Check-out)</option>
          </select>
        </div>

        {/* زر تصدير التقرير */}
        <button 
          onClick={exportToCSV}
          className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-medium text-sm py-2 px-5 rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
        >
          📊 تصدير لـ Excel
        </button>
      </div>

      {/* الجدول المعروض بناءً على الفلترة */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-right min-w-[600px]" dir="ltr"> 
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider text-left">
            <tr>
              <th className="px-6 py-4 font-semibold">Employee</th>
              <th className="px-6 py-4 font-semibold">Card UID</th>
              <th className="px-6 py-4 font-semibold">Date & Time</th>
              <th className="px-6 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-10 text-center text-gray-400 font-sans">
                  لا توجد سجلات مطابقة لخيارات البحث الحالية.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const { date, time } = formatDateTime(log.timestamp);
                return (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors text-left">
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {log.employeeName || "Unknown Card"}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                      {log.rfidTag}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      <span className="font-semibold block text-slate-600">{date}</span>
                      <span className="text-gray-400">{time}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        log.computedStatus === 'Check-in' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {log.computedStatus}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceLogsTable;