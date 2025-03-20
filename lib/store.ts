import { Platform } from 'react-native';
import * as StoreKit from 'react-native-purchases';
import { supabase } from './supabase';

const STORE_API_KEYS = {
  apple: 'YOUR_REVENUECAT_API_KEY',
  google: 'YOUR_REVENUECAT_API_KEY'
};

export async function initializeStore() {
  if (Platform.OS === 'web') return;

  try {
    await StoreKit.configure({
      apiKey: STORE_API_KEYS[Platform.OS === 'ios' ? 'apple' : 'google'],
      appUserID: (await supabase.auth.getUser()).data.user?.id
    });
  } catch (error) {
    console.error('Failed to initialize store:', error);
  }
}

export async function getProducts() {
  if (Platform.OS === 'web') return [];

  try {
    const { data: products } = await supabase
      .from('store_products')
      .select('*')
      .eq('store_type', Platform.OS === 'ios' ? 'apple' : 'google')
      .eq('is_active', true);

    if (!products?.length) return [];

    const offerings = await StoreKit.getOfferings();
    return offerings.current?.availablePackages || [];
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
}

export async function purchaseProduct(productId: string) {
  if (Platform.OS === 'web') {
    throw new Error('In-app purchases are not available on web');
  }

  try {
    const { customerInfo, productIdentifier } = await StoreKit.purchaseProduct(productId);

    // Store receipt in database
    await supabase.from('purchase_receipts').insert({
      store_type: Platform.OS === 'ios' ? 'apple' : 'google',
      product_id: productIdentifier,
      receipt_data: customerInfo.originalAppUserId,
      original_transaction_id: customerInfo.originalTransactionId,
      purchase_date: new Date(customerInfo.latestExpirationDate || Date.now()),
      expires_date: customerInfo.latestExpirationDate 
        ? new Date(customerInfo.latestExpirationDate)
        : null,
      is_trial: customerInfo.entitlements.active['premium']?.isTrialPeriod || false,
      is_active: true
    });

    return true;
  } catch (error) {
    console.error('Purchase failed:', error);
    throw error;
  }
}

export async function restorePurchases() {
  if (Platform.OS === 'web') {
    throw new Error('In-app purchases are not available on web');
  }

  try {
    const customerInfo = await StoreKit.restorePurchases();
    return customerInfo.activeSubscriptions.length > 0;
  } catch (error) {
    console.error('Restore failed:', error);
    throw error;
  }
}