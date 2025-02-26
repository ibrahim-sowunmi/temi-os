/**
 * This file contains configurations for different Stripe Connect embedded components
 */

export type StripeComponentType = 
  | 'account_management'
  | 'balances'
  | 'payments'
  | 'payment_details'
  | 'payouts'
  | 'payouts_list'
  | 'tax_settings';

export interface StripeComponentConfig {
  enabled: boolean;
  features?: Record<string, boolean>;
}

// Map component types to their API configurations
export const getComponentConfig = (componentType: StripeComponentType): StripeComponentConfig => {
  switch (componentType) {
    case 'account_management':
      return {
        enabled: true,
        features: {
          external_account_collection: true,
        },
      };
    
    case 'balances':
      return {
        enabled: true,
        features: {
          instant_payouts: true,
          standard_payouts: true,
          edit_payout_schedule: true,
        },
      };
    
    case 'payments':
      return {
        enabled: true,
        features: {
          refund_management: true,
          dispute_management: true,
          capture_payments: true,
          destination_on_behalf_of_charge_management: false,
        },
      };
    
    case 'payment_details':
      return {
        enabled: true,
        features: {
          refund_management: true,
          dispute_management: true,
          capture_payments: true,
          destination_on_behalf_of_charge_management: false,
        },
      };
    
    case 'payouts':
      return {
        enabled: true,
        features: {
          instant_payouts: true,
          standard_payouts: true,
          edit_payout_schedule: true,
          external_account_collection: true,
        },
      };
    
    case 'payouts_list':
      return {
        enabled: true,
      };
    
    case 'tax_settings':
      return {
        enabled: true,
      };
    
    default:
      return {
        enabled: true,
      };
  }
};

// Returns all component configurations for the API
export const getAllComponentConfigs = (componentTypes: StripeComponentType[]): Record<string, StripeComponentConfig> => {
  const configs: Record<string, StripeComponentConfig> = {};
  
  componentTypes.forEach(type => {
    configs[type] = getComponentConfig(type);
  });
  
  return configs;
}; 