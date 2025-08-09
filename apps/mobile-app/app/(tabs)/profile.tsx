import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/contexts/AuthContext";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  const getUserRoleDisplay = () => {
    switch (user?.role) {
      case "root":
        return "System Administrator";
      case "org_admin":
        return "Organization Administrator";
      case "org_subadmin":
        return "Organization Sub-Administrator";
      case "maintenance_admin":
        return "Maintenance Vendor Administrator";
      case "technician":
        return "Technician";
      case "residential":
        return "Residential User";
      default:
        return "User";
    }
  };

  const ProfileItem = ({ icon, title, value, onPress }: any) => (
    <TouchableOpacity style={styles.profileItem} onPress={onPress}>
      <View style={styles.profileItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#3b82f6" />
        </View>
        <Text style={styles.profileItemTitle}>{title}</Text>
      </View>
      <View style={styles.profileItemRight}>
        <Text style={styles.profileItemValue}>{value}</Text>
        <Ionicons name="chevron-forward" size={20} color="#64748b" />
      </View>
    </TouchableOpacity>
  );

  const ActionItem = ({ icon, title, onPress, color = "#3b82f6" }: any) => (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
      <View style={styles.actionItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={[styles.actionItemTitle, { color }]}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={color} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#1e293b", "#7c3aed", "#1e293b"]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <ScrollView style={styles.content}>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={["#3b82f6", "#8b5cf6"]}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {user?.firstName?.charAt(0) || ""}
                  {user?.lastName?.charAt(0) || ""}
                </Text>
              </LinearGradient>
            </View>
            <Text style={styles.userName}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={styles.userRole}>{getUserRoleDisplay()}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>

          {/* Profile Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            <View style={styles.sectionContent}>
              <ProfileItem
                icon="person"
                title="Full Name"
                value={`${user?.firstName} ${user?.lastName}`}
              />
              <ProfileItem icon="mail" title="Email" value={user?.email} />
              <ProfileItem
                icon="briefcase"
                title="Role"
                value={getUserRoleDisplay()}
              />
              {user?.phone && (
                <ProfileItem icon="call" title="Phone" value={user.phone} />
              )}
              {(user?.address || user?.city) && (
                <ProfileItem
                  icon="location"
                  title="Address"
                  value={`${user?.address || ""} ${user?.city || ""} ${user?.state || ""} ${user?.zipCode || ""}`.trim()}
                />
              )}
            </View>
          </View>

          {/* Organization/Vendor Information */}
          {(user?.organizationId || user?.maintenanceVendorId) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {user?.organizationId ? "Organization" : "Vendor"} Information
              </Text>
              <View style={styles.sectionContent}>
                <ProfileItem
                  icon="business"
                  title={user?.organizationId ? "Organization ID" : "Vendor ID"}
                  value={user?.organizationId || user?.maintenanceVendorId}
                />
              </View>
            </View>
          )}

          {/* Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <View style={styles.sectionContent}>
              <ActionItem
                icon="notifications"
                title="Notifications"
                onPress={() =>
                  Alert.alert(
                    "Coming Soon",
                    "Notification settings will be available soon.",
                  )
                }
              />
              <ActionItem
                icon="lock-closed"
                title="Privacy & Security"
                onPress={() =>
                  Alert.alert(
                    "Coming Soon",
                    "Privacy settings will be available soon.",
                  )
                }
              />
              <ActionItem
                icon="help-circle"
                title="Help & Support"
                onPress={() =>
                  Alert.alert(
                    "Help & Support",
                    "Contact support at support@taskscout.com",
                  )
                }
              />
              <ActionItem
                icon="information-circle"
                title="About"
                onPress={() =>
                  Alert.alert(
                    "TaskScout Mobile",
                    "Version 1.0.0\nBuilt with React Native and Expo",
                  )
                }
              />
            </View>
          </View>

          {/* Logout */}
          <View style={styles.section}>
            <View style={styles.sectionContent}>
              <ActionItem
                icon="log-out"
                title="Logout"
                onPress={handleLogout}
                color="#ef4444"
              />
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1e293b",
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: "#06b6d4",
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 14,
    color: "#94a3b8",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  profileItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  profileItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  profileItemTitle: {
    fontSize: 14,
    color: "#94a3b8",
  },
  profileItemRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileItemValue: {
    fontSize: 14,
    color: "#ffffff",
    marginRight: 8,
    textAlign: "right",
    flex: 1,
  },
  actionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  actionItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  actionItemTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
});
