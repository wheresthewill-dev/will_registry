/**
 * Emergency Contact Authentication Service
 * Handles server-side creation of emergency contact auth accounts and user records
 * Preserves the current user's session by using server-side operations
 */

interface CreateEmergencyContactAuthData {
    email: string;
    password: string;
    firstname: string;
    lastname: string;
    relationship: string;
}

interface CreateEmergencyContactAuthResult {
    success: boolean;
    userId?: string;
    error?: string;
}

class EmergencyContactAuthService {
    /**
     * Generate a secure temporary password for emergency contacts
     */
    generateTemporaryPassword(): string {
        const length = 12;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let password = "";
        
        // Ensure at least one of each required character type
        password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // Uppercase
        password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // Lowercase
        password += "0123456789"[Math.floor(Math.random() * 10)]; // Number
        password += "!@#$%^&*"[Math.floor(Math.random() * 8)]; // Special char
        
        // Fill the rest randomly
        for (let i = password.length; i < length; i++) {
            password += charset[Math.floor(Math.random() * charset.length)];
        }
        
        // Shuffle the password
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }

    /**
     * Generate a unique invite token for tracking invitations
     */
    generateInviteToken(): string {
        return 'ec_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    /**
     * Create emergency contact auth account and user record via server-side API
     * This preserves the current user's session
     */
    async createEmergencyContactAuth(data: CreateEmergencyContactAuthData): Promise<CreateEmergencyContactAuthResult> {
        try {
            console.log('🔄 Creating emergency contact auth via server-side API...');
            
            const response = await fetch('/api/auth/create-emergency-contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ Server-side emergency contact creation failed:', errorData);
                return {
                    success: false,
                    error: errorData.error || `HTTP ${response.status}: Failed to create emergency contact`
                };
            }

            const result = await response.json();
            console.log('✅ Emergency contact auth created successfully:', result);

            return {
                success: true,
                userId: result.userId
            };

        } catch (error) {
            console.error('❌ Exception in emergency contact auth creation:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Validate emergency contact data before creation
     */
    validateEmergencyContactData(data: CreateEmergencyContactAuthData): string[] {
        const errors: string[] = [];

        if (!data.email || !data.email.trim()) {
            errors.push('Email is required');
        } else if (!this.isValidEmail(data.email)) {
            errors.push('Valid email address is required');
        }

        if (!data.password || data.password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }

        if (!data.firstname || !data.firstname.trim()) {
            errors.push('First name is required');
        }

        if (!data.lastname || !data.lastname.trim()) {
            errors.push('Last name is required');
        }

        if (!data.relationship || !data.relationship.trim()) {
            errors.push('Relationship is required');
        }

        return errors;
    }

    /**
     * Simple email validation
     */
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// Export singleton instance
export const emergencyContactAuthService = new EmergencyContactAuthService();
