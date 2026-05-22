import { useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, SafeAreaView, ScrollView,  Text, View } from "react-native";
import type { ShiftResponse } from "@hottime/types";

import { screenSharedStyles as calendarDayStyles } from "../../lib/mobileStyles";
import { CalendarPanel } from "../../components/CalendarPanel";
import { ApiClientError, createApi } from "../../lib/api";
import { MonthYearPicker } from "../../components/MonthYearPicker";
import { BrandBackdrop } from "../../components/BrandBackdrop";
import {
  buildMonthDays,
  calendarDayNames,
  categoryName,
  endOfDay,
  endOfMonth,
  formatDay,
  formatDateTime,
  formatMonth,
  formatRange,
  dayTitle,
  palette,
  sameDay,
  startOfMonth,
  statusLabel,
} from "../../lib/schedule";
import { useAuth } from "../../state/auth/AuthContext";
import { tokenStorage } from "../../state/auth/storage";
import { useRefreshOnFocus } from "../../hooks/useRefreshOnFocus";

import { myScheduleStyles as styles } from "../../lib/mobileStyles";
function shiftStartLabel(shift: ShiftResponse) {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(shift.startsAt));
}

export function MyScheduleScreen() {
  const auth = useAuth();
  const api = useMemo(() => createApi(() => tokenStorage.get()), []);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [shifts, setShifts] = useState<ShiftResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);

  async function loadMonth(targetMonth = month) {
    const userId = auth.user?.id;
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const result = await api.planning.getShifts({
        userId,
        published: true,
        startsFrom: startOfMonth(targetMonth),
        startsTo: endOfMonth(targetMonth),
      });
      setShifts(result.shifts);
    } catch (err) {
      const e = err as ApiClientError;
      setShifts([]);
      setError(e.message ?? "No se pudo cargar tu horario mensual.");
    } finally {
      setLoading(false);
    }
  }

  function goToMonth(nextMonth: Date) {
    const normalized = startOfMonth(nextMonth);
    setMonth(normalized);
    setSelectedDay(normalized);
    setMonthPickerOpen(false);
  }

  useEffect(() => {
    void loadMonth(month);
  }, [auth.user?.id, month]);

  useRefreshOnFocus(() => {
    void loadMonth(month);
  }, [auth.user?.id, month]);

  const days = buildMonthDays(month);
  const selectedShifts = shifts.filter((shift) => sameDay(shift.startsAt, selectedDay));
  return (
    <SafeAreaView style={styles.safeArea}>
      <BrandBackdrop />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void loadMonth(month)} />}
      >

        <CalendarPanel
          days={days}
          error={error}
          loading={loading}
          loadingLabel="Cargando horario..."
          month={month}
          monthLabel={formatMonth(month)}
          onNextMonth={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
          onOpenMonthPicker={() => setMonthPickerOpen(true)}
          onPrevMonth={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
          onToday={() => {
            const today = new Date();
            setMonth(startOfMonth(today));
            setSelectedDay(today);
          }}
          selectedDay={selectedDay}
          weekdayLabels={calendarDayNames}
          renderDay={(day, meta) => {
            const dayShifts = shifts.filter((shift) => sameDay(shift.startsAt, day));

            return (
              <Pressable
                key={day.toISOString()}
                style={[
                  calendarDayStyles.calendarDayCell,
                  !meta.inMonth && calendarDayStyles.calendarDayCellMuted,
                  meta.selected && calendarDayStyles.calendarDayCellSelected,
                ]}
                onPress={() => setSelectedDay(day)}
              >
                <Text
                  style={[
                    calendarDayStyles.calendarDayNumber,
                    !meta.inMonth && calendarDayStyles.calendarDayNumberMuted,
                    meta.selected && calendarDayStyles.calendarDayNumberSelected,
                  ]}
                >
                  {day.getDate()}
                </Text>
                <Text style={[calendarDayStyles.calendarDayHint, meta.selected && calendarDayStyles.calendarDayHintSelected]}>
                  {dayShifts.length ? `${dayShifts.length} turnos` : "Libre"}
                </Text>
              </Pressable>
            );
          }}
        />

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.sectionTitle}>Turnos del {formatDay(selectedDay)}</Text>
            <Text style={styles.panelHint}>{formatDateTime(selectedDay)}</Text>
          </View>
          {selectedShifts.length ? (
            <View style={styles.shiftList}>
              {selectedShifts.map((shift) => (
                <View key={shift.id} style={styles.shiftCard}>
                  <View style={styles.shiftTop}>
                    <Text style={styles.shiftTime}>{formatRange(shift)}</Text>
                    <Text style={[styles.badge, !shift.published && styles.badgeDraft]}>{shift.published ? "Publicado" : "Borrador"}</Text>
                  </View>
                  <Text style={styles.shiftMeta}>{categoryName(shift)} · {statusLabel(shift.status)}</Text>
                  <Text style={styles.shiftMeta}>Inicio exacto {formatDateTime(shift.startsAt)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.muted}>No tienes turnos publicados este dÃ­a.</Text>
          )}
        </View>
      </ScrollView>

      <MonthYearPicker
        title="Elegir mes y aÃ±o"
        visible={monthPickerOpen}
        value={month}
        onClose={() => setMonthPickerOpen(false)}
        onSelect={goToMonth}
      />
    </SafeAreaView>
  );
}

