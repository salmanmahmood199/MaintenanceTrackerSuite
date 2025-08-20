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

interface EditableWorkOrder {
  id: number;
  description: string;
  originalCost: number;
  adjustedCost: number;
  editable: boolean;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  visible,
  onClose,
  ticket,
  workOrders,
  user
}) => {
  const [additionalItems, setAdditionalItems] = useState<InvoiceItem[]>([]);
  const [editableWorkOrders, setEditableWorkOrders] = useState<EditableWorkOrder[]>([]);
  const [taxPercentage, setTaxPercentage] = useState('0');
  const [taxAmount, setTaxAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<'create' | 'preview'>('create');
  const queryClient = useQueryClient();

  // Initialize editable work orders
  useEffect(() => {
    if (workOrders.length > 0 && editableWorkOrders.length === 0) {
      const initWorkOrders = workOrders.map(wo => ({
        id: wo.id,
        description: wo.workDescription || `Work Order #${wo.workOrderNumber || wo.id}`,
        originalCost: parseFloat(wo.totalCost || 0),
        adjustedCost: parseFloat(wo.totalCost || 0),
        editable: true
      }));
      setEditableWorkOrders(initWorkOrders);
    }
  }, [workOrders]);

  // Calculate totals from work orders and additional items
  useEffect(() => {
    const workOrderTotal = editableWorkOrders.reduce((sum, wo) => sum + wo.adjustedCost, 0);
    const additionalTotal = additionalItems.reduce((sum, item) => sum + item.amount, 0);
    const calculatedSubtotal = workOrderTotal + additionalTotal;
    const taxPercent = parseFloat(taxPercentage) || 0;
    const calculatedTaxAmount = (calculatedSubtotal * taxPercent) / 100;
    
    setSubtotal(calculatedSubtotal);
    setTaxAmount(calculatedTaxAmount);
    setTotal(calculatedSubtotal + calculatedTaxAmount);
  }, [editableWorkOrders, additionalItems, taxPercentage]);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setAdditionalItems([]);
      setEditableWorkOrders([]);
      setTaxPercentage('0');
      setTaxAmount(0);
      setNotes('');
      setActiveTab('create');
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
      workOrderIds: editableWorkOrders.map(wo => wo.id),
      subtotal: subtotal.toFixed(2),
      tax: taxAmount.toFixed(2),
      taxPercentage: taxPercentage,
      total: total.toFixed(2),
      additionalItems: JSON.stringify(additionalItems),
      notes: notes.trim() || null,
      adjustedWorkOrderCosts: editableWorkOrders.reduce((acc, wo) => {
        acc[wo.id] = wo.adjustedCost;
        return acc;
      }, {} as Record<number, number>)
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

  const updateWorkOrderCost = (id: number, newCost: number) => {
    setEditableWorkOrders(prev => prev.map(wo => 
      wo.id === id ? { ...wo, adjustedCost: newCost } : wo
    ));
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
            <Text style={styles.sectionTitle}>Work Orders ({editableWorkOrders.length})</Text>
            {editableWorkOrders.map((workOrder) => (
              <View key={workOrder.id} style={styles.workOrderItem}>
                <View style={styles.workOrderHeader}>
                  <View style={styles.workOrderInfo}>
                    <Text style={styles.workOrderTitle}>Work Order #{workOrder.id}</Text>
                    <Text style={styles.workOrderDescription}>{workOrder.description}</Text>
                    <Text style={styles.originalCostText}>
                      Original: {formatCurrency(workOrder.originalCost)}
                    </Text>
                  </View>
                </View>
                <View style={styles.workOrderCostRow}>
                  <Text style={styles.costLabel}>Billable Amount:</Text>
                  <TextInput
                    style={styles.costInput}
                    value={workOrder.adjustedCost.toString()}
                    onChangeText={(text) => {
                      const newCost = parseFloat(text) || 0;
                      updateWorkOrderCost(workOrder.id, newCost);
                    }}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#6b7280"
                  />
                </View>
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

          {/* Tax */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tax Information</Text>
            <View style={styles.taxRow}>
              <Text style={styles.label}>Tax Percentage:</Text>
              <View style={styles.taxInputContainer}>
                <TextInput
                  style={styles.taxInput}
                  placeholder="0"
                  placeholderTextColor="#6b7280"
                  value={taxPercentage}
                  keyboardType="decimal-pad"
                  onChangeText={setTaxPercentage}
                />
                <Text style={styles.percentSymbol}>%</Text>
              </View>
            </View>
            <View style={styles.taxRow}>
              <Text style={styles.label}>Tax Amount:</Text>
              <Text style={styles.taxAmountText}>{formatCurrency(taxAmount)}</Text>
            </View>
          </View>

          {/* Invoice Totals */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Invoice Summary</Text>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({taxPercentage}%):</Text>
              <Text style={styles.totalValue}>{formatCurrency(taxAmount)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
            </View>
          </View>

          {/* Notes */}
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
  // Enhanced work order styles
  workOrderHeader: {
    marginBottom: 8,
  },
  workOrderInfo: {
    flex: 1,
  },
  workOrderCostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#4b5563',
  },
  costLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  costInput: {
    backgroundColor: '#4b5563',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#6b7280',
    minWidth: 100,
    textAlign: 'right',
  },
  originalCostText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  // Tax styles
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taxInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4b5563',
    borderRadius: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#6b7280',
  },
  taxInput: {
    fontSize: 14,
    color: '#f3f4f6',
    paddingVertical: 8,
    minWidth: 60,
    textAlign: 'right',
  },
  percentSymbol: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 4,
  },
  taxAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
});

export default InvoiceModal;