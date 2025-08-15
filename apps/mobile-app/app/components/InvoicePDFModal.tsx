import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../src/services/api';

interface InvoicePDFModalProps {
  visible: boolean;
  onClose: () => void;
  invoice: any;
}

const InvoicePDFModal: React.FC<InvoicePDFModalProps> = ({
  visible,
  onClose,
  invoice,
}) => {
  // Fetch additional data needed for PDF
  const { data: ticket, isLoading: ticketLoading } = useQuery({
    queryKey: ['tickets', invoice.ticketId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/tickets/${invoice.ticketId}`);
      if (!response.ok) throw new Error('Failed to fetch ticket');
      return response.json();
    },
    enabled: visible && !!invoice.ticketId,
  });

  const { data: workOrders = [], isLoading: workOrdersLoading } = useQuery({
    queryKey: ['work-orders', invoice.ticketId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/tickets/${invoice.ticketId}/work-orders`);
      if (!response.ok) throw new Error('Failed to fetch work orders');
      return response.json();
    },
    enabled: visible && !!invoice.ticketId,
  });

  const { data: organization, isLoading: orgLoading } = useQuery({
    queryKey: ['organizations', invoice.organizationId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/organizations`);
      if (!response.ok) throw new Error('Failed to fetch organizations');
      const orgs = await response.json();
      return orgs.find((org: any) => org.id === invoice.organizationId);
    },
    enabled: visible && !!invoice.organizationId,
  });

  const { data: vendor, isLoading: vendorLoading } = useQuery({
    queryKey: ['maintenance-vendors', invoice.maintenanceVendorId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/maintenance-vendors`);
      if (!response.ok) throw new Error('Failed to fetch vendors');
      const vendors = await response.json();
      return vendors.find((v: any) => v.id === invoice.maintenanceVendorId);
    },
    enabled: visible && !!invoice.maintenanceVendorId,
  });

  const { data: location, isLoading: locationLoading } = useQuery({
    queryKey: ['locations', invoice.locationId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/organizations/${invoice.organizationId}/locations`);
      if (!response.ok) throw new Error('Failed to fetch locations');
      const locations = await response.json();
      return locations.find((loc: any) => loc.id === invoice.locationId);
    },
    enabled: visible && !!invoice.locationId,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: string | number) => {
    return `$${parseFloat(amount.toString()).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#fef3c7'; // yellow
      case 'sent': return '#dbeafe'; // blue
      case 'paid': return '#d1fae5'; // green
      case 'overdue': return '#fee2e2'; // red
      default: return '#f3f4f6'; // gray
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'draft': return '#92400e';
      case 'sent': return '#1e40af';
      case 'paid': return '#065f46';
      case 'overdue': return '#991b1b';
      default: return '#374151';
    }
  };

  const isLoading = ticketLoading || workOrdersLoading || orgLoading || vendorLoading || locationLoading;

  if (isLoading) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading invoice details...</Text>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Invoice {invoice.invoiceNumber}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) }]}>
              <Text style={[styles.statusText, { color: getStatusTextColor(invoice.status) }]}>
                {invoice.status}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.printButton} 
              onPress={() => {
                Alert.alert(
                  'Print/Save PDF',
                  'PDF functionality would normally integrate with your device\'s print/share system here.',
                  [{ text: 'OK' }]
                );
              }}
            >
              <Ionicons name="print" size={16} color="#666" />
              <Text style={styles.printButtonText}>Print</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.pdfContainer}>
            
            {/* Header Section */}
            <View style={styles.invoiceHeader}>
              <Text style={styles.invoiceTitle}>INVOICE</Text>
              <Text style={styles.invoiceSubtitle}>
                Invoice #{invoice.invoiceNumber} | Date: {invoice.createdAt ? formatDate(invoice.createdAt) : 'N/A'}
              </Text>
            </View>

            {/* From/To Section */}
            <View style={styles.fromToSection}>
              <View style={styles.fromSection}>
                <Text style={styles.sectionTitle}>From:</Text>
                <View style={styles.addressBox}>
                  <Text style={styles.companyName}>
                    {vendor?.name || 'Maintenance Vendor'}
                  </Text>
                  <Text style={styles.addressText}>{vendor?.address || 'Vendor Address'}</Text>
                  <Text style={styles.addressText}>{vendor?.email || 'vendor@email.com'}</Text>
                  <Text style={styles.addressText}>{vendor?.phone || 'Phone Number'}</Text>
                </View>
              </View>
              <View style={styles.toSection}>
                <Text style={styles.sectionTitle}>Bill To:</Text>
                <View style={styles.addressBox}>
                  <Text style={styles.companyName}>
                    {organization?.name || 'Organization'}
                  </Text>
                  {location && (
                    <View style={styles.serviceLocationBox}>
                      <Text style={styles.serviceLocationTitle}>
                        Service Location: {location.name}
                      </Text>
                      {location.address && (
                        <Text style={styles.addressText}>{location.address}</Text>
                      )}
                    </View>
                  )}
                  <View style={styles.organizationInfo}>
                    <Text style={styles.addressText}>{organization?.address || 'Organization Address'}</Text>
                    <Text style={styles.addressText}>{organization?.email || 'org@email.com'}</Text>
                    <Text style={styles.addressText}>{organization?.phone || 'Phone Number'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Service Details */}
            {ticket && (
              <View style={styles.serviceDetailsSection}>
                <Text style={styles.sectionTitle}>Service Details</Text>
                <View style={styles.serviceDetailsGrid}>
                  <View style={styles.serviceDetailRow}>
                    <Text style={styles.serviceDetailLabel}>Ticket Number:</Text>
                    <Text style={styles.serviceDetailValue}>{ticket.ticketNumber}</Text>
                  </View>
                  <View style={styles.serviceDetailRow}>
                    <Text style={styles.serviceDetailLabel}>Priority:</Text>
                    <View style={styles.priorityBadge}>
                      <Text style={styles.priorityText}>{ticket.priority}</Text>
                    </View>
                  </View>
                  <View style={styles.serviceDetailRowFull}>
                    <Text style={styles.serviceDetailLabel}>Description:</Text>
                    <Text style={styles.serviceDetailValue}>{ticket.description}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Work Orders Table */}
            <View style={styles.workOrdersSection}>
              <Text style={styles.sectionTitle}>Work Orders Completed</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, styles.workOrderCol]}>Work Order</Text>
                  <Text style={[styles.tableHeaderText, styles.descriptionCol]}>Description</Text>
                  <Text style={[styles.tableHeaderText, styles.laborCol]}>Labor Details</Text>
                  <Text style={[styles.tableHeaderText, styles.partsCol]}>Parts Used</Text>
                  <Text style={[styles.tableHeaderText, styles.totalCol]}>Total</Text>
                </View>
                
                {workOrders.length > 0 ? workOrders.map((workOrder: any) => {
                  const parts = workOrder.parts && Array.isArray(workOrder.parts) ? workOrder.parts : [];
                  const partsCost = parts.reduce((sum: number, part: any) => sum + (part.cost * part.quantity), 0);
                  const laborCost = parseFloat(workOrder.totalCost || "0") - partsCost;
                  const hourlyRate = workOrder.totalHours ? (laborCost / parseFloat(workOrder.totalHours)).toFixed(2) : "0.00";
                  
                  return (
                    <View key={workOrder.id} style={styles.tableRow}>
                      <View style={[styles.tableCell, styles.workOrderCol]}>
                        <Text style={styles.workOrderNumber}>#{workOrder.workOrderNumber}</Text>
                        <Text style={styles.technicianName}>by {workOrder.technicianName}</Text>
                        <Text style={styles.workOrderDate}>
                          {workOrder.dateCompleted ? new Date(workOrder.dateCompleted).toLocaleDateString() : 'In Progress'}
                        </Text>
                      </View>
                      <View style={[styles.tableCell, styles.descriptionCol]}>
                        <Text style={styles.workDescription}>{workOrder.workDescription || 'Work order description'}</Text>
                        {workOrder.notes && (
                          <Text style={styles.workNotes}>Notes: {workOrder.notes}</Text>
                        )}
                      </View>
                      <View style={[styles.tableCell, styles.laborCol]}>
                        <Text style={styles.laborDetail}>{workOrder.totalHours} hours</Text>
                        <Text style={styles.laborDetail}>@ ${hourlyRate}/hr</Text>
                        <Text style={styles.laborTotal}>Labor: ${laborCost.toFixed(2)}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.partsCol]}>
                        {parts.length > 0 ? (
                          <View>
                            {parts.map((part: any, index: number) => (
                              <View key={index} style={styles.partItem}>
                                <Text style={styles.partName}>{part.name}</Text>
                                <Text style={styles.partDetail}>
                                  Qty: {part.quantity} @ ${part.cost.toFixed(2)} = ${(part.quantity * part.cost).toFixed(2)}
                                </Text>
                              </View>
                            ))}
                            <View style={styles.partsTotal}>
                              <Text style={styles.partsTotalText}>
                                Parts Total: ${partsCost.toFixed(2)}
                              </Text>
                            </View>
                          </View>
                        ) : (
                          <Text style={styles.noPartsText}>No parts used</Text>
                        )}
                      </View>
                      <View style={[styles.tableCell, styles.totalCol]}>
                        <Text style={styles.workOrderTotal}>
                          ${parseFloat(workOrder.totalCost || "0").toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  );
                }) : (
                  <View style={styles.noWorkOrdersRow}>
                    <Text style={styles.noWorkOrdersText}>No work orders available.</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Invoice Total */}
            <View style={styles.totalsSection}>
              <View style={styles.totalsContainer}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal:</Text>
                  <Text style={styles.totalValue}>${parseFloat(invoice.subtotal).toFixed(2)}</Text>
                </View>
                {parseFloat(invoice.tax) > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Tax:</Text>
                    <Text style={styles.totalValue}>${parseFloat(invoice.tax).toFixed(2)}</Text>
                  </View>
                )}
                <View style={[styles.totalRow, styles.grandTotalRow]}>
                  <Text style={styles.grandTotalLabel}>TOTAL:</Text>
                  <Text style={styles.grandTotalValue}>${parseFloat(invoice.total).toFixed(2)}</Text>
                </View>
              </View>
            </View>

            {/* Payment Terms & Notes */}
            <View style={styles.paymentSection}>
              <Text style={styles.paymentTerms}>
                <Text style={styles.paymentLabel}>Payment Terms:</Text> Net 30
              </Text>
              {invoice.notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Notes:</Text>
                  <Text style={styles.notesText}>{invoice.notes}</Text>
                </View>
              )}
            </View>

          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 6,
    backgroundColor: 'white',
  },
  printButtonText: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  pdfContainer: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  invoiceHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 24,
    marginBottom: 24,
  },
  invoiceTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 8,
  },
  invoiceSubtitle: {
    fontSize: 18,
    color: 'black',
  },
  fromToSection: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 32,
  },
  fromSection: {
    flex: 1,
  },
  toSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'black',
    marginBottom: 12,
  },
  addressBox: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
  },
  companyName: {
    fontSize: 20,
    fontWeight: '600',
    color: 'black',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 16,
    color: 'black',
    marginBottom: 2,
  },
  serviceLocationBox: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  serviceLocationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
    marginBottom: 2,
  },
  organizationInfo: {
    marginTop: 8,
  },
  serviceDetailsSection: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  serviceDetailsGrid: {},
  serviceDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceDetailRowFull: {
    marginBottom: 8,
  },
  serviceDetailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'black',
    marginRight: 8,
  },
  serviceDetailValue: {
    fontSize: 14,
    color: 'black',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    backgroundColor: 'white',
  },
  priorityText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  workOrdersSection: {
    marginBottom: 24,
  },
  table: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'black',
    textAlign: 'left',
  },
  workOrderCol: { flex: 1.2 },
  descriptionCol: { flex: 1.5 },
  laborCol: { flex: 1.3 },
  partsCol: { flex: 1.8 },
  totalCol: { flex: 0.8, textAlign: 'right' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'flex-start',
  },
  tableCell: {
    paddingRight: 8,
  },
  workOrderNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: 'black',
    marginBottom: 2,
  },
  technicianName: {
    fontSize: 12,
    color: 'black',
    marginBottom: 1,
  },
  workOrderDate: {
    fontSize: 11,
    color: 'black',
  },
  workDescription: {
    fontSize: 12,
    color: 'black',
    marginBottom: 4,
  },
  workNotes: {
    fontSize: 11,
    fontStyle: 'italic',
    color: 'black',
  },
  laborDetail: {
    fontSize: 12,
    color: 'black',
    marginBottom: 2,
  },
  laborTotal: {
    fontSize: 12,
    fontWeight: '500',
    color: 'black',
  },
  partItem: {
    marginBottom: 4,
  },
  partName: {
    fontSize: 12,
    color: 'black',
    marginBottom: 1,
  },
  partDetail: {
    fontSize: 11,
    color: 'black',
  },
  partsTotal: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 4,
    marginTop: 4,
  },
  partsTotalText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'black',
  },
  noPartsText: {
    fontSize: 12,
    color: 'black',
  },
  workOrderTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: 'black',
    textAlign: 'right',
  },
  noWorkOrdersRow: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  noWorkOrdersText: {
    fontSize: 14,
    color: '#6b7280',
  },
  totalsSection: {
    backgroundColor: '#f9fafb',
    padding: 24,
    borderRadius: 8,
    marginBottom: 24,
  },
  totalsContainer: {
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 256,
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 18,
    color: 'black',
  },
  totalValue: {
    fontSize: 18,
    color: 'black',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
  },
  grandTotalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
  },
  paymentSection: {
    fontSize: 14,
  },
  paymentTerms: {
    fontSize: 14,
    color: 'black',
    marginBottom: 8,
  },
  paymentLabel: {
    fontWeight: '500',
  },
  notesContainer: {
    marginTop: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'black',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: 'black',
  },
});

export default InvoicePDFModal;