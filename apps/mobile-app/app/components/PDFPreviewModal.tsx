import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PDFPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  invoiceData: any;
}

const { width, height } = Dimensions.get('window');

const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  visible,
  onClose,
  invoiceData,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  if (!invoiceData) return null;

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
          <Text style={styles.headerTitle}>Invoice Preview</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* PDF Preview Content */}
        <ScrollView style={styles.previewContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.invoiceContent}>
            {/* Invoice Header */}
            <View style={styles.invoiceHeader}>
              <Text style={styles.companyName}>NSR Petro Services</Text>
              <Text style={styles.invoiceTitle}>INVOICE</Text>
              <Text style={styles.invoiceNumber}>#{invoiceData.invoiceNumber || 'INV-001'}</Text>
              <Text style={styles.invoiceDate}>Date: {formatDate(new Date())}</Text>
            </View>

            {/* Bill To Section */}
            <View style={styles.billToSection}>
              <Text style={styles.sectionTitle}>Bill To:</Text>
              <Text style={styles.customerName}>{invoiceData.ticket?.organization?.name || 'Customer Name'}</Text>
              {invoiceData.ticket?.location && (
                <Text style={styles.customerAddress}>
                  {invoiceData.ticket.location.address}
                  {invoiceData.ticket.location.city && `, ${invoiceData.ticket.location.city}`}
                  {invoiceData.ticket.location.state && `, ${invoiceData.ticket.location.state}`}
                  {invoiceData.ticket.location.zipCode && ` ${invoiceData.ticket.location.zipCode}`}
                </Text>
              )}
            </View>

            {/* Work Order Info */}
            <View style={styles.workOrderSection}>
              <Text style={styles.sectionTitle}>Work Order Details:</Text>
              <Text style={styles.ticketNumber}>Ticket: {invoiceData.ticket?.ticketNumber}</Text>
              <Text style={styles.workDescription}>{invoiceData.ticket?.title}</Text>
            </View>

            {/* Line Items */}
            <View style={styles.lineItemsSection}>
              <Text style={styles.sectionTitle}>Line Items:</Text>
              
              {/* Header Row */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.descriptionColumn]}>Description</Text>
                <Text style={[styles.tableHeaderText, styles.qtyColumn]}>Qty</Text>
                <Text style={[styles.tableHeaderText, styles.rateColumn]}>Rate</Text>
                <Text style={[styles.tableHeaderText, styles.totalColumn]}>Total</Text>
              </View>

              {/* Work Order Items */}
              {invoiceData.workOrders?.map((workOrder: any, woIndex: number) => (
                <View key={woIndex}>
                  {/* Labor Line */}
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.descriptionColumn]}>Labor</Text>
                    <Text style={[styles.tableCell, styles.qtyColumn]}>
                      {workOrder.billableLaborHours?.toFixed(1) || '0.0'} hrs
                    </Text>
                    <Text style={[styles.tableCell, styles.rateColumn]}>
                      {formatCurrency(workOrder.billableLaborRate || 0)}/hr
                    </Text>
                    <Text style={[styles.tableCell, styles.totalColumn]}>
                      {formatCurrency((workOrder.billableLaborHours || 0) * (workOrder.billableLaborRate || 0))}
                    </Text>
                  </View>

                  {/* Parts Lines */}
                  {workOrder.parts?.map((part: any, partIndex: number) => (
                    <View key={partIndex} style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.descriptionColumn]}>{part.name}</Text>
                      <Text style={[styles.tableCell, styles.qtyColumn]}>{part.billableQuantity || part.quantity}</Text>
                      <Text style={[styles.tableCell, styles.rateColumn]}>
                        {formatCurrency(part.billableCost || part.cost)}
                      </Text>
                      <Text style={[styles.tableCell, styles.totalColumn]}>
                        {formatCurrency((part.billableQuantity || part.quantity) * (part.billableCost || part.cost))}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}

              {/* Additional Items */}
              {invoiceData.additionalItems?.map((item: any, index: number) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.descriptionColumn]}>{item.description}</Text>
                  <Text style={[styles.tableCell, styles.qtyColumn]}>{item.quantity}</Text>
                  <Text style={[styles.tableCell, styles.rateColumn]}>
                    {formatCurrency(item.rate)}
                  </Text>
                  <Text style={[styles.tableCell, styles.totalColumn]}>
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Totals Section */}
            <View style={styles.totalsSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
                <Text style={styles.totalValue}>{formatCurrency(invoiceData.subtotal || 0)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Tax ({invoiceData.taxPercentage || 0}%):
                </Text>
                <Text style={styles.totalValue}>{formatCurrency(invoiceData.taxAmount || 0)}</Text>
              </View>
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Total:</Text>
                <Text style={styles.grandTotalValue}>{formatCurrency(invoiceData.total || 0)}</Text>
              </View>
            </View>

            {/* Notes */}
            {invoiceData.notes && (
              <View style={styles.notesSection}>
                <Text style={styles.sectionTitle}>Notes:</Text>
                <Text style={styles.notesText}>{invoiceData.notes}</Text>
              </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Thank you for your business!</Text>
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
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
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
  previewContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  invoiceContent: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  invoiceHeader: {
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 8,
  },
  invoiceNumber: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  invoiceDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  billToSection: {
    marginBottom: 20,
  },
  workOrderSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  customerAddress: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  ticketNumber: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  workDescription: {
    fontSize: 14,
    color: '#374151',
  },
  lineItemsSection: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableCell: {
    fontSize: 14,
    color: '#1f2937',
  },
  descriptionColumn: {
    flex: 2,
  },
  qtyColumn: {
    flex: 1,
    textAlign: 'center',
  },
  rateColumn: {
    flex: 1,
    textAlign: 'right',
  },
  totalColumn: {
    flex: 1,
    textAlign: 'right',
    fontWeight: '500',
  },
  totalsSection: {
    alignSelf: 'flex-end',
    minWidth: 200,
    marginTop: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  grandTotalRow: {
    borderTopWidth: 2,
    borderTopColor: '#d1d5db',
    paddingTop: 12,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  notesSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});

export default PDFPreviewModal;