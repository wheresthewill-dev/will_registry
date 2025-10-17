/**
 * User Interface
 * Generated from database schema for public.users table
 */

// Role enum based on your database roles type
export type UserRole = 
'visitor' 
| 'user' 
| 'admin' 
| 'super_admin';

export interface User {
  id: string; // Changed from number to string to match BaseEntity constraint
  email: string | null;
  firstname: string | null;
  lastname: string | null;
  middlename: string | null;
  username: string | null;
  role: UserRole | null;
  auth_uid: string | null; // UUID as string
  profile_img_url: string | null; // Profile image URL
  is_deceased: boolean | null; // Indicates if the user has been marked as deceased
}

// Optional: Create a type for user creation (without id since it's auto-generated)
export type CreateUser = Omit<User, 'id'>;

// Optional: Create a type for user updates (all fields optional except id)
export type UpdateUser = Partial<Omit<User, 'id'>>;

// Optional: Create a type for the full user with computed fields
export interface UserWithFullName extends User {
  fullName: string;
}

// Helper function to get full name
export function getUserFullName(user: User): string {
  const parts = [user.firstname, user.middlename, user.lastname].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : user.username || user.email || 'Unknown User';
}

// Helper function to get display name
export function getUserDisplayName(user: User): string {
  return user.username || getUserFullName(user);
}

// Helper function to check if user is deceased
export function isUserDeceased(user: User): boolean {
  return user.is_deceased === true;
}

// Helper function to get user status for display
export function getUserStatus(user: User): 'active' | 'deceased' {
  return isUserDeceased(user) ? 'deceased' : 'active';
}
