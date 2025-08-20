import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TechnicianSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (technicianId: number, technicianName: string) => void;
  technicians: any[];
  currentUser: any;
  loading?: boolean;
}

const TechnicianSelector: React.FC<TechnicianSelectorProps> = ({
  visible,
  onClose,
  onSelect,
  technicians,
  currentUser,
  loading = false,
}) => {
  const handleSelect = (technician: any) => {
    onSelect(technician.id, `${technician.firstName} ${technician.lastName}`);
    onClose();
  };

  const handleSelfAssign = () => {
    onSelect(currentUser.id, `${currentUser.firstName} ${currentUser.lastName}`);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Assign Technician</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Loading technicians...</Text>
            </View>
          ) : (
            <>
              {/* Self Assignment Option for Admins */}
              {currentUser?.role === 'maintenance_admin' && (
                <TouchableOpacity
                  style={[styles.technicianCard, styles.selfAssignCard]}
                  onPress={handleSelfAssign}
                >
                  <View style={styles.technicianInfo}>
                    <View style={styles.avatarContainer}>
                      <Ionicons name="person" size={24} color="#ffffff" />
                    </View>
                    <View style={styles.technicianDetails}>
                      <Text style={styles.technicianName}>
                        {currentUser.firstName} {currentUser.lastName}
                      </Text>
                      <Text style={styles.technicianRole}>Assign to Myself</Text>
                      <Text style={styles.selfAssignNote}>Admin Self-Assignment</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#10b981" />
                </TouchableOpacity>
              )}

              {/* Available Technicians */}
              {technicians && technicians.length > 0 ? (
                <>
                  <Text style={styles.sectionTitle}>Available Technicians</Text>
                  {technicians.map((technician) => (
                    <TouchableOpacity
                      key={technician.id}
                      style={styles.technicianCard}
                      onPress={() => handleSelect(technician)}
                    >
                      <View style={styles.technicianInfo}>
                        <View style={styles.avatarContainer}>
                          <Ionicons name="person" size={24} color="#ffffff" />
                        </View>
                        <View style={styles.technicianDetails}>
                          <Text style={styles.technicianName}>
                            {technician.firstName} {technician.lastName}
                          </Text>
                          <Text style={styles.technicianRole}>
                            {technician.role === 'technician' ? 'Technician' : 'Maintenance Admin'}
                          </Text>
                          <Text style={styles.technicianEmail}>{technician.email}</Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                    </TouchableOpacity>
                  ))}
                </>
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="people" size={48} color="#6b7280" />
                  <Text style={styles.emptyTitle}>No Other Technicians</Text>
                  <Text style={styles.emptyMessage}>
                    {currentUser?.role === 'maintenance_admin' 
                      ? 'No other technicians available. You can assign this ticket to yourself.'
                      : 'No technicians available for assignment at this time.'
                    }
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginTop: 8,
  },
  technicianCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selfAssignCard: {
    backgroundColor: '#10b981',
    marginBottom: 20,
  },
  technicianInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6b7280',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  technicianDetails: {
    flex: 1,
  },
  technicianName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  technicianRole: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  technicianEmail: {
    fontSize: 12,
    color: '#9ca3af',
  },
  selfAssignNote: {
    fontSize: 12,
    color: '#ffffff',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});

export default TechnicianSelector;