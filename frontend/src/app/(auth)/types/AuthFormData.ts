export interface AuthFormData {
    name?: string
    email: string
    password: string
    confirmPassword?: string
    rememberMe?: boolean
    agreeToTerms?: boolean
}