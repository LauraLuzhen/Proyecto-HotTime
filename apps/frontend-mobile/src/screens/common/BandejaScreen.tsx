import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
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

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#eef3ff",
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 16,
    paddingBottom: 132,
  },
  headerPanel: {
    backgroundColor: "#fff",
    borderColor: "#d7ddff",
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 14,
  },
  title: {
    color: "#151515",
    fontSize: 22,
    fontWeight: "700",
  },
  countsRow: {
    flexDirection: "row",
    gap: 8,
  },
  countBox: {
    backgroundColor: "#f7f8ff",
    borderColor: "#e4e7ff",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    padding: 10,
  },
  countValue: {
    color: "#5f6df5",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  countLabel: {
    color: "#62625c",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  loading: {
    alignItems: "center",
    gap: 8,
    padding: 28,
  },
  loadingText: {
    color: "#666",
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderColor: "#d7ddff",
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  cardSelectable: {
    borderStyle: "dashed",
  },
  cardSelected: {
    backgroundColor: "#f7f4ff",
    borderColor: "#5f6df5",
  },
  cardUnread: {
    borderColor: "#5f6df5",
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
  },
  cardTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    color: "#1f1f1d",
    fontSize: 16,
    fontWeight: "700",
  },
  sender: {
    color: "#64645e",
    fontSize: 13,
  },
  typePill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  checkbox: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#c9d0ff",
    borderRadius: 999,
    borderWidth: 1,
    height: 22,
    justifyContent: "center",
    marginLeft: 2,
    width: 22,
  },
  checkboxSelected: {
    backgroundColor: "#5f6df5",
    borderColor: "#5f6df5",
  },
  checkboxText: {
    color: "#5f6df5",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 14,
  },
  checkboxTextSelected: {
    color: "#fff",
  },
  preview: {
    color: "#393934",
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  dateText: {
    color: "#75756e",
    flex: 1,
    fontSize: 12,
  },
  readState: {
    color: "#6a6a64",
    fontSize: 12,
    fontWeight: "700",
  },
  unreadState: {
    color: "#5f6df5",
  },
  detailLoading: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  modalOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    flex: 1,
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    maxHeight: "88%",
  },
  modalContent: {
    gap: 16,
    padding: 16,
    paddingBottom: 28,
  },
  xButton: {
    alignItems: "center",
    alignSelf: "flex-end",
    borderColor: "#d7ddff",
    borderRadius: 8,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  xButtonText: {
    color: "#2f2f2b",
    fontWeight: "700",
  },
  detailHeader: {
    gap: 6,
  },
  detailTitle: {
    color: "#151515",
    fontSize: 22,
    fontWeight: "700",
  },
  detailSender: {
    color: "#4c4c47",
    fontSize: 14,
  },
  detailDate: {
    color: "#75756e",
    fontSize: 13,
  },
  detailBody: {
    borderColor: "#d7ddff",
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  detailContent: {
    color: "#222",
    fontSize: 16,
    lineHeight: 23,
  },
  selectionBar: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#d7ddff",
    borderRadius: 14,
    borderWidth: 1,
    bottom: 88,
    flexDirection: "row",
    gap: 12,
    left: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    position: "absolute",
    right: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  selectionText: {
    color: "#1f1f1d",
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  selectionActions: {
    flexDirection: "row",
    gap: 8,
  },
  cancelSelectionButton: {
    alignItems: "center",
    borderColor: "#d7ddff",
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 88,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelSelectionText: {
    color: "#3d3d39",
    fontWeight: "700",
  },
  confirmSelectionButton: {
    alignItems: "center",
    backgroundColor: "#5f6df5",
    borderRadius: 10,
    minWidth: 88,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  confirmSelectionButtonDisabled: {
    opacity: 0.8,
  },
  confirmSelectionText: {
    color: "#fff",
    fontWeight: "700",
  },
  fabContainer: {
    bottom: 24,
    position: "absolute",
    right: 16,
  },
  fab: {
    alignItems: "center",
    backgroundColor: "#5f6df5",
    borderRadius: 999,
    elevation: 4,
    minWidth: 112,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  fabDisabled: {
    opacity: 0.45,
  },
  fabText: {
    color: "#fff",
    fontWeight: "700",
  },
});


