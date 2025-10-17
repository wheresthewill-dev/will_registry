// Emergency Contact Interface
// Defines the structure and validation for user emergency contacts

export interface UserEmergencyContact {
    id: string;
    user_id: number;
    ec_user_id: number;
    relationship: string | null;
    status: 'pending' | 'registered';
    registered_at: string | null;
    invite_token: string | null;
    invite_expires: string | null;
    created_at: string;
    firstname: string | null;
    lastname: string | null;
    email: string | null;
    contact_number: string | null;
}

// Validation functions for emergency contacts
export function validateEmergencyContact(contact: Partial<UserEmergencyContact>): string[] {
    const errors: string[] = [];

    if (!contact.firstname || contact.firstname.trim().length === 0) {
        errors.push('First name is required');
    }

    if (!contact.lastname || contact.lastname.trim().length === 0) {
        errors.push('Last name is required');
    }

    if (!contact.email || contact.email.trim().length === 0) {
        errors.push('Email is required');
    } else if (!isValidEmail(contact.email)) {
        errors.push('Valid email is required');
    }

    if (!contact.relationship || contact.relationship.trim().length === 0) {
        errors.push('Relationship is required');
    }

    if (!contact.contact_number || contact.contact_number.trim().length === 0) {
        errors.push('Contact number is required');
    }

    return errors;
}

// Helper function to validate email format
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Status checking functions
export function isInviteExpired(contact: UserEmergencyContact): boolean {
    if (!contact.invite_expires) return false;
    return new Date(contact.invite_expires) < new Date();
}

export function isEmergencyContactActive(contact: UserEmergencyContact): boolean {
    return contact.status === 'registered' && contact.registered_at !== null;
}

export function isEmergencyContactPending(contact: UserEmergencyContact): boolean {
    return contact.status === 'pending' && !isInviteExpired(contact);
}

// Utility functions for displaying emergency contact information
export function getEmergencyContactFullName(contact: UserEmergencyContact): string {
    const firstName = contact.firstname || '';
    const lastName = contact.lastname || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown Contact';
}

export function getEmergencyContactDisplayStatus(contact: UserEmergencyContact): {
    status: string;
    color: 'green' | 'yellow' | 'red' | 'gray';
    description: string;
} {
    if (isEmergencyContactActive(contact)) {
        return {
            status: 'Active',
            color: 'green',
            description: 'Emergency contact has accepted and is active'
        };
    }
    
    if (isEmergencyContactPending(contact)) {
        return {
            status: 'Pending',
            color: 'yellow',
            description: 'Invitation sent, waiting for response'
        };
    }
    
    if (isInviteExpired(contact)) {
        return {
            status: 'Expired',
            color: 'red',
            description: 'Invitation has expired and needs to be resent'
        };
    }
    
    return {
        status: 'Unknown',
        color: 'gray',
        description: 'Status unclear'
    };
}

export function getTimeUntilExpiry(contact: UserEmergencyContact): string | null {
    if (!contact.invite_expires || contact.status !== 'pending') return null;
    
    const expiryDate = new Date(contact.invite_expires);
    const now = new Date();
    const timeDiff = expiryDate.getTime() - now.getTime();
    
    if (timeDiff <= 0) return 'Expired';
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
        return `${days} day${days !== 1 ? 's' : ''} remaining`;
    } else if (hours > 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''} remaining`;
    } else {
        return 'Less than 1 hour remaining';
    }
}

// Common relationship types for emergency contacts
export const RELATIONSHIP_TYPES = [
    'Spouse',
    'Partner',
    'Parent',
    'Child',
    'Sibling',
    'Grandparent',
    'Grandchild',
    'Aunt/Uncle',
    'Cousin',
    'Friend',
    'Neighbor',
    'Colleague',
    'Other'
] as const;

export type RelationshipType = typeof RELATIONSHIP_TYPES[number];
