import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek, addDays } from "date-fns";
import { sv } from "date-fns/locale";
import { supabase } from "../supabase";
import { ChevronLeftIcon, ChevronRightIcon, TrashIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { Card, CardContent } from "../components/ui/card";

function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-zinc-800 rounded-t-xl sm:rounded-xl shadow-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function Notification({ message, type, onClose }) {
  return (
    <div className={`fixed top-20 right-4 p-4 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    } text-white`}>
      <div className="flex items-center gap-2">
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 hover:text-white/80">✕</button>
      </div>
    </div>
  );
}

const getDayStatus = (date, reportedDates, sentDates) => {
  const dateStr = format(date, "yyyy-MM-dd");
  
  if (sentDates.includes(dateStr)) {
    return "bg-green-500 hover:bg-green-600 text-white";
  }
  if (reportedDates.includes(dateStr)) {
    return "bg-yellow-500 hover:bg-yellow-600 text-white";
  }
  return "bg-zinc-700 hover:bg-zinc-600 text-white";
};

export default function HomePage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateReports, setSelectedDateReports] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [projects, setProjects] = useState({});
  const [editingReport, setEditingReport] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [hasUnsentReports, setHasUnsentReports] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchReports = async () => {
    try {
      const fetchData = async () => {
        try {
          // Hämta alla projekt först
          const { data: projectsData, error: projectsError } = await supabase
            .from('projects')
            .select('id, name');

          if (projectsError) {
            console.error("Fel vid hämtning av projekt:", projectsError);
            setError("Kunde inte hämta projektinformation");
            setLoading(false);
            return;
          }

          // Skapa en map av projekt för snabb lookup
          const projectsMap = {};
          projectsData.forEach(project => {
            projectsMap[project.id] = project;
          });
          setProjects(projectsMap);

          // Hämta tidrapporter
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error("Fel vid hämtning av session:", sessionError);
            setError("Kunde inte hämta användarinformation");
            setLoading(false);
            return;
          }

          if (!session) {
            setError("Du måste vara inloggad för att se tidrapporter");
            setLoading(false);
            return;
          }

          const { data: reports, error: reportsError } = await supabase
            .from('time_reports')
            .select('*, projects(name)')
            .eq('user_id', session.user.id)
            .order('date', { ascending: false });

          if (reportsError) {
            console.error("Fel vid hämtning av tidrapporter:", reportsError);
            setError("Kunde inte hämta tidrapporter");
            setLoading(false);
            return;
          }

          setReports(reports || []);
          setLoading(false);
        } catch (error) {
          console.error("Ett fel uppstod:", error);
          setError("Ett oväntat fel uppstod");
          setLoading(false);
        }
      };

      await fetchData();
    } catch (error) {
      console.error("Ett fel uppstod:", error);
      setError("Ett oväntat fel uppstod");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    checkUnsentReports();
  }, []);

  const handleDateClick = async (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setSelectedDate(dateStr);
    setIsModalOpen(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: reports, error } = await supabase
        .from('time_reports')
        .select('*, projects(name)')
        .eq('user_id', user.id)
        .eq('date', dateStr);

      if (error) throw error;

      setSelectedDateReports(reports || []);
    } catch (error) {
      console.error("Fel vid hämtning av tidrapporter:", error);
      setError("Kunde inte hämta tidrapporter för detta datum");
    }
  };

  const handleDelete = async (reportId) => {
    try {
      const { error } = await supabase
        .from('time_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      // Uppdatera listan och kalendern
      setSelectedDateReports(prev => prev.filter(report => report.id !== reportId));
      await fetchReports();
    } catch (error) {
      console.error("Fel vid radering:", error);
    }
  };

  const handleEdit = async (report) => {
    if (editingReport?.id === report.id) {
      try {
        const { error } = await supabase
          .from('time_reports')
          .update({
            hours: editingReport.hours,
            materials: editingReport.materials
          })
          .eq('id', report.id);

        if (error) throw error;

        setEditingReport(null);
        // Uppdatera listan och kalendern
        const { data: updatedReports } = await supabase
          .from('time_reports')
          .select('*')
          .eq('date', selectedDate);

        setSelectedDateReports(updatedReports);
        await fetchReports();
      } catch (error) {
        console.error("Fel vid uppdatering:", error);
      }
    } else {
      setEditingReport({ ...report });
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Fel vid utloggning:", error);
        return;
      }
      navigate("/login");
    } catch (error) {
      console.error("Ett fel uppstod vid utloggning:", error);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNextMonth();
    }
    if (isRightSwipe) {
      handlePrevMonth();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handleUserChange = async (userId) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Hämta användarens tidrapporter
      const { data: reports, error: reportsError } = await supabase
        .from('time_reports')
        .select('*, projects(name)')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (reportsError) throw reportsError;

      // Uppdatera state först efter att vi har data
      setSelectedUserId(userId);
      setReports(reports);
      
      // Uppdatera användarens information från profiles-tabellen
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      
      if (userData) {
        setSelectedUser(userData);
      }
    } catch (error) {
      console.error("Fel vid hämtning av data:", error);
      setError("Kunde inte hämta användardata");
    } finally {
      setLoading(false);
    }
  };

  const checkUnsentReports = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: reports } = await supabase
        .from('time_reports')
        .select('sent')
        .eq('user_id', user.id)
        .eq('sent', false);

      setHasUnsentReports(reports && reports.length > 0);
    } catch (error) {
      console.error('Error checking unsent reports:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-zinc-400">Laddar kalender...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <p className="text-red-500 mb-4 text-sm sm:text-base">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            Försök igen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <div className="max-w-screen-sm mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-0">Välkommen</h1>
          <button
            onClick={() => navigate("/tidrapport")}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors text-base sm:text-lg"
          >
            Ny tidrapport
          </button>
        </div>

        <div className="bg-zinc-800 rounded-lg p-4 sm:p-6 mb-6">
          <div className="calendar-container">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={handlePrevMonth}
                className="p-2 sm:p-3 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>
              <h3 className="text-lg sm:text-xl font-medium">
                {format(currentDate, "MMMM yyyy", { locale: sv })}
              </h3>
              <button
                onClick={handleNextMonth}
                className="p-2 sm:p-3 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                <ChevronRightIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 bg-zinc-700 rounded-lg overflow-hidden">
              {["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm sm:text-base font-medium py-2 bg-zinc-800"
                >
                  {day}
                </div>
              ))}
              {Array.from({ length: 7 }).map((_, i) => {
                const firstDayOfMonth = startOfMonth(currentDate);
                const firstDayOfWeek = startOfWeek(firstDayOfMonth, { locale: sv });
                const dayToShow = addDays(firstDayOfWeek, i);
                if (!isSameMonth(dayToShow, firstDayOfMonth)) {
                  return (
                    <div
                      key={`empty-${i}`}
                      className="h-20 sm:h-24 bg-zinc-800"
                    />
                  );
                }
                return null;
              })}
              {daysInMonth.map((date, i) => {
                const statusClass = getDayStatus(date, reports.filter(report => !report.sent).map(report => report.date), reports.filter(report => report.sent).map(report => report.date));
                const isCurrentMonth = isSameMonth(date, currentDate);
                const isCurrentDay = isToday(date);
                
                // Hämta tidrapporter för detta datum
                const dateStr = format(date, "yyyy-MM-dd");
                const dayReports = reports.filter(report => report.date === dateStr);
                const totalHours = dayReports.reduce((sum, report) => sum + report.hours, 0);
                
                return (
                  <div
                    key={i}
                    className={`relative min-h-[5rem] sm:min-h-[6rem] flex flex-col ${
                      isCurrentDay 
                        ? "bg-blue-600 hover:bg-blue-700" 
                        : statusClass
                    } transition-colors`}
                    onClick={() => handleDateClick(date)}
                  >
                    <div className="p-1 text-right">
                      <span className={`inline-block w-6 h-6 flex items-center justify-center rounded-full ${
                        isCurrentDay ? "bg-white text-blue-600" : "text-white"
                      }`}>
                        {format(date, "d")}
                      </span>
                    </div>
                    <div className="flex-1 p-1 overflow-y-auto">
                      {dayReports.length > 0 ? (
                        <div className="space-y-1">
                          {dayReports.map((report) => (
                            <div
                              key={report.id}
                              className="text-xs sm:text-sm p-1 rounded bg-white/10 text-white truncate"
                            >
                              {projects[report.project]?.name || "Okänt projekt"} {report.hours}h
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-full" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            {isAdmin && (
              <select
                value={selectedUserId}
                onChange={(e) => handleUserChange(e.target.value)}
                className="w-full sm:w-auto bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {selectedDate && format(new Date(selectedDate), "d MMMM yyyy", { locale: sv })}
            </h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {selectedDateReports.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-400">Inga tidrapporter för detta datum</p>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  navigate(`/tidrapport?datum=${selectedDate}`);
                }}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Lägg till tid
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDateReports.map((report) => (
                <div key={report.id} className="bg-zinc-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">
                        {projects[report.project]?.name || "Okänt projekt"}
                      </h3>
                      <p className="text-sm text-zinc-400">{report.hours} timmar</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(report)}
                        className="text-zinc-400 hover:text-white transition-colors"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  {editingReport?.id === report.id ? (
                    <div className="mt-2 space-y-2">
                      <input
                        type="number"
                        value={editingReport.hours}
                        onChange={(e) => setEditingReport(prev => ({ ...prev, hours: e.target.value }))}
                        className="w-full px-3 py-2 rounded bg-zinc-800 text-white"
                        step="0.5"
                        min="0"
                      />
                      <textarea
                        value={editingReport.materials}
                        onChange={(e) => setEditingReport(prev => ({ ...prev, materials: e.target.value }))}
                        className="w-full px-3 py-2 rounded bg-zinc-800 text-white"
                        rows="3"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingReport(null)}
                          className="px-3 py-1 rounded bg-zinc-600 hover:bg-zinc-500 transition-colors"
                        >
                          Avbryt
                        </button>
                        <button
                          onClick={() => handleEdit(report)}
                          className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                          Spara
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-300">{report.materials || "Inget material angivet"}</p>
                  )}
                </div>
              ))}
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  navigate(`/tidrapport?datum=${selectedDate}`);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Lägg till tid
              </button>
            </div>
          )}
        </Modal>
      </div>

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}