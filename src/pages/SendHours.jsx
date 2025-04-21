import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek, addDays, getWeek } from "date-fns";
import { sv } from "date-fns/locale";
import supabase from "../supabase";
import { Card, CardContent } from '../components/ui/card';

export default function SendHours() {
  const navigate = useNavigate();
  const [selectedDates, setSelectedDates] = useState([]);
  const [reportedDates, setReportedDates] = useState([]);
  const [sentDates, setSentDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [user, setUser] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  useEffect(() => {
    fetchReports();
    fetchUser();
  }, [currentDate]);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchReports = async () => {
    try {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      const { data: reports, error } = await supabase
        .from('time_reports')
        .select('*')
        .gte('date', format(monthStart, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'));

      if (error) throw error;

      const reported = reports.map(report => report.date);
      const sent = reports.filter(report => report.sent).map(report => report.date);

      setReportedDates(reported);
      setSentDates(sent);
    } catch (error) {
      console.error('Fel vid hämtning av rapporter:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (sentDates.includes(dateStr)) return;

    setSelectedDates(prev => {
      if (prev.includes(dateStr)) {
        return prev.filter(d => d !== dateStr);
      }
      return [...prev, dateStr].sort();
    });
  };

  const generateEmailContent = (timeReports, user, startDate, endDate) => {
    // Sortera tidrapporter efter datum
    const sortedReports = [...timeReports].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Beräkna totala timmar per projekt
    const projectTotals = sortedReports.reduce((acc, report) => {
      const projectName = report.project || 'Okänt projekt';
      if (!acc[projectName]) {
        acc[projectName] = 0;
      }
      acc[projectName] += report.hours;
      return acc;
    }, {});

    // Gruppera tidrapporter per vecka
    const reportsByWeek = sortedReports.reduce((acc, report) => {
      const date = new Date(report.date);
      const weekNumber = getWeek(date, { locale: sv });
      const weekKey = `${date.getFullYear()}-W${weekNumber}`;
      
      if (!acc[weekKey]) {
        acc[weekKey] = {
          weekNumber,
          year: date.getFullYear(),
          reports: []
        };
      }
      
      acc[weekKey].reports.push(report);
      return acc;
    }, {});

    // Beräkna totala timmar
    const totalHours = timeReports.reduce((sum, report) => sum + report.hours, 0);

    // Formatera start- och slutdatum
    const formattedStartDate = format(new Date(startDate), "d MMMM yyyy", { locale: sv });
    const formattedEndDate = format(new Date(endDate), "d MMMM yyyy", { locale: sv });

    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">Tidrapport för ${user.full_name}</h2>
          <p style="color: #666; margin-bottom: 20px;">Period: ${formattedStartDate} - ${formattedEndDate}</p>
          
          ${Object.values(reportsByWeek).map(week => `
            <div style="margin-bottom: 30px;">
              <h3 style="color: #444; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #ddd;">
                Vecka ${week.weekNumber}, ${week.year}
              </h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr style="background-color: #f8f9fa;">
                    <th style="padding: 8px; text-align: left; border-bottom: 2px solid #dee2e6;">Datum</th>
                    <th style="padding: 8px; text-align: left; border-bottom: 2px solid #dee2e6;">Projekt</th>
                    <th style="padding: 8px; text-align: right; border-bottom: 2px solid #dee2e6;">Timmar</th>
                    <th style="padding: 8px; text-align: left; border-bottom: 2px solid #dee2e6;">Material</th>
                    <th style="padding: 8px; text-align: left; border-bottom: 2px solid #dee2e6;">Kommentar</th>
                  </tr>
                </thead>
                <tbody>
                  ${week.reports.map(report => `
                    <tr style="border-bottom: 1px solid #dee2e6;">
                      <td style="padding: 8px;">${format(new Date(report.date), "yyyy-MM-dd")}</td>
                      <td style="padding: 8px;">${report.project || 'Okänt projekt'}</td>
                      <td style="padding: 8px; text-align: right;">${report.hours.toFixed(1)}</td>
                      <td style="padding: 8px;">${report.material || '-'}</td>
                      <td style="padding: 8px;">${report.comment || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}
          
          <div style="margin-top: 20px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
            <h3 style="color: #444; margin-bottom: 15px;">Summering per projekt</h3>
            ${Object.entries(projectTotals).map(([project, hours]) => `
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #666;">${project}</span>
                <span style="font-weight: bold;">${hours.toFixed(1)} timmar</span>
              </div>
            `).join('')}
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #dee2e6; display: flex; justify-content: space-between;">
              <span style="font-weight: bold; color: #333;">Totalt antal timmar:</span>
              <span style="font-weight: bold; color: #333;">${totalHours.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const handleSend = async () => {
    if (selectedDates.length === 0) {
      setError('Välj minst ett datum att skicka');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Ingen inloggad användare');

      // Hämta användarens profil för att få fullständigt namn
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Använd full_name om det finns, annars använd e-postadressen
      const userName = profile?.full_name || user.email || 'Användare';

      const { data: timeReports, error: reportsError } = await supabase
        .from('time_reports')
        .select('*')
        .in('date', selectedDates)
        .eq('user_id', user.id);

      if (reportsError) throw reportsError;

      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*');

      if (projectsError) throw projectsError;

      const reportsWithProjects = timeReports.map(report => {
        const project = projects.find(p => p.id === report.project);
        return {
          ...report,
          project: project?.name || 'Okänt projekt',
          material: report.materials || 'Inget material',
          comment: report.comment || ''
        };
      });

      const emailContent = generateEmailContent(reportsWithProjects, { ...user, full_name: userName }, selectedDates[0], selectedDates[selectedDates.length - 1]);

      const response = await fetch('https://email-server-production-a333.up.railway.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          recipient: 'hampus.lagerstrom@gmail.com',
          subject: `Tidrapport ${format(new Date(selectedDates[0]), 'd MMM', { locale: sv })} - ${format(new Date(selectedDates[selectedDates.length - 1]), 'd MMM yyyy', { locale: sv })}`,
          content: emailContent
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Railway API svarade med fel:', errorData);
        throw new Error(`Kunde inte skicka e-post: ${errorData.error || 'Okänt fel'}`);
      }

      const data = await response.json();
      console.log('E-post skickad framgångsrikt:', data);

      // Uppdatera tidrapporterna som skickade
      const { error: updateError } = await supabase
        .from('time_reports')
        .update({ sent: true })
        .eq('user_id', user.id)
        .in('date', selectedDates);

      if (updateError) throw updateError;

      // Navigera tillbaka till startsidan
      navigate('/');
    } catch (error) {
      console.error("Fel vid skickande:", error);
      setError(error.message || "Kunde inte skicka tidrapporterna");
    } finally {
      setSending(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Swipe handling
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

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center py-6 px-3 sm:py-10 sm:px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Skicka Timmar</h1>
          <button
            onClick={() => navigate("/")}
            className="text-zinc-400 hover:text-white p-2 active:bg-zinc-800 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div 
              className="touch-pan-x"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="flex justify-between items-center mb-4">
                <button 
                  onClick={handlePrevMonth} 
                  className="text-zinc-400 hover:text-white p-2 -ml-2 active:bg-zinc-800 rounded-lg transition-colors"
                >
                  &lt; Föregående
                </button>
                <h2 className="text-lg sm:text-xl font-semibold">
                  {format(currentDate, "MMMM yyyy", { locale: sv })}
                </h2>
                <button 
                  onClick={handleNextMonth} 
                  className="text-zinc-400 hover:text-white p-2 -mr-2 active:bg-zinc-800 rounded-lg transition-colors"
                >
                  Nästa &gt;
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"].map((day, i) => (
                  <div key={i} className="text-center text-xs sm:text-sm font-medium text-zinc-400">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 7 }).map((_, i) => {
                  const firstDayOfMonth = startOfMonth(currentDate);
                  const firstDayOfWeek = startOfWeek(firstDayOfMonth, { locale: sv });
                  const dayToShow = addDays(firstDayOfWeek, i);
                  if (!isSameMonth(dayToShow, firstDayOfMonth)) {
                    return (
                      <div
                        key={i}
                        className="aspect-square w-full text-xs sm:text-sm font-medium rounded-md bg-zinc-800 opacity-25 flex items-center justify-center"
                        style={{ minHeight: '32px', touchAction: 'manipulation' }}
                      />
                    );
                  }
                  return null;
                })}
                {daysInMonth.map((date, i) => {
                  const dateStr = format(date, "yyyy-MM-dd");
                  const isSelected = selectedDates.includes(dateStr);
                  const isReported = reportedDates.includes(dateStr);
                  const isSent = sentDates.includes(dateStr);
                  const isCurrentMonth = isSameMonth(date, currentDate);
                  const isCurrentDay = isToday(date);

                  let buttonClass = 'bg-zinc-700 hover:bg-zinc-600';
                  if (isSelected) {
                    buttonClass = 'bg-blue-500 hover:bg-blue-600';
                  } else if (isSent) {
                    buttonClass = 'bg-green-500';
                  } else if (isReported) {
                    buttonClass = 'bg-yellow-500 hover:bg-yellow-600';
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleDateClick(date)}
                      className={`aspect-square w-full text-xs sm:text-sm font-medium rounded-md ${buttonClass} 
                        ${!isCurrentMonth ? 'opacity-50' : ''} 
                        ${isCurrentDay ? 'ring-2 ring-blue-500' : ''} 
                        flex items-center justify-center`}
                      style={{ minHeight: '32px', touchAction: 'manipulation' }}
                      disabled={isSent}
                    >
                      {format(date, "d")}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-zinc-700 rounded"></div>
                  <span>Ingen rapport</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span>Rapporterad</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>Vald</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Skickad</span>
                </div>
              </div>

              {selectedDates.length > 0 && (
                <div className="bg-zinc-800 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Valda datum:</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedDates.map(date => (
                      <div 
                        key={date}
                        className="bg-blue-500 text-white px-2 py-1 rounded text-sm flex items-center gap-2"
                      >
                        <span>{format(new Date(date), "d MMM", { locale: sv })}</span>
                        <button 
                          onClick={() => handleDateClick(new Date(date))}
                          className="hover:text-zinc-200 active:text-zinc-400 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-500 bg-opacity-20 text-red-500 p-4 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSend}
            disabled={sending || selectedDates.length === 0}
            className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:bg-blue-800"
          >
            {sending ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                <span>Skickar...</span>
              </div>
            ) : (
              "Skicka tidrapporter"
            )}
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-full sm:flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-medium py-3 px-4 rounded-lg transition-colors active:bg-zinc-800"
          >
            Avbryt
          </button>
        </div>
      </div>
    </div>
  );
} 