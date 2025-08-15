import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';
import PaymentModal from '../components/PaymentModal';
import InvoicePDFModal from '../components/InvoicePDFModal';

interface Invoice {
  id: number;
  invoiceNumber: string;
  ticketId: number;
  ticketNumber?: string;
  organizationId: number;
  organizationName?: string;
  subtotal: string;
  tax: string;
  total: string;
  status: 'draft' | 'sent' | 'paid';
  createdAt: string;
  sentAt?: string;
  paidAt?: string;
  notes?: string;
}

const InvoicesScreen = () => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoiceForPDF, setSelectedInvoiceForPDF] = useState<Invoice | null>(null);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [organizationFilter, setOrganizationFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const queryClient = useQueryClient();

  // Fetch invoices
  const { data: invoices = [], isLoading, error, refetch } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      console.log('Fetching invoices...');
      const response = await apiRequest('GET', '/api/invoices');
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }
      const data = await response.json();
      console.log('Invoices fetched:', data);
      return data;
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Send invoice mutation
  const sendInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      const response = await apiRequest('POST', `/api/invoices/${invoiceId}/send`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Failed to send invoice');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      Alert.alert('Success', 'Invoice sent successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to send invoice');
    },
  });

  const handleSendInvoice = (invoice: Invoice) => {
    Alert.alert(
      'Send Invoice',
      `Send invoice ${invoice.invoiceNumber} to the customer?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send', 
          onPress: () => sendInvoiceMutation.mutate(invoice.id)
        }
      ]
    );
  };

  const handlePayInvoice = (invoice: Invoice) => {
    setSelectedInvoiceForPayment(invoice);
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedInvoiceForPayment(null);
  };

  const handleViewPDF = (invoice: Invoice) => {
    setSelectedInvoiceForPDF(invoice);
    setShowPDFModal(true);
  };

  const closePDFModal = () => {
    setShowPDFModal(false);
    setSelectedInvoiceForPDF(null);
  };

  // Filter and sort invoices
  const filterAndSortInvoices = (invoices: Invoice[]) => {
    let filteredInvoices = [...invoices];

    // Apply search filter
    if (searchTerm.trim()) {
      filteredInvoices = filteredInvoices.filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.ticketNumber && invoice.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (invoice.organizationName && invoice.organizationName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply organization filter
    if (organizationFilter !== "all") {
      filteredInvoices = filteredInvoices.filter(invoice => 
        invoice.organizationId.toString() === organizationFilter
      );
    }

    // Apply date sorting
    filteredInvoices.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return filteredInvoices;
  };

  // Get unique organizations from invoices
  const getUniqueOrganizations = () => {
    const uniqueOrgIds = Array.from(new Set(invoices.map(inv => inv.organizationId)));
    return uniqueOrgIds.map(id => ({
      id: id.toString(),
      name: invoices.find(inv => inv.organizationId === id)?.organizationName || `Organization ${id}`
    }));
  };

  const filteredInvoices = filterAndSortInvoices(invoices);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#6b7280';
      case 'sent': return '#f59e0b';
      case 'paid': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return 'document-outline';
      case 'sent': return 'send';
      case 'paid': return 'checkmark-circle';
      default: return 'document-outline';
    }
  };

  const formatCurrency = (amount: string) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderInvoiceItem = ({ item: invoice }: { item: Invoice }) => (
    <View style={styles.invoiceCard}>
      <View style={styles.invoiceHeader}>
        <View style={styles.invoiceInfo}>
          <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          <Text style={styles.ticketNumber}>Ticket: {invoice.ticketNumber || `#${invoice.ticketId}`}</Text>
          {invoice.organizationName && (
            <Text style={styles.organizationName}>{invoice.organizationName}</Text>
          )}
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) }]}>
            <Ionicons 
              name={getStatusIcon(invoice.status) as any} 
              size={14} 
              color="white" 
            />
            <Text style={styles.statusText}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.invoiceDetails}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Subtotal:</Text>
          <Text style={styles.amountValue}>{formatCurrency(invoice.subtotal)}</Text>
        </View>
        
        {parseFloat(invoice.tax) > 0 && (
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Tax:</Text>
            <Text style={styles.amountValue}>{formatCurrency(invoice.tax)}</Text>
          </View>
        )}
        
        <View style={[styles.amountRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>{formatCurrency(invoice.total)}</Text>
        </View>
      </View>

      <View style={styles.invoiceFooter}>
        <Text style={styles.dateText}>
          Created: {formatDate(invoice.createdAt)}
        </Text>
        
        <View style={styles.actionButtonsContainer}>
          {invoice.status === 'draft' && user?.role === 'maintenance_admin' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSendInvoice(invoice)}
              disabled={sendInvoiceMutation.isPending}
            >
              <Ionicons name="send" size={16} color="#3b82f6" />
              <Text style={styles.actionButtonText}>Send</Text>
            </TouchableOpacity>
          )}
          
          {invoice.status === 'sent' && ['org_admin', 'org_subadmin'].includes(user?.role || '') && (
            <TouchableOpacity
              style={[styles.actionButton, styles.payButton]}
              onPress={() => handlePayInvoice(invoice)}
            >
              <Ionicons name="card" size={16} color="#059669" />
              <Text style={[styles.actionButtonText, styles.payButtonText]}>Pay</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, styles.pdfButton]}
            onPress={() => handleViewPDF(invoice)}
          >
            <Ionicons name="document-text" size={16} color="#7c3aed" />
            <Text style={[styles.actionButtonText, styles.pdfButtonText]}>View PDF</Text>
          </TouchableOpacity>
          )}
        </View>
        
        {invoice.sentAt && (
          <Text style={styles.dateText}>
            Sent: {formatDate(invoice.sentAt)}
          </Text>
        )}
        
        {invoice.paidAt && (
          <Text style={styles.dateText}>
            Paid: {formatDate(invoice.paidAt)}
          </Text>
        )}
      </View>

      {invoice.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText}>{invoice.notes}</Text>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading invoices...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning-outline" size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Failed to Load Invoices</Text>
        <Text style={styles.errorText}>
          Please check your connection and try again.
        </Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Invoices</Text>
            <Text style={styles.subtitle}>
              {filteredInvoices.length} of {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="filter" size={20} color="#f3f4f6" />
          </TouchableOpacity>
        </View>

        {/* Filters Section */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={16} color="#9ca3af" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search invoices..."
                placeholderTextColor="#6b7280"
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
              {searchTerm.length > 0 && (
                <TouchableOpacity onPress={() => setSearchTerm('')}>
                  <Ionicons name="close-circle" size={16} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>

            {/* Organization Filter */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Organization:</Text>
              <TouchableOpacity 
                style={styles.filterDropdown}
                onPress={() => {
                  // Simple cycle through options for now
                  const orgs = ['all', ...getUniqueOrganizations().map(o => o.id)];
                  const currentIndex = orgs.indexOf(organizationFilter);
                  const nextIndex = (currentIndex + 1) % orgs.length;
                  setOrganizationFilter(orgs[nextIndex]);
                }}
              >
                <Text style={styles.filterDropdownText}>
                  {organizationFilter === 'all' ? 'All Organizations' : 
                   getUniqueOrganizations().find(o => o.id === organizationFilter)?.name || 'Unknown'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Sort Order */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Sort:</Text>
              <TouchableOpacity 
                style={styles.filterDropdown}
                onPress={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
              >
                <Text style={styles.filterDropdownText}>
                  {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
                </Text>
                <Ionicons name="swap-vertical" size={16} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {filteredInvoices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#9ca3af" />
          <Text style={styles.emptyTitle}>
            {invoices.length === 0 ? 'No Invoices' : 'No Matching Invoices'}
          </Text>
          <Text style={styles.emptyText}>
            {invoices.length === 0 
              ? 'Invoices will appear here once work orders are completed and ready for billing.'
              : 'Try adjusting your filters to see more invoices.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredInvoices}
          renderItem={renderInvoiceItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {/* Payment Modal */}
      {selectedInvoiceForPayment && (
        <PaymentModal
          visible={showPaymentModal}
          onClose={closePaymentModal}
          invoice={selectedInvoiceForPayment}
        />
      )}
      
      {/* PDF Modal */}
      {selectedInvoiceForPDF && (
        <InvoicePDFModal
          visible={showPDFModal}
          onClose={closePDFModal}
          invoice={selectedInvoiceForPDF}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingTop: 60,
    backgroundColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  filtersContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#374151',
    borderRadius: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#f3f4f6',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
    width: 80,
  },
  filterDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1f2937',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    marginLeft: 12,
  },
  filterDropdownText: {
    fontSize: 14,
    color: '#f3f4f6',
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f3f4f6',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9ca3af',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#111827',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#9ca3af',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  listContainer: {
    padding: 16,
  },
  invoiceCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f3f4f6',
    marginBottom: 4,
  },
  ticketNumber: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 2,
  },
  organizationName: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  invoiceDetails: {
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 12,
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  amountLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  amountValue: {
    fontSize: 14,
    color: '#f3f4f6',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f3f4f6',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  invoiceFooter: {
    flexDirection: 'column',
    gap: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: '#3b82f6',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  payButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10b981',
  },
  payButtonText: {
    color: '#10b981',
  },
  pdfButton: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderColor: '#7c3aed',
  },
  pdfButtonText: {
    color: '#7c3aed',
  },
  notesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#374151',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#f3f4f6',
    lineHeight: 20,
  },
});

export default InvoicesScreen;