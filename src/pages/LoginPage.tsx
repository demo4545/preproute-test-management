import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { login } from '../api/services'
import { useAuthStore } from '../store/authStore'
import { showError, showSuccess } from '../utils/toast'
import { IconEye, IconEyeOff } from '../components/icons/Icons'
import logo from '../assets/logo.svg'
import loginIllustration from '../assets/Group.svg'

const loginSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values: LoginForm) => {
    try {
      const data = await login(values.userId, values.password)
      setAuth(data.data.token, data.data.user)
      showSuccess(data.message || 'Login successful')
      navigate('/dashboard')
    } catch (err) {
      const message = isAxiosError(err)
        ? (err.response?.data?.message as string) || 'Invalid credentials. Please try again.'
        : err instanceof Error
          ? err.message
          : 'Invalid credentials. Please try again.'
      showError(message)
    }
  }

  return (
    <div className="login-page">
      <div className="login-shell">
        <div className="login-illustration">
          <img src={loginIllustration} alt="" />
        </div>

        <div className="login-card">
          <img src={logo} alt="Preproute" className="login-logo" />

          <div className="login-header">
            <h1>Login</h1>
            <p>Use your company provided Login credentials</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label htmlFor="userId">User ID</label>
              <input
                id="userId"
                type="text"
                placeholder="Enter User ID"
                autoComplete="username"
                {...register('userId')}
              />
              {errors.userId && <span className="error">{errors.userId.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter Password"
                  autoComplete="current-password"
                  {...register('password')}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((open) => !open)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {errors.password && <span className="error">{errors.password.message}</span>}
            </div>

            <button type="button" className="login-forgot">
              Forgot password?
            </button>

            <button type="submit" className="btn btn-login" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
