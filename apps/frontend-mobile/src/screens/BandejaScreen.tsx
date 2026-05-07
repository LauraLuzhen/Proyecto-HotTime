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
import type { CommunicationDetailResponse, CommunicationInboxResponse, CommunicationType } from "@hottime/types";

import { ApiClientError, createApi } from "../lib/api";
import { tokenStorage } from "../state/auth/storage";

type InboxFilter = "ALL" | "READ" | "UNREAD";

function typeLabel(type: CommunicationType) {
  const labels: Record<CommunicationType, string> = {
    GENERAL: "General",
    INFO: "Info",
    WARNING: "Aviso",
    URGENT: "Urgente",
  };
  return labels[type];
}

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

function previewText(value: string) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > 110 ? `${clean.slice(0, 110)}...` : clean;
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDetail}>{detail}</Text>
    </View>
  );
}

export function BandejaScreen() {
  const api = useMemo(() => createApi(() => tokenStorage.get()), []);
  const [communications, setCommunications] = useState<CommunicationInboxResponse[]>([]);
  const [filter, setFilter] = useState<InboxFilter>("ALL");
  const [readCount, setReadCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedCommunication, setSelectedCommunication] = useState<CommunicationDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function changeFilter(nextFilter: InboxFilter) {
    setFilter(nextFilter);
    await loadInbox(nextFilter);
  }

  async function refresh() {
    setRefreshing(true);
    await loadInbox(filter, false);
    setRefreshing(false);
  }

  async function openCommunication(communicationId: number) {
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

  const totalCount = readCount + unreadCount;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <View style={styles.headerPanel}>
          <Text style={styles.title}>Bandeja</Text>
          <View style={styles.countsRow}>
            <View style={styles.countBox}>
              <Text style={styles.countValue}>{totalCount}</Text>
              <Text style={styles.countLabel}>Total</Text>
            </View>
            <View style={styles.countBox}>
              <Text style={styles.countValue}>{unreadCount}</Text>
              <Text style={styles.countLabel}>No leidos</Text>
            </View>
            <View style={styles.countBox}>
              <Text style={styles.countValue}>{readCount}</Text>
              <Text style={styles.countLabel}>Leidos</Text>
            </View>
          </View>
          <View style={styles.filterRow}>
            <Pressable
              style={[styles.filterButton, filter === "ALL" && styles.filterButtonActive]}
              onPress={() => void changeFilter("ALL")}
            >
              <Text style={[styles.filterText, filter === "ALL" && styles.filterTextActive]}>Todos</Text>
            </Pressable>
            <Pressable
              style={[styles.filterButton, filter === "UNREAD" && styles.filterButtonActive]}
              onPress={() => void changeFilter("UNREAD")}
            >
              <Text style={[styles.filterText, filter === "UNREAD" && styles.filterTextActive]}>Unread</Text>
            </Pressable>
            <Pressable
              style={[styles.filterButton, filter === "READ" && styles.filterButtonActive]}
              onPress={() => void changeFilter("READ")}
            >
              <Text style={[styles.filterText, filter === "READ" && styles.filterTextActive]}>Read</Text>
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color="#2f5f5b" />
            <Text style={styles.loadingText}>Cargando comunicados...</Text>
          </View>
        ) : error ? (
          <EmptyState title="No se ha podido cargar" detail={error} />
        ) : communications.length === 0 ? (
          <EmptyState title="Sin comunicados" detail="No hay comunicados para este filtro." />
        ) : (
          <View style={styles.list}>
            {communications.map((communication) => (
              <Pressable
                key={communication.id}
                style={[styles.card, !communication.read && styles.cardUnread]}
                onPress={() => void openCommunication(communication.id)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleWrap}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{communication.title}</Text>
                    <Text style={styles.sender} numberOfLines={1}>{communication.sender.fullName}</Text>
                  </View>
                  <View style={[styles.typePill, communication.type === "URGENT" && styles.typePillUrgent]}>
                    <Text style={[styles.typeText, communication.type === "URGENT" && styles.typeTextUrgent]}>
                      {typeLabel(communication.type)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.preview}>{previewText(communication.content)}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.dateText}>{formatDate(communication.sentAt)}</Text>
                  <Text style={[styles.readState, !communication.read && styles.unreadState]}>
                    {communication.read ? "Leido" : "No leido"}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

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
    backgroundColor: "#f7f7f4",
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 16,
    paddingBottom: 28,
  },
  headerPanel: {
    backgroundColor: "#fff",
    borderColor: "#deded8",
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
    backgroundColor: "#f1f6f4",
    borderColor: "#d8e3df",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    padding: 10,
  },
  countValue: {
    color: "#2f5f5b",
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
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    alignItems: "center",
    borderColor: "#cfd6d2",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 40,
    paddingVertical: 10,
  },
  filterButtonActive: {
    backgroundColor: "#2f5f5b",
    borderColor: "#2f5f5b",
  },
  filterText: {
    color: "#2f5f5b",
    fontWeight: "700",
  },
  filterTextActive: {
    color: "#fff",
  },
  loading: {
    alignItems: "center",
    gap: 8,
    padding: 28,
  },
  loadingText: {
    color: "#666",
  },
  empty: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#deded8",
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 24,
  },
  emptyTitle: {
    color: "#1f1f1d",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyDetail: {
    color: "#6a6a64",
    textAlign: "center",
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderColor: "#deded8",
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  cardUnread: {
    borderColor: "#2f5f5b",
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
    backgroundColor: "#f1f6f4",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  typePillUrgent: {
    backgroundColor: "#fde9e7",
  },
  typeText: {
    color: "#2f5f5b",
    fontSize: 12,
    fontWeight: "700",
  },
  typeTextUrgent: {
    color: "#b42318",
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
    color: "#2f5f5b",
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
    borderColor: "#d7d7d0",
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
    borderColor: "#deded8",
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  detailContent: {
    color: "#222",
    fontSize: 16,
    lineHeight: 23,
  },
});
