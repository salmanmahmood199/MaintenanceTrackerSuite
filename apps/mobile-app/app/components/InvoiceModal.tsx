import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../src/services/api';

interface InvoiceModalProps {
  visible: boolean;
  onClose: () => void;
  ticket: any;
  workOrders: any[];
  user: any;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  visible,
  onClose,
  ticket,
  workOrders,
  user
}) => {
  const [additionalItems, setAdditionalItems] = useState<InvoiceItem[]>([]);
  const [tax, setTax] = useState('0');
  const [notes, setNotes] = useState('');
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const queryClient = useQueryClient();

  // Calculate totals from work orders and additional items
  useEffect(() => {
    const workOrderTotal = workOrders.reduce((sum, wo) => sum + parseFloat(wo.totalCost || 0), 0);
    const additionalTotal = additionalItems.reduce((sum, item) => sum + item.amount, 0);
    const calculatedSubtotal = workOrderTotal + additionalTotal;
    const taxAmount = parseFloat(tax) || 0;
    
    setSubtotal(calculatedSubtotal);
    setTotal(calculatedSubtotal + taxAmount);
  }, [workOrders, additionalItems, tax]);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setAdditionalItems([]);
      setTax('0');
      setNotes('');
    }
  }, [visible]);

  const createInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: any) => {
      console.log('Creating invoice with data:', invoiceData);
      
      if (workOrders.length === 0) {
        throw new Error('No work orders available for billing');
      }

      const response = await apiRequest('POST', '/api/invoices', invoiceData);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Invoice creation error:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || 'Unknown error' };
        }
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticket.id.toString()] });
      Alert.alert('Success', 'Invoice created successfully');
      onClose();
    },
    onError: (error: any) => {
      console.error('Invoice creation error:', error);
      Alert.alert('Error', error.message || 'Failed to create invoice');
    },
  });

  const handleSubmit = () => {
    if (workOrders.length === 0) {
      Alert.alert('Error', 'No work orders available for billing');
      return;
    }

    const invoiceData = {
      ticketId: ticket.id,
      workOrderIds: workOrders.map(wo => wo.id),
      subtotal: subtotal.toFixed(2),
      tax: tax || '0',
      total: total.toFixed(2),
      additionalItems: JSON.stringify(additionalItems),
      notes: notes.trim() || null
    };

    createInvoiceMutation.mutate(invoiceData);
  };

  const addInvoiceItem = () => {
    setAdditionalItems(prev => [...prev, { description: '', quantity: 1, rate: 0, amount: 0 }]);
  };

  const removeInvoiceItem = (index: number) => {
    setAdditionalItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: any) => {
    setAdditionalItems(prev => prev.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };
        // Auto-calculate amount when quantity or rate changes
        if (field === 'quantity' || field === 'rate') {
          updatedItem.amount = updatedItem.quantity * updatedItem.rate;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
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
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Invoice</Text>
          <TouchableOpacity 
            onPress={handleSubmit}
            style={[styles.submitButton, createInvoiceMutation.isPending && styles.submitButtonDisabled]}
            disabled={createInvoiceMutation.isPending}
          >
            {createInvoiceMutation.isPending ? (
              <Text style={styles.submitButtonText}>Creating...</Text>
            ) : (
              <Text style={styles.submitButtonText}>Create Invoice</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Ticket Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ticket Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Ticket:</Text>
              <Text style={styles.value}>{ticket.ticketNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Title:</Text>
              <Text style={styles.value}>{ticket.title}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Organization:</Text>
              <Text style={styles.value}>{ticket.organizationName}</Text>
            </View>
          </View>

          {/* Work Orders */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Orders ({workOrders.length})</Text>
            {workOrders.map((workOrder, index) => (
              <View key={workOrder.id} style={styles.workOrderItem}>
                <Text style={styles.workOrderTitle}>Work Order #{workOrder.workOrderNumber}</Text>
                <Text style={styles.workOrderDescription}>{workOrder.workDescription}</Text>
                <Text style={styles.workOrderCost}>{formatCurrency(parseFloat(workOrder.totalCost || 0))}</Text>
              </View>
            ))}
          </View>

          {/* Additional Items */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Additional Items</Text>
              <TouchableOpacity onPress={addInvoiceItem} style={styles.addButton}>
                <Ionicons name="add" size={20} color="#3b82f6" />
                <Text style={styles.addButtonText}>Add Item</Text>
              </TouchableOpacity>
            </View>
            
            {additionalItems.map((item, index) => (
              <View key={index} style={styles.additionalItem}>
                <View style={styles.itemRow}>
                  <TextInput
                    style={[styles.input, styles.descriptionInput]}
                    placeholder="Description"
                    placeholderTextColor="#6b7280"
                    value={item.description}
                    onChangeText={(text) => updateInvoiceItem(index, 'description', text)}
                  />
                  <TouchableOpacity
                    onPress={() => removeInvoiceItem(index)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="trash" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                <View style={styles.itemRow}>
                  <TextInput
                    style={[styles.input, styles.quantityInput]}
                    placeholder="Qty"
                    placeholderTextColor="#6b7280"
                    value={item.quantity.toString()}
                    keyboardType="numeric"
                    onChangeText={(text) => updateInvoiceItem(index, 'quantity', parseFloat(text) || 0)}
                  />
                  <TextInput
                    style={[styles.input, styles.rateInput]}
                    placeholder="Rate"
                    placeholderTextColor="#6b7280"
                    value={item.rate.toString()}
                    keyboardType="numeric"
                    onChangeText={(text) => updateInvoiceItem(index, 'rate', parseFloat(text) || 0)}
                  />
                  <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Tax and Notes */}
          <View style={styles.section}>
            <Text style={styles.label}>Tax Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#6b7280"
              value={tax}
              keyboardType="numeric"
              onChangeText={setTax}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add any additional notes..."
              placeholderTextColor="#6b7280"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Totals */}
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax:</Text>
              <Text style={styles.totalValue}>{formatCurrency(parseFloat(tax) || 0)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
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
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f3f4f6',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginVertical: 16,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f3f4f6',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
  },
  value: {
    fontSize: 14,
    color: '#f3f4f6',
  },
  workOrderItem: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  workOrderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f3f4f6',
    marginBottom: 4,
  },
  workOrderDescription: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  workOrderCost: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
    textAlign: 'right',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  additionalItem: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#4b5563',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#6b7280',
  },
  descriptionInput: {
    flex: 1,
  },
  quantityInput: {
    width: 60,
  },
  rateInput: {
    width: 80,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    minWidth: 70,
    textAlign: 'right',
  },
  removeButton: {
    padding: 4,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  totalSection: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    marginBottom: 32,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  totalValue: {
    fontSize: 14,
    color: '#f3f4f6',
    fontWeight: '600',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 8,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f3f4f6',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
});

export default InvoiceModal;