export interface UserContact {
    id: string;
    type: string | null;
    value: string | null;
    user_id: number | null;
}

// Helper function to get contact by type
export function getContactByType(contacts: UserContact[], type: string): UserContact | undefined {
    return contacts.find(contact => contact.type === type);
}

// Helper function to get contact value by type
export function getContactValue(contacts: UserContact[], type: string): string | null {
    const contact = getContactByType(contacts, type);
    return contact?.value || null;
}

// Helper function to format contact display
export function formatContactDisplay(contact: UserContact): string {
    if (!contact.type || !contact.value) return '';
    return `${contact.type}: ${contact.value}`;
}
