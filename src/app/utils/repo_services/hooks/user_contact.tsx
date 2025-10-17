import { UserContact, getContactByType, getContactValue } from "../interfaces/user_contact";
import { useSupabaseData } from "../supabase_data";
import { useUserSession } from "./useUserSession";

export function useUserContacts() {
    const { userId, userLoading } = useUserSession();

    const result = useSupabaseData<UserContact>({
        table: 'user_contacts',
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
    });    // Contact-specific helper functions
    const getContactByType = (type: string): UserContact | undefined => {
        return result.data.find(contact => contact.type === type);
    };

    const getContactValue = (type: string): string | null => {
        const contact = getContactByType(type);
        return contact?.value || null;
    };

    const getPhoneNumber = (): string | null => {
        return getContactValue('phone') || getContactValue('mobile') || getContactValue('telephone');
    };

    const getEmailAddress = (): string | null => {
        return getContactValue('email');
    };

    const updateContact = async (contactId: string, updates: Partial<Omit<UserContact, 'id'>>) => {
        return await result.update(contactId, updates);
    };

    const createContact = async (newContact: Omit<UserContact, 'id'>) => {
        return await result.create(newContact);
    };

    const deleteContact = async (contactId: string) => {
        return await result.remove(contactId);
    };

    return {
        ...result,
        // Override data to return empty array when no user
        data: userId ? result.data : [],
        // Override loading state to include user loading
        loading: result.loading || userLoading || !userId,
        // Override error to include user errors
        error: result.error || undefined,
        getContactByType,
        getContactValue,
        getPhoneNumber,
        getEmailAddress,
        updateContact,
        createContact,
        deleteContact,
    };
}
