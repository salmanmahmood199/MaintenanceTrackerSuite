import React from "react";
import { View, Text, ActivityIndicator, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../lib/api";

type Location = { name?: string; address?: string; city?: string; state?: string; zip?: string };
type Ticket = {
  id: string | number;
  title?: string;
  description?: string;
  status?: string;
  location?: Location;
} & Record<string, any>;

function normalizeTicket(raw: any): Ticket | null {
  if (!raw) return null;

  const loc = raw.location ?? {};
  return {
    ...raw,
    location: {
      name:
        loc.name ??
        raw.locationName ??
        raw.site?.name ??
        raw.org?.name ??
        "—",
      address:
        loc.address ??
        raw.address ??
        raw.site?.address ??
        "",
      city: loc.city ?? raw.city ?? "",
      state: loc.state ?? raw.state ?? "",
      zip: loc.zip ?? raw.zip ?? "",
    },
  };
}

export default function TicketDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  const { data: ticket, isLoading, isError, error } = useQuery({
    queryKey: ["ticket", id],
    enabled: !!id,
    queryFn: async () => {
      const r = await api.get(`/api/tickets/${id}`);
      const raw = r.data?.ticket ?? r.data;
      return normalizeTicket(raw);
    },
  });

  // basic states
  if (!id) return <View style={{ padding: 16 }}><Text>Invalid route: no id.</Text></View>;
  if (isLoading) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator /></View>;
  if (isError)   return <View style={{ padding: 16 }}><Text>Failed to load: {(error as any)?.message ?? "Unknown error"}</Text></View>;
  if (!ticket)   return <View style={{ padding: 16 }}><Text>Ticket not found.</Text></View>;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: "white" }}>
      <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 8 }}>
        {ticket.title ?? `Ticket #${ticket.id}`}
      </Text>
      {!!ticket.description && (
        <Text style={{ color: "#555", marginBottom: 16 }}>{ticket.description}</Text>
      )}

      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontWeight: "600", marginBottom: 4 }}>Location</Text>
        <Text style={{ fontSize: 16 }}>
          {ticket.location?.name ?? "—"}
        </Text>
        {!!ticket.location?.address && (
          <Text style={{ color: "#555", marginTop: 2 }}>
            {ticket.location.address}
            {ticket.location.city ? `, ${ticket.location.city}` : ""}
            {ticket.location.state ? `, ${ticket.location.state}` : ""}
            {ticket.location.zip ? ` ${ticket.location.zip}` : ""}
          </Text>
        )}
      </View>

      {/* Status */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontWeight: "600", marginBottom: 4 }}>Status</Text>
        <Text style={{ fontSize: 16, color: "#555" }}>
          {ticket.status ?? "Unknown"}
        </Text>
      </View>

      {/* Priority */}
      {!!ticket.priority && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: "600", marginBottom: 4 }}>Priority</Text>
          <Text style={{ fontSize: 16, color: "#555" }}>
            {ticket.priority}
          </Text>
        </View>
      )}

      {/* Reporter */}
      {!!(ticket.reporter?.name || ticket.createdBy?.name) && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: "600", marginBottom: 4 }}>Reported By</Text>
          <Text style={{ fontSize: 16, color: "#555" }}>
            {ticket.reporter?.name ?? ticket.createdBy?.name ?? "Unknown"}
          </Text>
          {!!(ticket.reporter?.email || ticket.createdBy?.email) && (
            <Text style={{ fontSize: 14, color: "#777", marginTop: 2 }}>
              {ticket.reporter?.email ?? ticket.createdBy?.email}
            </Text>
          )}
        </View>
      )}

      {/* Created Date */}
      {!!ticket.createdAt && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: "600", marginBottom: 4 }}>Created</Text>
          <Text style={{ fontSize: 16, color: "#555" }}>
            {new Date(ticket.createdAt).toLocaleDateString()}
          </Text>
        </View>
      )}

      {/* Continue with other sections, always using ?. and ?? for nested reads */}
    </ScrollView>
  );
}
