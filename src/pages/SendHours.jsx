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

  const generateEmailContent = (timeReports) => {
    const sortedReports = [...timeReports].sort((a, b) => new Date(a.date) - new Date(b.date));
    const weeklyReports = {};
    sortedReports.forEach(report => {
      const date = new Date(report.date);
      const weekStart = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const weekKey = `${weekStart}`;

      if (!weeklyReports[weekKey]) {
        weeklyReports[weekKey] = {
          start: weekStart,
          reports: []
        };
      }
      weeklyReports[weekKey].reports.push(report);
    });

    let emailContent = `
      <div style="font-family: Inter, sans-serif; max-width: 700px; margin: 0 auto; padding: 24px; background-color: #fff; color: #37352f;">
        <h1 style="font-size: 18px; font-weight: 600; margin-bottom: 4px;">Tidrapport</h1>
        <p style="font-size: 12px; color: #6e6e6e; margin-bottom: 12px;">
          ${format(new Date(sortedReports[0].date), 'd MMM', { locale: sv })} – ${format(new Date(sortedReports[sortedReports.length - 1].date), 'd MMM yyyy', { locale: sv })}
        </p>
        <p style="font-size: 12px; color: #6e6e6e; margin-bottom: 24px;">
          Från: ${user?.user_metadata?.full_name || user?.email || 'Användare'}
        </p>
    `;

    Object.values(weeklyReports).forEach(week => {
      emailContent += `
        <div style="margin-bottom: 16px;">
          <h2 style="font-size: 13px; font-weight: 500; margin: 0 0 8px 0;">Vecka ${format(new Date(week.start), 'w', { locale: sv })}</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background-color: #f4f4f4;">
                <th style="text-align: left; padding: 4px; border-bottom: 1px solid #e0e0e0;">Datum</th>
                <th style="text-align: left; padding: 4px; border-bottom: 1px solid #e0e0e0;">Projekt</th>
                <th style="text-align: right; padding: 4px; border-bottom: 1px solid #e0e0e0;">Timmar</th>
                <th style="text-align: left; padding: 4px; border-bottom: 1px solid #e0e0e0;">Material</th>
                <th style="text-align: left; padding: 4px; border-bottom: 1px solid #e0e0e0;">Kommentar</th>
              </tr>
            </thead>
            <tbody>
      `;

      week.reports.forEach(report => {
        emailContent += `
              <tr>
                <td style="padding: 4px; border-bottom: 1px solid #f1f1f1;">${format(new Date(report.date), 'd MMM', { locale: sv })}</td>
                <td style="padding: 4px; border-bottom: 1px solid #f1f1f1;">${report.project}</td>
                <td style="padding: 4px; text-align: right; border-bottom: 1px solid #f1f1f1;">${report.hours}h</td>
                <td style="padding: 4px; border-bottom: 1px solid #f1f1f1;">${report.material || '-'}</td>
                <td style="padding: 4px; border-bottom: 1px solid #f1f1f1;">${report.comment || '-'}</td>
              </tr>
        `;
      });

      const weekTotal = week.reports.reduce((sum, report) => sum + report.hours, 0);
      emailContent += `
            </tbody>
          </table>
          <div style="text-align: right; font-size: 11px; color: #6e6e6e; margin-top: 4px;">
            Veckans totalt: ${weekTotal.toFixed(2)}h
          </div>
        </div>
      `;
    });

    const totalHours = timeReports.reduce((sum, report) => sum + report.hours, 0);
    emailContent += `
        <div style="margin-top: 24px; padding: 12px; background-color: #f4f4f4; border-radius: 4px;">
          <strong style="font-size: 13px;">Totalt antal timmar: ${totalHours.toFixed(2)}h</strong>
        </div>
      </div>
    `;
    return emailContent;
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

      const { data: timeReports, error: reportsError } = await supabase
        .from('time_reports')
        .select('*')
        .in('date', selectedDates);

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

      const emailContent = generateEmailContent(reportsWithProjects);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <p>Laddar kalender...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Skicka Timmar</h1>

      <Card className="mb-8 w-full max-w-md">
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <button onClick={handlePrevMonth} className="text-zinc-400 hover:text-white">
              &lt; Föregående
            </button>
            <h2 className="text-xl font-semibold">
              {format(currentDate, "MMMM yyyy", { locale: sv })}
            </h2>
            <button onClick={handleNextMonth} className="text-zinc-400 hover:text-white">
              Nästa &gt;
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"].map((day, i) => (
              <div key={i} className="text-center text-sm font-medium text-zinc-400">
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
                    className="aspect-square w-full text-sm font-medium rounded-md bg-zinc-800 opacity-25"
                    style={{ minHeight: '40px' }}
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
                  className={`aspect-square w-full text-sm font-medium rounded-md ${buttonClass} \
                    ${!isCurrentMonth ? 'opacity-50' : ''} \
                    ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}`}
                  style={{ minHeight: '40px' }}
                  disabled={isSent}
                >
                  {format(date, "d")}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="flex gap-4 w-full max-w-md">
        <button
          onClick={handleSend}
          disabled={sending || selectedDates.length === 0}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {sending ? "Skickar..." : "Skicka"}
        </button>
        <button
          onClick={() => navigate("/")}
          className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Tillbaka
        </button>
      </div>
    </div>
  );
} 