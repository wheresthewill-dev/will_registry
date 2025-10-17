import { UserAddress } from "../interfaces/user_address";
import { useSupabaseData } from "../supabase_data";
import { useUserSession } from "./useUserSession";

export function useUserAddresses() {
  const { userId, userLoading } = useUserSession();

    const result = useSupabaseData<UserAddress>({
        table: 'user_addresses',
        customFilter: userId ? {
            column: 'user_id',
            value: userId,
            operator: 'eq'
        } : {
            // When no user is found, use an impossible filter to return no results
            column: 'user_id',
            value: -1, // No user will have ID -1
            operator: 'eq'
        },
        realtime: false,
        enabled: userId !== null && !userLoading 
    }); 
 
    // Address-specific helper functions
    const getPrimaryAddress = () => {
        return result.data[0];
    }

    const formatFullAddress = (address: UserAddress) => {
        const parts = [
            address?.address_line || '',
            address?.town || '',
            address?.state || '',
            address?.post_code || '',
            address?.country || ''
        ].filter(Boolean);

        return parts.join(', ');
    }; 

    const updateAddress = async (addressId: string, updates: Partial<Omit<UserAddress, 'id'>>) => {
        return await result.update(addressId, updates);
    };

    return {
        ...result,
        // Override data to return empty array when no user
        data: userId ? result.data : [],
        // Override loading state to include user loading
        loading: result.loading || userLoading || !userId,
        // Override error to include user errors
        error: result.error || undefined,
        getPrimaryAddress,
        formatFullAddress,
        updateAddress,
    };
}