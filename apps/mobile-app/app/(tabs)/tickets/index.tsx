import React from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
// If your '@' alias isn't set, change this to a relative path like '../../lib/api'
import { api } from "../../../lib/api";

export default function TicketsScreen() {
  const router = useRouter();

  const { data, isLoading, isRefetching, refetch, isError, error } = useQuery({
    queryKey: ["tickets"],
    queryFn: async () => {
      const r = await api.get("/api/tickets");
      return r.data?.tickets ?? r.data ?? [];
    },
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ padding: 16 }}>
        <Text>Failed to load tickets: {(error as any)?.message ?? "Unknown error"}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: "#eee" }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>Tickets</Text>
      </View>

      <FlatList
        data={(data as any[])}
        keyExtractor={(item) => String((item as any).id ?? (item as any)._id)}
        refreshControl={<RefreshControl refreshing={!!isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: "#f3f3f3" }}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/tickets/[id]",
                params: { id: String((item as any).id ?? (item as any)._id) },
              })
            }
          >
            <Text style={{ fontSize: 16, fontWeight: "500" }}>
              {(item as any).title ?? `Ticket #${(item as any).id ?? (item as any)._id}`}
            </Text>
            <Text style={{ color: "#666", marginTop: 2 }}>{(item as any).status ?? "open"}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ padding: 16, color: "#666" }}>No tickets.</Text>}
      />
    </View>
  );
}
