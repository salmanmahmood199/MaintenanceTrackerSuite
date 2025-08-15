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

  const { data: workOrders, isLoading: workOrdersLoading } = useQuery({
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
      const response = await apiRequest('GET', `/api/organizations/${invoice.organizationId}`);
      if (!response.ok) throw new Error('Failed to fetch organization');
      return response.json();
    },
    enabled: visible && !!invoice.organizationId,
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

  const isLoading = ticketLoading || workOrdersLoading || orgLoading;

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
          <Text style={styles.headerTitle}>Invoice PDF</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.pdfContainer}>
            {/* Header Section */}
            <View style={styles.invoiceHeader}>
              <Text style={styles.invoiceTitle}>INVOICE</Text>
              <Text style={styles.invoiceSubtitle}>
                Invoice #{invoice.invoiceNumber} | Date: {formatDate(invoice.createdAt)}
              </Text>
            </View>

            {/* From/To Section */}
            <View style={styles.fromToSection}>
              <View style={styles.fromSection}>
                <Text style={styles.sectionTitle}>From:</Text>
                <View style={styles.addressBox}>
                  <Text style={styles.companyName}>TaskScout Maintenance</Text>
                  <Text style={styles.addressText}>123 Service Street</Text>
                  <Text style={styles.addressText}>City, State 12345</Text>
                  <Text style={styles.addressText}>service@taskscout.com</Text>
                  <Text style={styles.addressText}>(555) 123-4567</Text>
                </View>
              </View>
              <View style={styles.toSection}>
                <Text style={styles.sectionTitle}>Bill To:</Text>
                <View style={styles.addressBox}>
                  <Text style={styles.companyName}>
                    {organization?.name || invoice.organizationName || 'Organization'}
                  </Text>
                  {/* Service Location if available */}
                  {ticket?.locationId && (
                    <View style={styles.serviceLocationBox}>
                      <Text style={styles.serviceLocationTitle}>
                        Service Location: {ticket.location?.name || 'Service Location'}
                      </Text>
                      {ticket.location?.address && (
                        <Text style={styles.addressText}>{ticket.location.address}</Text>
                      )}
                    </View>
                  )}
                  <Text style={styles.addressText}>
                    {organization?.address || 'Organization Address'}
                  </Text>
                  <Text style={styles.addressText}>
                    {organization?.email || 'org@email.com'}
                  </Text>
                  <Text style={styles.addressText}>
                    {organization?.phone || 'Phone Number'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Service Details - Enhanced */}
            {ticket && (
              <View style={styles.ticketSection}>
                <Text style={styles.sectionTitle}>Service Details</Text>
                <View style={styles.ticketBox}>
                  <View style={styles.ticketRow}>
                    <Text style={styles.ticketLabel}>Ticket Number:</Text>
                    <Text style={styles.ticketValue}>{ticket.ticketNumber || invoice.ticketId}</Text>
                  </View>
                  <View style={styles.ticketRow}>
                    <Text style={styles.ticketLabel}>Priority:</Text>
                    <View style={styles.priorityBadge}>
                      <Text style={styles.priorityText}>{ticket.priority || 'Normal'}</Text>
                    </View>
                  </View>
                  <View style={styles.ticketRowFull}>
                    <Text style={styles.ticketLabel}>Description:</Text>
                    <Text style={styles.ticketDescription}>{ticket.description || ticket.title}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Work Orders Completed - Enhanced */}
            {workOrders && workOrders.length > 0 && (
              <View style={styles.workOrdersSection}>
                <Text style={styles.sectionTitle}>Work Orders Completed</Text>
                
                {/* Work Orders Table */}
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Work Order</Text>
                    <Text style={[styles.tableHeaderText, { flex: 2 }]}>Description</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Labor Details</Text>
                    <Text style={[styles.tableHeaderText, { flex: 2 }]}>Parts Used</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Total</Text>
                  </View>
                  
                  {workOrders.map((workOrder: any, index: number) => {
                    // Parse parts data
                    let parts = [];
                    try {
                      if (typeof workOrder.parts === 'string') {
                        parts = JSON.parse(workOrder.parts);
                      } else if (Array.isArray(workOrder.parts)) {
                        parts = workOrder.parts;
                      }
                    } catch (e) {
                      parts = [];
                    }
                    
                    const partsCost = parts.reduce((sum: number, part: any) => 
                      sum + (parseFloat(part.cost || 0) * parseInt(part.quantity || 0)), 0);
                    
                    const laborHours = parseFloat(workOrder.totalHours || workOrder.hours || 0);
                    const hourlyRate = 75; // Default rate
                    const laborCost = laborHours * hourlyRate;
                    const totalCost = laborCost + partsCost;
                    
                    return (
                      <View key={workOrder.id || index} style={styles.tableRow}>
                        {/* Work Order Column */}
                        <View style={[styles.tableCell, { flex: 1.5 }]}>
                          <Text style={[styles.tableCellText, { fontWeight: '600' }]}>
                            #{workOrder.workOrderNumber || `WO-${index + 1}`}
                          </Text>
                          <Text style={[styles.tableCellText, { fontSize: 12, color: '#666' }]}>
                            by {workOrder.technicianName || 'Technician'}
                          </Text>
                          <Text style={[styles.tableCellText, { fontSize: 10, color: '#999' }]}>
                            {workOrder.dateCompleted ? 
                              new Date(workOrder.dateCompleted).toLocaleDateString() : 
                              'In Progress'
                            }
                          </Text>
                        </View>
                        
                        {/* Description Column */}
                        <View style={[styles.tableCell, { flex: 2 }]}>
                          <Text style={[styles.tableCellText, { fontSize: 12 }]}>
                            {workOrder.description || 'Work order description'}
                          </Text>
                          {workOrder.notes && (
                            <Text style={[styles.tableCellText, { fontSize: 10, fontStyle: 'italic', color: '#666', marginTop: 2 }]}>
                              Notes: {workOrder.notes}
                            </Text>
                          )}
                        </View>
                        
                        {/* Labor Details Column */}
                        <View style={[styles.tableCell, { flex: 1.5 }]}>
                          <Text style={[styles.tableCellText, { fontSize: 12 }]}>
                            {laborHours.toFixed(2)} hours
                          </Text>
                          <Text style={[styles.tableCellText, { fontSize: 11, color: '#666' }]}>
                            @ {formatCurrency(hourlyRate)}/hr
                          </Text>
                          <Text style={[styles.tableCellText, { fontSize: 12, fontWeight: '600' }]}>
                            Labor: {formatCurrency(laborCost)}
                          </Text>
                        </View>
                        
                        {/* Parts Used Column */}
                        <View style={[styles.tableCell, { flex: 2 }]}>
                          {parts && parts.length > 0 ? (
                            <View>
                              {parts.map((part: any, partIndex: number) => (
                                <View key={partIndex} style={{ marginBottom: 4 }}>
                                  <Text style={[styles.tableCellText, { fontSize: 11, fontWeight: '500' }]}>
                                    {part.name}
                                  </Text>
                                  <Text style={[styles.tableCellText, { fontSize: 10, color: '#666' }]}>
                                    Qty: {part.quantity} @ {formatCurrency(part.cost)} = {formatCurrency(part.quantity * part.cost)}
                                  </Text>
                                </View>
                              ))}
                              <View style={{ borderTopWidth: 1, borderTopColor: '#e0e0e0', paddingTop: 4, marginTop: 4 }}>
                                <Text style={[styles.tableCellText, { fontSize: 12, fontWeight: '600' }]}>
                                  Parts Total: {formatCurrency(partsCost)}
                                </Text>
                              </View>
                            </View>
                          ) : (
                            <Text style={[styles.tableCellText, { fontSize: 12, color: '#666' }]}>
                              No parts used
                            </Text>
                          )}
                        </View>
                        
                        {/* Total Column */}
                        <View style={[styles.tableCell, { flex: 1, alignItems: 'flex-end' }]}>
                          <Text style={[styles.tableCellText, { fontSize: 14, fontWeight: '700', color: '#059669', textAlign: 'right' }]}>
                            {formatCurrency(totalCost)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Invoice Totals */}
            <View style={styles.totalsSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
                <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
              </View>
              {parseFloat(invoice.tax) > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tax:</Text>
                  <Text style={styles.totalValue}>{formatCurrency(invoice.tax)}</Text>
                </View>
              )}
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Total:</Text>
                <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total)}</Text>
              </View>
            </View>

            {/* Notes */}
            {invoice.notes && (
              <View style={styles.notesSection}>
                <Text style={styles.sectionTitle}>Notes:</Text>
                <Text style={styles.notesText}>{invoice.notes}</Text>
              </View>
            )}

            {/* Payment Information */}
            <View style={styles.paymentSection}>
              <Text style={styles.sectionTitle}>Payment Information:</Text>
              <Text style={styles.paymentText}>
                Status: {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </Text>
              {invoice.paidAt && (
                <Text style={styles.paymentText}>
                  Paid on: {formatDate(invoice.paidAt)}
                </Text>
              )}
              {!invoice.paidAt && (
                <Text style={styles.paymentText}>
                  Payment due upon receipt
                </Text>
              )}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.printButton} onPress={() => {
            Alert.alert(
              'Print/Save PDF',
              'PDF functionality would normally integrate with your device\'s print/share system here.',
              [{ text: 'OK' }]
            );
          }}>
            <Ionicons name="print" size={16} color="white" />
            <Text style={styles.printButtonText}>Print/Save PDF</Text>
          </TouchableOpacity>
        </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
    padding: 24,
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
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 20,
    marginBottom: 24,
  },
  invoiceTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  invoiceSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  fromToSection: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 20,
  },
  fromSection: {
    flex: 1,
  },
  toSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  addressBox: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 6,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  ticketSection: {
    marginBottom: 24,
  },
  ticketBox: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  ticketDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  ticketDate: {
    fontSize: 12,
    color: '#999',
  },
  workOrdersSection: {
    marginBottom: 24,
  },
  table: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    minHeight: 60,
  },
  tableCell: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    justifyContent: 'flex-start',
  },
  tableCellText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'left',
    lineHeight: 16,
  },
  serviceLocationBox: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#e6f3ff',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  serviceLocationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketRowFull: {
    marginBottom: 8,
  },
  ticketLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  ticketValue: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d0d0d0',
  },
  priorityText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  totalsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  notesSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  paymentSection: {
    marginTop: 24,
  },
  paymentText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  printButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InvoicePDFModal;