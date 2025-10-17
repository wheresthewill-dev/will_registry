export type AuthorizedRepresentativeStatus = 'pending' | 'registered';

export interface UserAuthorizedRepresentative {
    id: string; // Changed from number to string to match BaseEntity constraint
    user_id: number;
    ar_user_id: number;
    firstname: string;
    lastname: string;
    email: string;
    status: AuthorizedRepresentativeStatus | null;
    registered_at: string | null; // ISO timestamp string
    invite_token: string | null;
    invite_expires: string | null; // ISO timestamp string
    created_at: string | null; // ISO timestamp string
}

// Helper function to check if invitation is expired
export function isInviteExpired(representative: UserAuthorizedRepresentative): boolean {
    if (!representative.invite_expires) return false;
    return new Date(representative.invite_expires) < new Date();
}

// Helper function to check if representative is active/registered
export function isRepresentativeActive(representative: UserAuthorizedRepresentative): boolean {
    return representative.status === 'registered';
}

// Helper function to check if representative is pending
export function isRepresentativePending(representative: UserAuthorizedRepresentative): boolean {
    return representative.status === 'pending' && !isInviteExpired(representative);
}

// Helper function to format registration date
export function getRegistrationDate(representative: UserAuthorizedRepresentative): string | null {
    if (!representative.registered_at) return null;
    return new Date(representative.registered_at).toLocaleDateString();
}

// Helper function to format created date
export function getCreatedDate(representative: UserAuthorizedRepresentative): string | null {
    if (!representative.created_at) return null;
    return new Date(representative.created_at).toLocaleDateString();
}

// Helper function to get invite expiry date
export function getInviteExpiryDate(representative: UserAuthorizedRepresentative): string | null {
    if (!representative.invite_expires) return null;
    return new Date(representative.invite_expires).toLocaleDateString();
}

// Helper function to get full name
export function getRepresentativeFullName(representative: UserAuthorizedRepresentative): string {
    return `${representative.firstname} ${representative.lastname}`;
}

// Helper function to get display name with fallback
export function getRepresentativeDisplayName(representative: UserAuthorizedRepresentative): string {
    if (representative.firstname && representative.lastname) {
        return `${representative.firstname} ${representative.lastname}`;
    }
    return representative.email || `Representative #${representative.id}`;
}
