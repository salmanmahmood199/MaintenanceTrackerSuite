import React, { useState } from 'react';
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

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  invoice: any;
}

type PaymentMethod = 'credit_card' | 'ach' | 'external';

const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  onClose,
  invoice,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('external');
  const [paymentType, setPaymentType] = useState('check');
  const [checkNumber, setCheckNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [processing, setProcessing] = useState(false);
  
  const queryClient = useQueryClient();

  const processPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await apiRequest('POST', `/api/invoices/${invoice.id}/pay`, paymentData);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Payment failed' }));
        throw new Error(errorData.message || 'Failed to process payment');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      Alert.alert('Success', 'Payment processed successfully!');
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      Alert.alert('Payment Error', error.message || 'Failed to process payment');
    },
  });

  const resetForm = () => {
    setPaymentMethod('external');
    setPaymentType('check');
    setCheckNumber('');
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
    setCardholderName('');
    setRoutingNumber('');
    setAccountNumber('');
    setAccountHolderName('');
    setProcessing(false);
  };

  const validateCreditCard = () => {
    if (!cardNumber || cardNumber.length < 13) {
      Alert.alert('Validation Error', 'Please enter a valid card number');
      return false;
    }
    if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
      Alert.alert('Validation Error', 'Please enter expiry date in MM/YY format');
      return false;
    }
    if (!cvv || cvv.length < 3) {
      Alert.alert('Validation Error', 'Please enter a valid CVV');
      return false;
    }
    if (!cardholderName.trim()) {
      Alert.alert('Validation Error', 'Please enter cardholder name');
      return false;
    }
    return true;
  };

  const validateACH = () => {
    if (!routingNumber || routingNumber.length !== 9) {
      Alert.alert('Validation Error', 'Please enter a valid 9-digit routing number');
      return false;
    }
    if (!accountNumber || accountNumber.length < 4) {
      Alert.alert('Validation Error', 'Please enter a valid account number');
      return false;
    }
    if (!accountHolderName.trim()) {
      Alert.alert('Validation Error', 'Please enter account holder name');
      return false;
    }
    return true;
  };

  const validateExternal = () => {
    if (paymentType === 'check' && !checkNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter check number');
      return false;
    }
    return true;
  };

  const handlePayment = async () => {
    if (processing) return;

    // Validate based on payment method
    let isValid = false;
    switch (paymentMethod) {
      case 'credit_card':
        isValid = validateCreditCard();
        break;
      case 'ach':
        isValid = validateACH();
        break;
      case 'external':
        isValid = validateExternal();
        break;
    }

    if (!isValid) return;

    setProcessing(true);

    try {
      if (paymentMethod === 'credit_card') {
        // For now, simulate credit card processing
        Alert.alert(
          'Credit Card Processing',
          'Credit card payment processing is not yet available. Please use external payment option.',
          [
            {
              text: 'OK',
              onPress: () => {
                setPaymentMethod('external');
                setProcessing(false);
              }
            }
          ]
        );
        return;
      }

      if (paymentMethod === 'ach') {
        // For now, simulate ACH processing
        Alert.alert(
          'ACH Processing',
          'ACH payment processing is not yet available. Please use external payment option.',
          [
            {
              text: 'OK',
              onPress: () => {
                setPaymentMethod('external');
                setProcessing(false);
              }
            }
          ]
        );
        return;
      }

      // Process external payment
      const paymentData = {
        paymentMethod: 'external',
        paymentType,
        checkNumber: paymentType === 'check' ? checkNumber : undefined,
      };

      await processPaymentMutation.mutateAsync(paymentData);
    } catch (error) {
      setProcessing(false);
    }
  };

  const formatCardNumber = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    // Add spaces every 4 digits
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      const formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
      setExpiryDate(formatted);
    } else {
      setExpiryDate(cleaned);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Process Payment</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Invoice Summary */}
          <View style={styles.invoiceSection}>
            <Text style={styles.sectionTitle}>Invoice Details</Text>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Invoice #:</Text>
              <Text style={styles.invoiceValue}>{invoice.invoiceNumber}</Text>
            </View>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Total Amount:</Text>
              <Text style={styles.totalAmount}>${parseFloat(invoice.total).toFixed(2)}</Text>
            </View>
          </View>

          {/* Payment Method Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            
            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'external' && styles.selectedOption]}
              onPress={() => setPaymentMethod('external')}
            >
              <Ionicons 
                name={paymentMethod === 'external' ? 'radio-button-on' : 'radio-button-off'} 
                size={20} 
                color={paymentMethod === 'external' ? '#007AFF' : '#666'} 
              />
              <Text style={styles.optionText}>External Payment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'credit_card' && styles.selectedOption]}
              onPress={() => setPaymentMethod('credit_card')}
            >
              <Ionicons 
                name={paymentMethod === 'credit_card' ? 'radio-button-on' : 'radio-button-off'} 
                size={20} 
                color={paymentMethod === 'credit_card' ? '#007AFF' : '#666'} 
              />
              <Text style={styles.optionText}>Credit Card</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'ach' && styles.selectedOption]}
              onPress={() => setPaymentMethod('ach')}
            >
              <Ionicons 
                name={paymentMethod === 'ach' ? 'radio-button-on' : 'radio-button-off'} 
                size={20} 
                color={paymentMethod === 'ach' ? '#007AFF' : '#666'} 
              />
              <Text style={styles.optionText}>ACH Bank Transfer</Text>
            </TouchableOpacity>
          </View>

          {/* Payment Forms */}
          {paymentMethod === 'external' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>External Payment Details</Text>
              
              <View style={styles.paymentTypeRow}>
                <TouchableOpacity
                  style={[styles.typeButton, paymentType === 'check' && styles.selectedType]}
                  onPress={() => setPaymentType('check')}
                >
                  <Text style={[styles.typeText, paymentType === 'check' && styles.selectedTypeText]}>
                    Check
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, paymentType === 'cash' && styles.selectedType]}
                  onPress={() => setPaymentType('cash')}
                >
                  <Text style={[styles.typeText, paymentType === 'cash' && styles.selectedTypeText]}>
                    Cash
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, paymentType === 'wire' && styles.selectedType]}
                  onPress={() => setPaymentType('wire')}
                >
                  <Text style={[styles.typeText, paymentType === 'wire' && styles.selectedTypeText]}>
                    Wire Transfer
                  </Text>
                </TouchableOpacity>
              </View>

              {paymentType === 'check' && (
                <TextInput
                  style={styles.input}
                  placeholder="Check Number"
                  value={checkNumber}
                  onChangeText={setCheckNumber}
                  keyboardType="default"
                />
              )}
            </View>
          )}

          {paymentMethod === 'credit_card' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Credit Card Information</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Card Number"
                value={cardNumber}
                onChangeText={formatCardNumber}
                keyboardType="number-pad"
                maxLength={19}
              />
              
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="MM/YY"
                  value={expiryDate}
                  onChangeText={formatExpiryDate}
                  keyboardType="number-pad"
                  maxLength={5}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="CVV"
                  value={cvv}
                  onChangeText={setCvv}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="Cardholder Name"
                value={cardholderName}
                onChangeText={setCardholderName}
                autoCapitalize="words"
              />
            </View>
          )}

          {paymentMethod === 'ach' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bank Account Information</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Routing Number"
                value={routingNumber}
                onChangeText={setRoutingNumber}
                keyboardType="number-pad"
                maxLength={9}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Account Number"
                value={accountNumber}
                onChangeText={setAccountNumber}
                keyboardType="number-pad"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Account Holder Name"
                value={accountHolderName}
                onChangeText={setAccountHolderName}
                autoCapitalize="words"
              />
            </View>
          )}
        </ScrollView>

        {/* Payment Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.payButton, processing && styles.disabledButton]}
            onPress={handlePayment}
            disabled={processing}
          >
            {processing ? (
              <Text style={styles.payButtonText}>Processing...</Text>
            ) : (
              <Text style={styles.payButtonText}>
                Pay ${parseFloat(invoice.total).toFixed(2)}
              </Text>
            )}
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
  invoiceSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  invoiceLabel: {
    fontSize: 14,
    color: '#666',
  },
  invoiceValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedOption: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  paymentTypeRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedType: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  typeText: {
    fontSize: 14,
    color: '#666',
  },
  selectedTypeText: {
    color: 'white',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  payButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PaymentModal;