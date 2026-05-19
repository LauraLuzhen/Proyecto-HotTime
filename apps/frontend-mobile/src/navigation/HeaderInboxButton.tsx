import { useMemo, useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import type { CommunicationDetailResponse, CommunicationInboxResponse, CommunicationType } from "@hottime/types";

import { ApiClientError, createApi } from "../lib/api";
import { navigationStyles as styles } from "../lib/mobileStyles";
import { communicationTone, palette } from "../lib/schedule";
import { tokenStorage } from "../state/auth/storage";

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
  }).format(new Date(value));
}

function previewText(value: string) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > 86 ? `${clean.slice(0, 86)}...` : clean;
}

export function HeaderInboxButton({ navigation }: { navigation: any }) {
  const api = useMemo(() => createApi(() => tokenStorage.get()), []);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CommunicationInboxResponse[]>([]);
  const [detail, setDetail] = useState<CommunicationDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadLatest() {
    setOpen(true);
    setLoading(true);
    setError(null);

    try {
      const result = await api.communication.getInbox();
      setItems(result.slice(0, 5));
    } catch (err) {
      const e = err as ApiClientError;
      setItems([]);
      setError(e.message ?? "No se han podido cargar los comunicados.");
    } finally {
      setLoading(false);
    }
  }

  async function openCommunication(communicationId: number) {
    setDetailLoading(true);
    setError(null);

    try {
      const result = await api.communication.getById(communicationId);
      setDetail(result);
      const refreshed = await api.communication.getInbox();
      setItems(refreshed.slice(0, 5));
    } catch (err) {
      const e = err as ApiClientError;
      setError(e.message ?? "No se ha podido abrir el comunicado.");
    } finally {
      setDetailLoading(false);
    }
  }

  function goToInbox() {
    setOpen(false);
    setDetail(null);
    navigation.navigate("Bandeja");
  }

  return (
    <>
      <Pressable style={styles.headerInboxButton} onPress={() => void loadLatest()}>
        <MaterialIcons name="notifications" size={18} color={palette.accent} />
      </Pressable>

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.inboxPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Últimos comunicados</Text>
              <Pressable style={styles.closeButton} onPress={() => setOpen(false)}>
                <MaterialIcons name="close" size={18} color={palette.text} />
              </Pressable>
            </View>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#5f6df5" />
                <Text style={styles.loadingText}>Cargando...</Text>
              </View>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : items.length === 0 ? (
              <Text style={styles.emptyText}>No tienes comunicados.</Text>
            ) : (
              <View style={styles.latestList}>
                {items.map((item) => {
                  const tone = communicationTone(item.type);

                  return (
                    <Pressable
                      key={item.id}
                      style={[
                        styles.latestItem,
                        { backgroundColor: tone.soft, borderColor: tone.border },
                        !item.read && styles.latestItemUnread,
                      ]}
                      onPress={() => void openCommunication(item.id)}
                    >
                      <View style={styles.latestTopRow}>
                        <Text style={styles.latestTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={[styles.latestState, { color: tone.fill }, !item.read && styles.latestStateUnread]}>
                          {item.read ? "Leido" : "Nuevo"}
                        </Text>
                      </View>
                      <Text style={[styles.latestMeta, { color: tone.text }]} numberOfLines={1}>
                        {item.sender.fullName} - {typeLabel(item.type)} - {formatDate(item.sentAt)}
                      </Text>
                      <Text style={styles.latestPreview}>{previewText(item.content)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <Pressable style={styles.viewAllButton} onPress={goToInbox}>
              <Text style={styles.viewAllText}>Ver todo</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent animationType="slide" visible={detail !== null} onRequestClose={() => setDetail(null)}>
        <View style={styles.detailOverlay}>
          <View style={styles.detailPanel}>
            {detailLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#5f6df5" />
              </View>
            ) : detail ? (
              <ScrollView contentContainerStyle={styles.detailContent}>
                <Pressable style={styles.closeButton} onPress={() => setDetail(null)}>
                  <MaterialIcons name="close" size={18} color={palette.text} />
                </Pressable>
                <Text style={styles.detailTitle}>{detail.title}</Text>
                <Text style={styles.detailMeta}>{detail.sender.fullName} - {detail.sender.email}</Text>
                <Text style={styles.detailMeta}>{typeLabel(detail.type)} - {formatDate(detail.sentAt)}</Text>
                <View style={styles.detailBody}>
                  <Text style={styles.detailText}>{detail.content}</Text>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}
