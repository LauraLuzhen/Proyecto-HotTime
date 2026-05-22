import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  
  Text,
  View,
} from "react-native";
import { bandejaStyles as styles } from "../../lib/mobileStyles";
import type { CommunicationDetailResponse, CommunicationInboxResponse } from "@hottime/types";

import { useAppAlert } from "../../components/AppAlert";
import { ScreenEmptyState } from "../../components/ScreenEmptyState";
import { ScreenSegmentedButtons } from "../../components/ScreenSegmentedButtons";
import { ApiClientError, createApi } from "../../lib/api";
import { communicationTone, communicationTypeLabel, truncateText } from "../../lib/schedule";
import { useAuth } from "../../state/auth/AuthContext";
import { tokenStorage } from "../../state/auth/storage";
import { useRefreshOnFocus } from "../../hooks/useRefreshOnFocus";

type InboxFilter = "ALL" | "READ" | "UNREAD";

function formatDate(value: Date | string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function BandejaScreen() {
  const auth = useAuth();
  const appAlert = useAppAlert();
  const api = useMemo(() => createApi(() => tokenStorage.get()), []);
  const [communications, setCommunications] = useState<CommunicationInboxResponse[]>([]);
  const [filter, setFilter] = useState<InboxFilter>("ALL");
  const [readCount, setReadCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedCommunication, setSelectedCommunication] = useState<CommunicationDetailResponse | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canDeleteGlobally = auth.user?.role === "ADMIN" || auth.user?.role === "MANAGER";

  function clearSelection() {
    setSelectionMode(false);
    setSelectedIds([]);
  }

  const loadInbox = useCallback(
    async (nextFilter: InboxFilter, showSpinner = true) => {
      if (showSpinner) setLoading(true);
      setError(null);

      try {
        const query = nextFilter === "ALL"
          ? undefined
          : { read: nextFilter === "READ" };
        const [items, readResult, unreadResult] = await Promise.all([
          api.communication.getInbox(query),
          api.communication.countRead(),
          api.communication.countUnread(),
        ]);

        setCommunications(items);
        setReadCount(readResult.count);
        setUnreadCount(unreadResult.count);
      } catch (err) {
        const e = err as ApiClientError;
        setCommunications([]);
        setError(e.message ?? "No se ha podido cargar la bandeja.");
      } finally {
        if (showSpinner) setLoading(false);
      }
    },
    [api.communication]
  );

  useEffect(() => {
    void loadInbox("ALL");
  }, [loadInbox]);

  useRefreshOnFocus(() => {
    void loadInbox(filter, false);
  }, [filter, loadInbox]);

  async function changeFilter(nextFilter: InboxFilter) {
    setFilter(nextFilter);
    clearSelection();
    await loadInbox(nextFilter);
  }

  async function refresh() {
    setRefreshing(true);
    await loadInbox(filter, false);
    setRefreshing(false);
  }

  async function openCommunication(communicationId: number) {
    if (selectionMode) {
      setSelectedIds((current) => (
        current.includes(communicationId)
          ? current.filter((id) => id !== communicationId)
          : [...current, communicationId]
      ));
      return;
    }

    setDetailLoading(true);
    setError(null);

    try {
      const detail = await api.communication.getById(communicationId);
      setSelectedCommunication(detail);
      await loadInbox(filter, false);
    } catch (err) {
      const e = err as ApiClientError;
      setError(e.message ?? "No se ha podido abrir el comunicado.");
    } finally {
      setDetailLoading(false);
    }
  }

  function toggleSelectionMode() {
    if (communications.length === 0) {
      appAlert.showAlert({
        title: "Sin comunicados",
        message: "No hay comunicados que puedas eliminar.",
      });
      return;
    }

    setSelectionMode((current) => {
      if (current) setSelectedIds([]);
      return !current;
    });
  }

  async function applySelectedRemoval() {
    if (!selectedIds.length) {
      appAlert.showAlert({
        title: "Sin selección",
        message: "Selecciona al menos un comunicado.",
      });
      return;
    }

    if (canDeleteGlobally) {
      appAlert.showAlert({
        title: "Elegir acción",
        message: "¿Quieres quitarlo de tu bandeja o eliminarlo para todos?",
        buttons: [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Quitar de mi bandeja",
            onPress: () => {
              void runHideSelected();
            },
          },
          {
            text: "Eliminar comunicado",
            style: "destructive",
            onPress: () => {
              confirmDeleteFromDatabase();
            },
          },
        ],
      });
      return;
    }

    await runHideSelected();
  }

  async function runHideSelected() {
    setBulkLoading(true);
    setError(null);

    try {
      await api.communication.hideInbox({ communicationIds: selectedIds });
      clearSelection();
      setSelectedCommunication(null);
      await loadInbox(filter, false);
    } catch (err) {
      const e = err as ApiClientError;
      setError(e.message ?? "No se han podido quitar los comunicados.");
    } finally {
      setBulkLoading(false);
    }
  }

  async function runDeleteSelected() {
    setBulkLoading(true);
    setError(null);

    try {
      await api.communication.delete({ communicationIds: selectedIds });
      clearSelection();
      setSelectedCommunication(null);
      await loadInbox(filter, false);
    } catch (err) {
      const e = err as ApiClientError;
      setError(e.message ?? "No se han podido eliminar los comunicados.");
    } finally {
      setBulkLoading(false);
    }
  }

  function confirmDeleteFromDatabase() {
    appAlert.showAlert({
      title: "¿Estás seguro?",
      message: "Se borrará el comunicado definitivamente para todos los usuarios. Esta acción no se puede deshacer.",
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, eliminar",
          style: "destructive",
          onPress: () => {
            void runDeleteSelected();
          },
        },
      ],
    });
  }

  const totalCount = readCount + unreadCount;
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <View style={styles.headerPanel}>
          <View style={styles.countsRow}>
            <View style={styles.countBox}>
              <Text style={styles.countValue}>{totalCount}</Text>
              <Text style={styles.countLabel}>Total</Text>
            </View>
            <View style={styles.countBox}>
              <Text style={styles.countValue}>{unreadCount}</Text>
              <Text style={styles.countLabel}>No leídos</Text>
            </View>
            <View style={styles.countBox}>
              <Text style={styles.countValue}>{readCount}</Text>
              <Text style={styles.countLabel}>Leídos</Text>
            </View>
          </View>
          <ScreenSegmentedButtons
            items={[
              { label: "Todos", value: "ALL" },
              { label: "No leídos", value: "UNREAD" },
              { label: "Leídos", value: "READ" },
            ]}
            value={filter}
            onChange={(nextFilter) => void changeFilter(nextFilter)}
          />
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color="#5f6df5" />
            <Text style={styles.loadingText}>Cargando comunicados...</Text>
          </View>
        ) : error ? (
          <ScreenEmptyState title="No se ha podido cargar" detail={error} />
        ) : communications.length === 0 ? (
          <ScreenEmptyState title="Sin comunicados" detail="No hay comunicados para este filtro." />
        ) : (
          <View style={styles.list}>
            {communications.map((communication) => {
              const tone = communicationTone(communication.type);
              const selected = selectedSet.has(communication.id);

              return (
                <Pressable
                  key={communication.id}
                  style={[
                    styles.card,
                    selectionMode && styles.cardSelectable,
                    selected && styles.cardSelected,
                    !communication.read && { borderColor: tone.fill },
                  ]}
                  onPress={() => void openCommunication(communication.id)}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleWrap}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{communication.title}</Text>
                      <Text style={styles.sender} numberOfLines={1}>{communication.sender.fullName}</Text>
                    </View>
                    <View style={[styles.typePill, { backgroundColor: tone.soft, borderColor: tone.border }]}>
                      <Text style={[styles.typeText, { color: tone.fill }]}>
                        {communicationTypeLabel(communication.type)}
                      </Text>
                    </View>
                    {selectionMode ? (
                      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                        <Text style={[styles.checkboxText, selected && styles.checkboxTextSelected]}>
                          {selected ? "✓" : ""}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.preview}>{truncateText(communication.content)}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.dateText}>{formatDate(communication.sentAt)}</Text>
                    <Text style={[styles.readState, !communication.read && styles.unreadState]}>
                      {communication.read ? "Leído" : "No leído"}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {selectionMode ? (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionText}>{selectedIds.length} seleccionados</Text>
          <View style={styles.selectionActions}>
            <Pressable style={styles.cancelSelectionButton} onPress={clearSelection} disabled={bulkLoading}>
              <Text style={styles.cancelSelectionText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmSelectionButton, bulkLoading && styles.confirmSelectionButtonDisabled]}
              onPress={() => void applySelectedRemoval()}
              disabled={bulkLoading}
            >
              {bulkLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmSelectionText}>
                  {canDeleteGlobally ? "Eliminar" : "Quitar"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.fabContainer}>
        <Pressable
          style={[styles.fab, communications.length === 0 && styles.fabDisabled]}
          onPress={toggleSelectionMode}
        >
          <Text style={styles.fabText}>{selectionMode ? "Salir" : "Eliminar"}</Text>
        </Pressable>
      </View>

      {detailLoading ? (
        <View style={styles.detailLoading}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : null}

      <Modal
        animationType="slide"
        transparent
        visible={selectedCommunication !== null}
        onRequestClose={() => setSelectedCommunication(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            {selectedCommunication ? (
              <ScrollView contentContainerStyle={styles.modalContent}>
                <Pressable style={styles.xButton} onPress={() => setSelectedCommunication(null)}>
                  <Text style={styles.xButtonText}>X</Text>
                </Pressable>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailTitle}>{selectedCommunication.title}</Text>
                  <Text style={styles.detailSender}>{selectedCommunication.sender.fullName} - {selectedCommunication.sender.email}</Text>
                  <Text style={styles.detailDate}>{formatDate(selectedCommunication.sentAt)}</Text>
                </View>
                <View style={styles.detailBody}>
                  <Text style={styles.detailContent}>{selectedCommunication.content}</Text>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

